/**
 * Jantar Mantar — Auth Service
 * Author: Aman Sharma
 *
 * Handles device identity generation, key pair creation, guest/Google/OTP
 * authentication, and JWT token management.
 */

import cryptoService from '../crypto/CryptoService';
import DatabaseService from '../database/DatabaseService';
import type { DeviceIdentity, AuthMode } from '../types';

const { MMKV } = require('react-native-mmkv');
const storage = new MMKV({ id: 'auth' });

const KEYS = {
  DEVICE_ID: 'device_id',
  DISPLAY_NAME: 'display_name',
  AUTH_MODE: 'auth_mode',
  JWT_TOKEN: 'jwt_token',
} as const;

export class AuthService {
  /**
   * Initialize auth on app launch.
   * If no identity exists, creates a guest identity with a fresh key pair.
   */
  async initialize(): Promise<DeviceIdentity> {
    const existing = DatabaseService.getIdentity();
    if (existing) {
      console.log('[AuthService] Existing identity loaded:', existing.deviceId);
      return existing;
    }
    return this.createGuestIdentity();
  }

  /**
   * Create a new guest identity with a randomly generated device ID
   * and a fresh ECDH key pair.
   */
  async createGuestIdentity(displayName?: string): Promise<DeviceIdentity> {
    const deviceId = await this._generateDeviceId();
    const keyPair = await cryptoService.generateKeyPair();

    const identity: DeviceIdentity = {
      deviceId,
      displayName: displayName ?? `User-${deviceId.slice(-6)}`,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      createdAt: Date.now(),
    };

    DatabaseService.saveIdentity(identity, 'guest');
    storage.set(KEYS.DEVICE_ID, deviceId);
    storage.set(KEYS.AUTH_MODE, 'guest');

    console.log('[AuthService] Guest identity created:', deviceId);
    return identity;
  }

  /**
   * Authenticate with Google (requires internet).
   * Returns a JWT from the backend.
   */
  async googleSignIn(_googleToken: string): Promise<{ identity: DeviceIdentity; jwt: string }> {
    // TODO: Exchange Google token with backend for a JWT
    // const response = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/google`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token: googleToken }),
    // });
    // const { jwt, profile } = await response.json();
    throw new Error('Google sign-in requires backend integration — stub for Phase 3');
  }

  /**
   * OTP-based authentication (requires internet for OTP delivery).
   */
  async otpSignIn(_phone: string, _otp: string): Promise<{ identity: DeviceIdentity; jwt: string }> {
    throw new Error('OTP sign-in requires backend integration — stub for Phase 3');
  }

  /**
   * Update display name and persist.
   */
  async updateDisplayName(identity: DeviceIdentity, newName: string): Promise<DeviceIdentity> {
    const updated = { ...identity, displayName: newName };
    DatabaseService.saveIdentity(updated, storage.getString(KEYS.AUTH_MODE) ?? 'guest');
    return updated;
  }

  /**
   * Get the current JWT token (null if offline/guest).
   */
  getToken(): string | null {
    return storage.getString(KEYS.JWT_TOKEN) ?? null;
  }

  /**
   * Save a new JWT token (called after successful internet auth).
   */
  saveToken(token: string): void {
    storage.set(KEYS.JWT_TOKEN, token);
  }

  /**
   * Clear all auth data and reset to guest.
   */
  async signOut(): Promise<DeviceIdentity> {
    storage.delete(KEYS.JWT_TOKEN);
    return this.createGuestIdentity();
  }

  // ─────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────

  private async _generateDeviceId(): Promise<string> {
    // UUID v4
    const nonce = await cryptoService.generateNonce();
    const hex = Buffer.from(nonce, 'base64').toString('hex');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      '4' + hex.slice(13, 16),
      ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
      hex.slice(20, 32),
    ].join('-');
  }
}

export const authService = new AuthService();
export default authService;
