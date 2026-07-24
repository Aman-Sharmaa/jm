/**
 * Jantar Mantar — Nearby Connections Manager
 * Author: Aman Sharma
 *
 * Bridges to the native Kotlin NearbyModule (Google Nearby Connections API).
 * Handles high-bandwidth peer-to-peer connections for file transfer and messaging.
 */

import { NativeModules, NativeEventEmitter } from 'react-native';
import { EventEmitter } from 'events';
import { NEARBY_SERVICE_ID } from '../../constants';
import type { MeshPeer, MeshPacket, TransportType } from '../../types';

const { NearbyModule } = NativeModules;
const nearbyEmitter = NearbyModule ? new NativeEventEmitter(NearbyModule) : null;

export type NearbyEvent =
  | { type: 'peer_found'; peer: MeshPeer; endpointId: string }
  | { type: 'peer_lost'; endpointId: string; deviceId: string }
  | { type: 'connection_initiated'; endpointId: string; deviceId: string }
  | { type: 'connection_established'; endpointId: string; deviceId: string }
  | { type: 'connection_failed'; endpointId: string; error: string }
  | { type: 'payload_received'; endpointId: string; payload: string }
  | { type: 'payload_transfer_update'; endpointId: string; progress: number }
  | { type: 'disconnected'; endpointId: string; deviceId: string };

export class NearbyManager extends EventEmitter {
  private isDiscovering = false;
  private isAdvertising = false;
  private connectedEndpoints: Map<string, string> = new Map(); // endpointId → deviceId
  private subscriptions: Array<{ remove: () => void }> = [];

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  async startAdvertising(localDeviceName: string): Promise<void> {
    if (this.isAdvertising) return;
    if (!NearbyModule) {
      console.warn('[NearbyManager] Native module not available');
      return;
    }
    await NearbyModule.startAdvertising(NEARBY_SERVICE_ID, localDeviceName);
    this.isAdvertising = true;
    this._registerListeners();
    console.log('[NearbyManager] Advertising started');
  }

  async startDiscovery(): Promise<void> {
    if (this.isDiscovering) return;
    if (!NearbyModule) {
      console.warn('[NearbyManager] Native module not available');
      return;
    }
    await NearbyModule.startDiscovery(NEARBY_SERVICE_ID);
    this.isDiscovering = true;
    console.log('[NearbyManager] Discovery started');
  }

  async stopAll(): Promise<void> {
    if (NearbyModule) {
      await NearbyModule.stopAll();
    }
    this.isDiscovering = false;
    this.isAdvertising = false;
    this.connectedEndpoints.clear();
    this._removeListeners();
  }

  // ─────────────────────────────────────────────
  // Connection Management
  // ─────────────────────────────────────────────

  async connect(endpointId: string): Promise<void> {
    if (!NearbyModule) throw new Error('NearbyModule not available');
    await NearbyModule.connect(endpointId);
  }

  async disconnect(endpointId: string): Promise<void> {
    if (!NearbyModule) return;
    await NearbyModule.disconnect(endpointId);
    const deviceId = this.connectedEndpoints.get(endpointId);
    this.connectedEndpoints.delete(endpointId);
    if (deviceId) {
      this.emit('disconnected', { type: 'disconnected', endpointId, deviceId });
    }
  }

  // ─────────────────────────────────────────────
  // Data Transfer
  // ─────────────────────────────────────────────

  /**
   * Send a small bytes payload (control messages, chat).
   */
  async sendBytesPayload(endpointId: string, data: string): Promise<void> {
    if (!NearbyModule) throw new Error('NearbyModule not available');
    return NearbyModule.sendBytesPayload(endpointId, data);
  }

  /**
   * Send a file payload (large files — uses Nearby Connections stream mode).
   */
  async sendFilePayload(endpointId: string, filePath: string, transferId: string): Promise<void> {
    if (!NearbyModule) throw new Error('NearbyModule not available');
    return NearbyModule.sendFilePayload(endpointId, filePath, transferId);
  }

  /**
   * Broadcast a packet to all connected endpoints.
   */
  async broadcast(packet: MeshPacket): Promise<void> {
    const payload = JSON.stringify(packet);
    const promises = Array.from(this.connectedEndpoints.keys()).map(endpointId =>
      this.sendBytesPayload(endpointId, payload).catch(e =>
        console.warn(`[NearbyManager] Broadcast to ${endpointId} failed:`, e),
      ),
    );
    await Promise.allSettled(promises);
  }

  getConnectedPeerIds(): string[] {
    return Array.from(this.connectedEndpoints.values());
  }

  getEndpointForPeer(deviceId: string): string | undefined {
    for (const [endpointId, dId] of this.connectedEndpoints) {
      if (dId === deviceId) return endpointId;
    }
    return undefined;
  }

  // ─────────────────────────────────────────────
  // Native Event Wiring
  // ─────────────────────────────────────────────

  private _registerListeners(): void {
    if (!nearbyEmitter) return;

    this.subscriptions.push(
      nearbyEmitter.addListener('NEARBY_ENDPOINT_FOUND', (e: Record<string, unknown>) => {
        const peer = this._parseEndpointInfo(e);
        this.emit('peer_found', {
          type: 'peer_found',
          peer,
          endpointId: e.endpointId as string,
        });
      }),

      nearbyEmitter.addListener('NEARBY_ENDPOINT_LOST', (e: { endpointId: string }) => {
        const deviceId = this.connectedEndpoints.get(e.endpointId) ?? '';
        this.emit('peer_lost', { type: 'peer_lost', endpointId: e.endpointId, deviceId });
      }),

      nearbyEmitter.addListener('NEARBY_CONNECTION_INITIATED', (e: Record<string, unknown>) => {
        this.emit('connection_initiated', {
          type: 'connection_initiated',
          endpointId: e.endpointId as string,
          deviceId: e.deviceId as string,
        });
      }),

      nearbyEmitter.addListener('NEARBY_CONNECTION_RESULT', (e: Record<string, unknown>) => {
        if ((e.status as string) === 'OK') {
          const deviceId = e.deviceId as string;
          this.connectedEndpoints.set(e.endpointId as string, deviceId);
          this.emit('connection_established', {
            type: 'connection_established',
            endpointId: e.endpointId as string,
            deviceId,
          });
        } else {
          this.emit('connection_failed', {
            type: 'connection_failed',
            endpointId: e.endpointId as string,
            error: e.statusMessage as string ?? 'Unknown error',
          });
        }
      }),

      nearbyEmitter.addListener('NEARBY_PAYLOAD_RECEIVED', (e: Record<string, unknown>) => {
        this.emit('payload_received', {
          type: 'payload_received',
          endpointId: e.endpointId as string,
          payload: e.payload as string,
        });
      }),

      nearbyEmitter.addListener('NEARBY_PAYLOAD_TRANSFER_UPDATE', (e: Record<string, unknown>) => {
        this.emit('payload_transfer_update', {
          type: 'payload_transfer_update',
          endpointId: e.endpointId as string,
          progress: e.progress as number,
        });
      }),

      nearbyEmitter.addListener('NEARBY_DISCONNECTED', (e: Record<string, unknown>) => {
        const deviceId = this.connectedEndpoints.get(e.endpointId as string) ?? '';
        this.connectedEndpoints.delete(e.endpointId as string);
        this.emit('disconnected', {
          type: 'disconnected',
          endpointId: e.endpointId as string,
          deviceId,
        });
      }),
    );
  }

  private _removeListeners(): void {
    this.subscriptions.forEach(s => s.remove());
    this.subscriptions = [];
  }

  private _parseEndpointInfo(raw: Record<string, unknown>): MeshPeer {
    return {
      deviceId: raw.deviceId as string,
      displayName: raw.displayName as string,
      publicKey: raw.publicKey as string ?? '',
      transport: ['nearby'] as TransportType[],
      signalStrength: -70,
      batteryLevel: raw.battery as number ?? 50,
      hasInternet: (raw.internet as number) === 1,
      hopCount: 1,
      lastSeen: Date.now(),
      status: 'online',
      appVersion: raw.version as string ?? '1.0.0',
      capabilities: [],
    };
  }
}

export default NearbyManager;
