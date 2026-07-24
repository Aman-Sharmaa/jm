/**
 * Jantar Mantar — Mesh Orchestrator
 * Author: Aman Sharma
 *
 * Top-level coordinator that manages BLE, Wi-Fi Direct, and Nearby Connections.
 * Routes incoming packets, maintains the network graph, and dispatches events
 * to the Redux store via callbacks.
 */

import { EventEmitter } from 'events';
import { AppState, AppStateStatus } from 'react-native';
import { BLEManager } from './bluetooth/BLEManager';
import { NearbyManager } from './nearby/NearbyManager';
import { WiFiDirectManager } from './wifi/WiFiDirectManager';
import { RoutingEngine } from './routing/RoutingEngine';
import { GatewayDetector } from './gateway/GatewayDetector';
import {
  HEARTBEAT_INTERVAL_MS,
  PEER_TIMEOUT_HEARTBEATS,
  DISCOVERY_BROADCAST_INTERVAL_MS,
} from '../constants';
import type {
  MeshPeer,
  MeshPacket,
  PacketType,
  DeviceIdentity,
  AppSettings,
} from '../types';

export type MeshEvent =
  | { type: 'peer_joined'; peer: MeshPeer }
  | { type: 'peer_updated'; peer: MeshPeer }
  | { type: 'peer_left'; deviceId: string }
  | { type: 'packet_received'; packet: MeshPacket }
  | { type: 'gateway_available'; deviceId: string; latency: number }
  | { type: 'gateway_lost' }
  | { type: 'topology_changed' };

export class MeshOrchestrator extends EventEmitter {
  private ble: BLEManager;
  private nearby: NearbyManager;
  private wifi: WiFiDirectManager;
  private routing: RoutingEngine;
  private gateway: GatewayDetector;

  private identity: DeviceIdentity;
  private settings: AppSettings;
  private isRunning = false;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private peerMissedHeartbeats: Map<string, number> = new Map();

  private broadcastTimer: ReturnType<typeof setInterval> | null = null;

  // Seenpacket nonces for replay protection (sliding window)
  private seenNonces: Set<string> = new Set();
  private seenNoncesOrder: string[] = [];
  private readonly NONCE_WINDOW = 1000;

  constructor(identity: DeviceIdentity, settings: AppSettings) {
    super();
    this.identity = identity;
    this.settings = settings;

    this.ble = new BLEManager();
    this.nearby = new NearbyManager();
    this.wifi = new WiFiDirectManager();
    this.routing = new RoutingEngine(identity.deviceId);
    this.gateway = new GatewayDetector(
      identity.deviceId,
      () => 100, // TODO: wire up real battery level from DeviceInfo
    );

    this._wireTransportEvents();
    this._wireRoutingEvents();
    this._wireGatewayEvents();
    this._wireAppStateEvents();
  }

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    const payload = this._buildDiscoveryPayload();

    if (this.settings.bluetoothEnabled) {
      await this.ble.startAdvertising(payload);
      await this.ble.startScanning();
    }

    if (this.settings.nearbyEnabled) {
      await this.nearby.startAdvertising(this.identity.displayName);
      await this.nearby.startDiscovery();
    }

    if (this.settings.wifiDirectEnabled) {
      await this.wifi.startDiscovery();
    }

    this.gateway.start();
    this._startHeartbeat();
    this._startBroadcastLoop();

    console.log('[MeshOrchestrator] Started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    await Promise.allSettled([
      this.ble.stopAll(),
      this.nearby.stopAll(),
      this.wifi.stopAll(),
    ]);

    this.gateway.stop();
    this._stopHeartbeat();
    this._stopBroadcastLoop();

    console.log('[MeshOrchestrator] Stopped');
  }

  // ─────────────────────────────────────────────
  // Packet Sending
  // ─────────────────────────────────────────────

  /**
   * Send a mesh packet to a specific device, routing through intermediate hops.
   */
  async sendPacket(packet: MeshPacket): Promise<boolean> {
    if (packet.targetId === 'broadcast') {
      await this.nearby.broadcast(packet);
      return true;
    }

    const route = this.routing.getRoute(packet.targetId);
    if (!route || route.path.length < 2) {
      console.warn('[MeshOrchestrator] No route to', packet.targetId);
      return false;
    }

    // Next hop is path[1] (path[0] is self)
    const nextHopId = route.path[1];
    const payload = JSON.stringify(packet);

    // Try Nearby first (highest bandwidth), then BLE
    const endpointId = this.nearby.getEndpointForPeer(nextHopId);
    if (endpointId) {
      await this.nearby.sendBytesPayload(endpointId, payload);
      return true;
    }

    // Fallback to BLE
    try {
      await this.ble.sendData(nextHopId, payload);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Relay a received packet (decrement TTL, add self to hop path).
   */
  async relayPacket(packet: MeshPacket): Promise<void> {
    if (!this.settings.autoRelay) return;
    if (packet.ttl <= 0) return;

    const relayed: MeshPacket = {
      ...packet,
      ttl: packet.ttl - 1,
      hopPath: [...packet.hopPath, this.identity.deviceId],
    };

    await this.sendPacket(relayed);
  }

  // ─────────────────────────────────────────────
  // Incoming Packet Handling
  // ─────────────────────────────────────────────

  private _handleIncomingPacket(raw: string): void {
    try {
      const packet: MeshPacket = JSON.parse(raw);

      // Replay protection
      if (this.seenNonces.has(packet.nonce)) return;
      this._recordNonce(packet.nonce);

      // If targeted at us, emit to upper layers
      if (packet.targetId === this.identity.deviceId || packet.targetId === 'broadcast') {
        this.emit('packet_received', { type: 'packet_received', packet });
        this._handlePacketByType(packet);
      }

      // Relay to next hop if not the final destination
      if (packet.targetId !== this.identity.deviceId) {
        this.relayPacket(packet);
      }
    } catch (e) {
      console.warn('[MeshOrchestrator] Failed to parse packet:', e);
    }
  }

  private _handlePacketByType(packet: MeshPacket): void {
    switch (packet.type as PacketType) {
      case 'discovery':
        this._handleDiscoveryPacket(packet);
        break;
      case 'heartbeat':
        this._handleHeartbeat(packet);
        break;
      case 'gateway':
        this._handleGatewayPacket(packet);
        break;
      default:
        // message, chunk, ack, sos — forwarded to MessageService/ChunkManager
        break;
    }
  }

  private _handleDiscoveryPacket(packet: MeshPacket): void {
    try {
      const peerData = JSON.parse(packet.payload) as MeshPeer;
      const peer: MeshPeer = {
        ...peerData,
        hopCount: packet.hopPath.length + 1,
        lastSeen: Date.now(),
      };
      this.routing.peerDiscovered(peer);
      this.emit('peer_joined', { type: 'peer_joined', peer });
    } catch (e) {
      console.warn('[MeshOrchestrator] Discovery packet parse error:', e);
    }
  }

  private _handleHeartbeat(packet: MeshPacket): void {
    this.peerMissedHeartbeats.set(packet.senderId, 0);
    this.routing.peerUpdated(packet.senderId, { lastSeen: Date.now(), status: 'online' });
  }

  private _handleGatewayPacket(packet: MeshPacket): void {
    try {
      const info = JSON.parse(packet.payload);
      this.routing.peerUpdated(packet.senderId, {
        hasInternet: true,
        internetLatency: info.latency,
      });
      this.emit('gateway_available', {
        type: 'gateway_available',
        deviceId: packet.senderId,
        latency: info.latency,
      });
    } catch {
      // ignore malformed
    }
  }

  // ─────────────────────────────────────────────
  // Heartbeat
  // ─────────────────────────────────────────────

  private _startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      // Send our heartbeat
      const packet = this._makePacket('heartbeat', 'broadcast', '{}');
      this.sendPacket(packet);

      // Check for stale peers
      for (const [deviceId, missed] of this.peerMissedHeartbeats) {
        const newMissed = missed + 1;
        if (newMissed >= PEER_TIMEOUT_HEARTBEATS) {
          this.peerMissedHeartbeats.delete(deviceId);
          this.routing.peerLost(deviceId);
          this.emit('peer_left', { type: 'peer_left', deviceId });
        } else {
          this.peerMissedHeartbeats.set(deviceId, newMissed);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ─────────────────────────────────────────────
  // Discovery Broadcast Loop
  // ─────────────────────────────────────────────

  private _startBroadcastLoop(): void {
    this.broadcastTimer = setInterval(() => {
      const payload = this._buildDiscoveryPayload();
      const packet = this._makePacket('discovery', 'broadcast', payload);
      this.sendPacket(packet);

      // Broadcast gateway status if we have internet
      const gwInfo = this.gateway.getLastInfo();
      if (gwInfo?.hasInternet) {
        const gwPacket = this._makePacket('gateway', 'broadcast', JSON.stringify(gwInfo));
        this.sendPacket(gwPacket);
      }
    }, DISCOVERY_BROADCAST_INTERVAL_MS);
  }

  private _stopBroadcastLoop(): void {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = null;
    }
  }

  // ─────────────────────────────────────────────
  // Event Wiring
  // ─────────────────────────────────────────────

  private _wireTransportEvents(): void {
    // BLE
    this.ble.on('peer_discovered', ({ peer }) => {
      this.routing.peerDiscovered(peer);
      this.peerMissedHeartbeats.set(peer.deviceId, 0);
      this.emit('peer_joined', { type: 'peer_joined', peer });
    });
    this.ble.on('peer_lost', ({ deviceId }) => {
      this.routing.peerLost(deviceId);
      this.peerMissedHeartbeats.delete(deviceId);
      this.emit('peer_left', { type: 'peer_left', deviceId });
    });
    this.ble.on('data_received', ({ data }) => this._handleIncomingPacket(data));

    // Nearby
    this.nearby.on('peer_found', ({ peer }) => {
      this.routing.peerDiscovered(peer);
      this.peerMissedHeartbeats.set(peer.deviceId, 0);
      this.emit('peer_joined', { type: 'peer_joined', peer });
    });
    this.nearby.on('peer_lost', ({ deviceId }) => {
      this.routing.peerLost(deviceId);
      this.emit('peer_left', { type: 'peer_left', deviceId });
    });
    this.nearby.on('payload_received', ({ payload }) => this._handleIncomingPacket(payload));

    // Wi-Fi Direct
    this.wifi.on('peers_discovered', ({ peers }) => {
      peers.forEach((peer: MeshPeer) => {
        this.routing.peerDiscovered(peer);
        this.emit('peer_joined', { type: 'peer_joined', peer });
      });
    });
    this.wifi.on('data_received', ({ data }) => this._handleIncomingPacket(data));
  }

  private _wireRoutingEvents(): void {
    this.routing.on('topology_changed', () => {
      this.emit('topology_changed', { type: 'topology_changed' });
    });
  }

  private _wireGatewayEvents(): void {
    this.gateway.on('gateway_available', ({ info }) => {
      this.emit('gateway_available', {
        type: 'gateway_available',
        deviceId: this.identity.deviceId,
        latency: info.latency,
      });
    });
    this.gateway.on('gateway_lost', () => {
      this.emit('gateway_lost', { type: 'gateway_lost' });
    });
  }

  private _wireAppStateEvents(): void {
    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        // Reduce scan frequency in background (foreground service handles it)
        console.log('[MeshOrchestrator] App backgrounded — service continues');
      }
    });
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private _buildDiscoveryPayload(): string {
    return JSON.stringify({
      deviceId: this.identity.deviceId,
      displayName: this.identity.displayName,
      publicKey: this.identity.publicKey,
      battery: 100,
      internet: this.gateway.isOnline() ? 1 : 0,
      latency: this.gateway.getLastInfo()?.latency,
      hops: 0,
      version: '1.0.0',
      caps: 'relay,file_transfer',
    });
  }

  private _makePacket(type: PacketType, targetId: string, payload: string): MeshPacket {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      senderId: this.identity.deviceId,
      targetId,
      payload,
      ttl: 20,
      timestamp: Date.now(),
      signature: '',  // TODO: sign with CryptoService
      nonce: Math.random().toString(36).slice(2),
      hopPath: [this.identity.deviceId],
    };
  }

  private _recordNonce(nonce: string): void {
    this.seenNonces.add(nonce);
    this.seenNoncesOrder.push(nonce);
    if (this.seenNoncesOrder.length > this.NONCE_WINDOW) {
      const oldest = this.seenNoncesOrder.shift()!;
      this.seenNonces.delete(oldest);
    }
  }

  // Public accessors
  getRoutingEngine(): RoutingEngine { return this.routing; }
  getGatewayDetector(): GatewayDetector { return this.gateway; }
  getTopology() { return this.routing.getTopologySnapshot(); }
}

export default MeshOrchestrator;
