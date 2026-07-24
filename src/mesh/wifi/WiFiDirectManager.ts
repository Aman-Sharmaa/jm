/**
 * Jantar Mantar — Wi-Fi Direct Manager
 * Author: Aman Sharma
 *
 * Bridges to the native Kotlin WiFiDirectModule.
 * Wi-Fi Direct provides high-throughput peer-to-peer connections
 * ideal for large file transfers between nearby devices.
 */

import { NativeModules, NativeEventEmitter } from 'react-native';
import { EventEmitter } from 'events';
import { WIFI_DIRECT_SERVICE_TYPE } from '../../constants';
import type { MeshPeer, TransportType } from '../../types';

const { WiFiDirectModule } = NativeModules;
const wifiEmitter = WiFiDirectModule ? new NativeEventEmitter(WiFiDirectModule) : null;

export type WiFiDirectEvent =
  | { type: 'peers_discovered'; peers: MeshPeer[] }
  | { type: 'connection_established'; deviceId: string; groupOwner: boolean; groupOwnerAddress: string }
  | { type: 'connection_failed'; deviceId: string; error: string }
  | { type: 'disconnected'; deviceId: string }
  | { type: 'data_received'; deviceId: string; data: string };

export class WiFiDirectManager extends EventEmitter {
  private isDiscovering = false;
  private connectedPeers: Set<string> = new Set();
  private subscriptions: Array<{ remove: () => void }> = [];
  private groupOwnerAddress: string | null = null;

  async startDiscovery(): Promise<void> {
    if (this.isDiscovering) return;
    if (!WiFiDirectModule) {
      console.warn('[WiFiDirectManager] Native module not available');
      return;
    }
    await WiFiDirectModule.discoverPeers(WIFI_DIRECT_SERVICE_TYPE);
    this.isDiscovering = true;
    this._registerListeners();
    console.log('[WiFiDirectManager] Discovery started');
  }

  async stopDiscovery(): Promise<void> {
    if (!WiFiDirectModule) return;
    await WiFiDirectModule.stopDiscovery();
    this.isDiscovering = false;
  }

  async connect(deviceAddress: string, deviceId: string): Promise<void> {
    if (!WiFiDirectModule) throw new Error('WiFiDirectModule not available');
    await WiFiDirectModule.connect(deviceAddress, deviceId);
  }

  async disconnect(deviceId: string): Promise<void> {
    if (!WiFiDirectModule) return;
    await WiFiDirectModule.disconnect(deviceId);
    this.connectedPeers.delete(deviceId);
  }

  /**
   * Send data over Wi-Fi Direct socket.
   * Primary transport for chunk transfer payloads.
   */
  async sendData(deviceId: string, data: string): Promise<void> {
    if (!WiFiDirectModule) throw new Error('WiFiDirectModule not available');
    const address = this.groupOwnerAddress;
    if (!address) throw new Error('No Wi-Fi Direct group established');
    return WiFiDirectModule.sendData(address, data);
  }

  async sendFile(deviceId: string, filePath: string): Promise<void> {
    if (!WiFiDirectModule) throw new Error('WiFiDirectModule not available');
    return WiFiDirectModule.sendFile(deviceId, filePath);
  }

  isConnected(deviceId: string): boolean {
    return this.connectedPeers.has(deviceId);
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers);
  }

  private _registerListeners(): void {
    if (!wifiEmitter) return;

    this.subscriptions.push(
      wifiEmitter.addListener('WIFI_DIRECT_PEERS_CHANGED', (e: Record<string, unknown>) => {
        const peers = this._parsePeerList(e.peers as Record<string, unknown>[]);
        this.emit('peers_discovered', { type: 'peers_discovered', peers });
      }),

      wifiEmitter.addListener('WIFI_DIRECT_CONNECTED', (e: Record<string, unknown>) => {
        const deviceId = e.deviceId as string;
        this.connectedPeers.add(deviceId);
        this.groupOwnerAddress = e.groupOwnerAddress as string;
        this.emit('connection_established', {
          type: 'connection_established',
          deviceId,
          groupOwner: e.groupOwner as boolean,
          groupOwnerAddress: e.groupOwnerAddress as string,
        });
      }),

      wifiEmitter.addListener('WIFI_DIRECT_FAILED', (e: Record<string, unknown>) => {
        this.emit('connection_failed', {
          type: 'connection_failed',
          deviceId: e.deviceId as string,
          error: e.error as string,
        });
      }),

      wifiEmitter.addListener('WIFI_DIRECT_DISCONNECTED', (e: { deviceId: string }) => {
        this.connectedPeers.delete(e.deviceId);
        this.emit('disconnected', { type: 'disconnected', deviceId: e.deviceId });
      }),

      wifiEmitter.addListener('WIFI_DIRECT_DATA_RECEIVED', (e: Record<string, unknown>) => {
        this.emit('data_received', {
          type: 'data_received',
          deviceId: e.deviceId as string,
          data: e.data as string,
        });
      }),
    );
  }

  private _removeListeners(): void {
    this.subscriptions.forEach(s => s.remove());
    this.subscriptions = [];
  }

  private _parsePeerList(rawPeers: Record<string, unknown>[]): MeshPeer[] {
    return (rawPeers ?? []).map(raw => ({
      deviceId: raw.deviceAddress as string,
      displayName: raw.deviceName as string,
      publicKey: '',
      transport: ['wifi_direct'] as TransportType[],
      signalStrength: -50,
      batteryLevel: 100,
      hasInternet: false,
      hopCount: 1,
      lastSeen: Date.now(),
      status: 'online' as const,
      appVersion: '1.0.0',
      capabilities: [],
    }));
  }

  async stopAll(): Promise<void> {
    await this.stopDiscovery();
    this._removeListeners();
    this.connectedPeers.clear();
  }
}

export default WiFiDirectManager;
