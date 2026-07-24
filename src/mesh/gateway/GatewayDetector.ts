/**
 * Jantar Mantar — Internet Gateway Detector
 * Author: Aman Sharma
 *
 * Continuously monitors internet connectivity and measures quality metrics.
 * Broadcasts gateway availability to nearby mesh peers so they can route
 * traffic through the best available gateway.
 */

import { EventEmitter } from 'events';
import {
  GATEWAY_CHECK_INTERVAL_MS,
  PING_HOST,
  PING_TIMEOUT_MS,
} from '../../constants';
import type { GatewayInfo } from '../../types';

export type GatewayEvent =
  | { type: 'gateway_available'; info: GatewayInfo }
  | { type: 'gateway_lost' }
  | { type: 'quality_updated'; info: GatewayInfo };

export class GatewayDetector extends EventEmitter {
  private deviceId: string;
  private batteryLevelGetter: () => number;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private lastInfo: GatewayInfo | null = null;
  private wasOnline = false;

  constructor(deviceId: string, batteryLevelGetter: () => number) {
    super();
    this.deviceId = deviceId;
    this.batteryLevelGetter = batteryLevelGetter;
  }

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  start(): void {
    this._check();
    this.checkTimer = setInterval(() => this._check(), GATEWAY_CHECK_INTERVAL_MS);
    console.log('[GatewayDetector] Started monitoring');
  }

  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    console.log('[GatewayDetector] Stopped');
  }

  getLastInfo(): GatewayInfo | null {
    return this.lastInfo;
  }

  isOnline(): boolean {
    return this.lastInfo?.hasInternet ?? false;
  }

  // ─────────────────────────────────────────────
  // Measurement
  // ─────────────────────────────────────────────

  private async _check(): Promise<void> {
    try {
      const latency = await this._ping();
      const hasInternet = latency < PING_TIMEOUT_MS;

      let dlSpeed = 0;
      let ulSpeed = 0;

      if (hasInternet) {
        // Lightweight speed estimate (download small resource)
        try {
          const speeds = await this._measureBandwidth();
          dlSpeed = speeds.download;
          ulSpeed = speeds.upload;
        } catch {
          // Non-critical — latency alone is enough to use as gateway
        }
      }

      const info: GatewayInfo = {
        deviceId: this.deviceId,
        hasInternet,
        latency,
        downloadSpeed: dlSpeed,
        uploadSpeed: ulSpeed,
        batteryLevel: this.batteryLevelGetter(),
        checkedAt: Date.now(),
        isActive: hasInternet,
      };

      this.lastInfo = info;

      if (hasInternet && !this.wasOnline) {
        this.wasOnline = true;
        this.emit('gateway_available', { type: 'gateway_available', info });
      } else if (!hasInternet && this.wasOnline) {
        this.wasOnline = false;
        this.emit('gateway_lost', { type: 'gateway_lost' });
      } else if (hasInternet) {
        this.emit('quality_updated', { type: 'quality_updated', info });
      }
    } catch (e) {
      console.warn('[GatewayDetector] Check failed:', e);
    }
  }

  /**
   * Measure round-trip latency to Google DNS.
   * Uses fetch() for cross-platform compatibility.
   */
  private async _ping(): Promise<number> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      await fetch(`https://${PING_HOST}`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      return Date.now() - start;
    } catch {
      return PING_TIMEOUT_MS; // treat as offline
    }
  }

  /**
   * Rough bandwidth measurement via a known-size resource fetch.
   * Returns estimated Mbps values.
   */
  private async _measureBandwidth(): Promise<{ download: number; upload: number }> {
    // Download: fetch a small well-known resource
    const dlStart = Date.now();
    try {
      const res = await fetch('https://speed.cloudflare.com/__down?bytes=500000', {
        cache: 'no-store',
      });
      const data = await res.arrayBuffer();
      const dlTime = (Date.now() - dlStart) / 1000; // seconds
      const dlMbps = (data.byteLength * 8) / (dlTime * 1_000_000);

      return {
        download: Math.round(dlMbps * 10) / 10,
        upload: 0, // Upload measurement requires a server endpoint
      };
    } catch {
      return { download: 0, upload: 0 };
    }
  }
}

export default GatewayDetector;
