/**
 * Jantar Mantar — BLE Manager
 * Author: Aman Sharma
 *
 * Bridges to the native Kotlin BLEModule for Bluetooth LE advertisement
 * and scanning. Emits discovered peer events to the MeshOrchestrator.
 */

import { NativeModules, NativeEventEmitter } from 'react-native';
import { EventEmitter } from 'events';
import {
  MESH_SERVICE_UUID,
  BLE_CHARACTERISTIC_UUID,
  DISCOVERY_BROADCAST_INTERVAL_MS,
} from '../../constants';
import type { MeshPeer, TransportType } from '../../types';

const { BLEModule } = NativeModules;
const bleEmitter = BLEModule ? new NativeEventEmitter(BLEModule) : null;

export type BLEEvent =
  | { type: 'peer_discovered'; peer: MeshPeer }
  | { type: 'peer_lost'; deviceId: string }
  | { type: 'rssi_updated'; deviceId: string; rssi: number }
  | { type: 'data_received'; deviceId: string; data: string }
  | { type: 'error'; error: string };

export class BLEManager extends EventEmitter {
  private isAdvertising = false;
  private isScanning = false;
  private subscriptions: Array<{ remove: () => void }> = [];

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  async startAdvertising(devicePayload: string): Promise<void> {
    if (this.isAdvertising) return;
    if (!BLEModule) {
      console.warn('[BLEManager] Native module not available');
      return;
    }
    try {
      await BLEModule.startAdvertising(MESH_SERVICE_UUID, BLE_CHARACTERISTIC_UUID, devicePayload);
      this.isAdvertising = true;
      console.log('[BLEManager] Advertising started');
    } catch (e) {
      this.emit('error', { type: 'error', error: String(e) });
    }
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) return;
    if (!BLEModule) {
      console.warn('[BLEManager] Native module not available');
      return;
    }
    try {
      await BLEModule.startScanning(MESH_SERVICE_UUID);
      this.isScanning = true;
      this._registerNativeListeners();
      console.log('[BLEManager] Scanning started');
    } catch (e) {
      this.emit('error', { type: 'error', error: String(e) });
    }
  }

  async stopAll(): Promise<void> {
    if (BLEModule) {
      await BLEModule.stopAll();
    }
    this.isAdvertising = false;
    this.isScanning = false;
    this._removeNativeListeners();
    console.log('[BLEManager] Stopped');
  }

  /**
   * Send raw data to a BLE peripheral.
   * Used for small control messages; large data goes over Wi-Fi Direct.
   */
  async sendData(deviceId: string, data: string): Promise<void> {
    if (!BLEModule) throw new Error('BLEModule not available');
    return BLEModule.sendData(deviceId, BLE_CHARACTERISTIC_UUID, data);
  }

  // ─────────────────────────────────────────────
  // Native Event Wiring
  // ─────────────────────────────────────────────

  private _registerNativeListeners(): void {
    if (!bleEmitter) return;

    this.subscriptions.push(
      bleEmitter.addListener('BLE_PEER_DISCOVERED', (event: Record<string, unknown>) => {
        const peer = this._parsePeerPayload(event);
        if (peer) this.emit('peer_discovered', { type: 'peer_discovered', peer });
      }),
      bleEmitter.addListener('BLE_PEER_LOST', (event: { deviceId: string }) => {
        this.emit('peer_lost', { type: 'peer_lost', deviceId: event.deviceId });
      }),
      bleEmitter.addListener('BLE_RSSI_UPDATED', (event: { deviceId: string; rssi: number }) => {
        this.emit('rssi_updated', {
          type: 'rssi_updated',
          deviceId: event.deviceId,
          rssi: event.rssi,
        });
      }),
      bleEmitter.addListener('BLE_DATA_RECEIVED', (event: { deviceId: string; data: string }) => {
        this.emit('data_received', {
          type: 'data_received',
          deviceId: event.deviceId,
          data: event.data,
        });
      }),
    );
  }

  private _removeNativeListeners(): void {
    this.subscriptions.forEach(s => s.remove());
    this.subscriptions = [];
  }

  /**
   * Parse the BLE advertisement payload into a MeshPeer struct.
   * The payload is a compact JSON string broadcast by the advertising device.
   */
  private _parsePeerPayload(raw: Record<string, unknown>): MeshPeer | null {
    try {
      return {
        deviceId: raw.deviceId as string,
        displayName: raw.displayName as string,
        publicKey: raw.publicKey as string,
        transport: ['ble'] as TransportType[],
        signalStrength: raw.rssi as number ?? -80,
        batteryLevel: raw.battery as number ?? 50,
        hasInternet: (raw.internet as number) === 1,
        internetLatency: raw.latency as number | undefined,
        hopCount: raw.hops as number ?? 1,
        lastSeen: Date.now(),
        status: 'online',
        appVersion: raw.version as string ?? '1.0.0',
        capabilities: (raw.caps as string ?? '').split(',').filter(Boolean) as MeshPeer['capabilities'],
        distanceEstimate: this._rssiToDistance(raw.rssi as number ?? -80),
      };
    } catch (e) {
      console.warn('[BLEManager] Failed to parse peer payload:', e);
      return null;
    }
  }

  /**
   * Rough RSSI → distance estimation using the log-distance path loss model.
   * txPower assumed -59 dBm at 1 meter.
   */
  private _rssiToDistance(rssi: number, txPower = -59, n = 2.0): number {
    return Math.pow(10, (txPower - rssi) / (10 * n));
  }

  get advertising(): boolean { return this.isAdvertising; }
  get scanning(): boolean { return this.isScanning; }
}

export default BLEManager;
