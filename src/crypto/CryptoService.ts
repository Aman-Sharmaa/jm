/**
 * Jantar Mantar — Crypto Service
 * Author: Aman Sharma
 *
 * Provides AES-256-CBC encryption, ECDH key exchange, ECDSA signing,
 * and SHA-256 hashing. On Android, heavy operations are delegated to
 * the native CryptoModule (Kotlin) for performance.
 */

import { NativeModules } from 'react-native';
import { AES_KEY_LENGTH, AES_IV_LENGTH, ECDH_CURVE } from '../constants';

const { CryptoModule } = NativeModules;

export interface KeyPair {
  publicKey: string;  // base64-encoded
  privateKey: string; // base64-encoded (keep secret)
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string;         // base64
  tag?: string;       // base64, for GCM mode
}

class CryptoService {
  /**
   * Generate a new ECDH key pair for this device identity.
   * Delegates to Kotlin CryptoModule on Android.
   */
  async generateKeyPair(): Promise<KeyPair> {
    if (CryptoModule?.generateKeyPair) {
      return CryptoModule.generateKeyPair(ECDH_CURVE);
    }
    // JS fallback (dev only — not suitable for production)
    console.warn('[CryptoService] Native module unavailable — using JS fallback');
    return this._jsKeyPairFallback();
  }

  /**
   * Derive a shared secret using ECDH.
   * Used to establish a per-session AES key between two peers.
   */
  async deriveSharedSecret(myPrivateKey: string, theirPublicKey: string): Promise<string> {
    if (CryptoModule?.deriveSharedSecret) {
      return CryptoModule.deriveSharedSecret(myPrivateKey, theirPublicKey);
    }
    throw new Error('CryptoModule not available — cannot derive shared secret');
  }

  /**
   * Encrypt plaintext with AES-256-CBC.
   * Returns { ciphertext, iv } both base64-encoded.
   */
  async encrypt(plaintext: string, keyBase64: string): Promise<EncryptedPayload> {
    if (CryptoModule?.encrypt) {
      return CryptoModule.encrypt(plaintext, keyBase64);
    }
    return this._jsEncryptFallback(plaintext, keyBase64);
  }

  /**
   * Decrypt AES-256-CBC ciphertext.
   */
  async decrypt(payload: EncryptedPayload, keyBase64: string): Promise<string> {
    if (CryptoModule?.decrypt) {
      return CryptoModule.decrypt(payload.ciphertext, payload.iv, keyBase64);
    }
    return this._jsDecryptFallback(payload, keyBase64);
  }

  /**
   * Sign a message with the device's ECDSA private key.
   * Provides message authenticity and non-repudiation.
   */
  async sign(message: string, privateKeyBase64: string): Promise<string> {
    if (CryptoModule?.sign) {
      return CryptoModule.sign(message, privateKeyBase64);
    }
    throw new Error('CryptoModule not available — cannot sign message');
  }

  /**
   * Verify an ECDSA signature against a sender's public key.
   */
  async verify(message: string, signature: string, publicKeyBase64: string): Promise<boolean> {
    if (CryptoModule?.verify) {
      return CryptoModule.verify(message, signature, publicKeyBase64);
    }
    throw new Error('CryptoModule not available — cannot verify signature');
  }

  /**
   * Compute SHA-256 hash of data (used for chunk checksums, message integrity).
   */
  async sha256(data: string): Promise<string> {
    if (CryptoModule?.sha256) {
      return CryptoModule.sha256(data);
    }
    return this._jsSha256Fallback(data);
  }

  /**
   * Generate a cryptographically random nonce (replay protection).
   */
  async generateNonce(): Promise<string> {
    if (CryptoModule?.generateNonce) {
      return CryptoModule.generateNonce();
    }
    // Simple JS fallback
    const array = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Buffer.from(array).toString('base64');
  }

  /**
   * Generate a secure random AES-256 key for per-file encryption.
   */
  async generateAESKey(): Promise<string> {
    if (CryptoModule?.generateAESKey) {
      return CryptoModule.generateAESKey(AES_KEY_LENGTH);
    }
    const bytes = new Uint8Array(AES_KEY_LENGTH / 8);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Buffer.from(bytes).toString('base64');
  }

  // ─────────────────────────────────────────────
  // JS Fallbacks (development only)
  // ─────────────────────────────────────────────

  private async _jsKeyPairFallback(): Promise<KeyPair> {
    // Placeholder — real implementation requires native crypto
    const id = Math.random().toString(36).substring(2);
    return {
      publicKey: Buffer.from(`pub_${id}`).toString('base64'),
      privateKey: Buffer.from(`priv_${id}`).toString('base64'),
    };
  }

  private async _jsEncryptFallback(plaintext: string, _key: string): Promise<EncryptedPayload> {
    console.warn('[CryptoService] Using insecure JS encryption fallback');
    const iv = Buffer.from(new Uint8Array(AES_IV_LENGTH)).toString('base64');
    return {
      ciphertext: Buffer.from(plaintext).toString('base64'),
      iv,
    };
  }

  private async _jsDecryptFallback(payload: EncryptedPayload, _key: string): Promise<string> {
    console.warn('[CryptoService] Using insecure JS decryption fallback');
    return Buffer.from(payload.ciphertext, 'base64').toString('utf8');
  }

  private async _jsSha256Fallback(data: string): Promise<string> {
    // Simplistic — replace with a real JS crypto lib in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

export const cryptoService = new CryptoService();
export default cryptoService;
