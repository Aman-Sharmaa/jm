/**
 * Jantar Mantar — Application Constants
 * Author: Aman Sharma
 */

// ─────────────────────────────────────────────
// App Metadata
// ─────────────────────────────────────────────
export const APP_NAME = 'Jantar Mantar';
export const APP_VERSION = '1.0.0';
export const PACKAGE_NAME = 'com.jantarmantar';

// ─────────────────────────────────────────────
// Mesh Network
// ─────────────────────────────────────────────
export const MESH_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
export const BLE_CHARACTERISTIC_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
export const NEARBY_SERVICE_ID = 'com.jantarmantar.nearby';
export const WIFI_DIRECT_SERVICE_TYPE = '_jantarmantar._tcp';

/** Maximum hops a packet will travel (practical mesh limit) */
export const MAX_HOP_COUNT = 20;

/** Heartbeat interval for peer liveness detection (ms) */
export const HEARTBEAT_INTERVAL_MS = 5_000;

/** Peer is considered offline after this many missed heartbeats */
export const PEER_TIMEOUT_HEARTBEATS = 3;

/** How often to re-broadcast discovery advertisements (ms) */
export const DISCOVERY_BROADCAST_INTERVAL_MS = 3_000;

/** How long to keep a route in the routing table before stale (ms) */
export const ROUTE_STALE_AFTER_MS = 30_000;

// ─────────────────────────────────────────────
// File Transfer
// ─────────────────────────────────────────────

/** Default chunk size: 64 KB */
export const DEFAULT_CHUNK_SIZE_BYTES = 64 * 1024;

/** Maximum chunk size: 512 KB (high-bandwidth connections) */
export const MAX_CHUNK_SIZE_BYTES = 512 * 1024;

/** Minimum chunk size: 8 KB (low-bandwidth BLE) */
export const MIN_CHUNK_SIZE_BYTES = 8 * 1024;

/** Maximum parallel chunk streams */
export const MAX_PARALLEL_CHUNKS = 4;

/** Chunk transfer retry limit */
export const CHUNK_RETRY_LIMIT = 5;

/** Max file size supported: 20 GB */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 * 1024;

// ─────────────────────────────────────────────
// Encryption
// ─────────────────────────────────────────────
export const AES_KEY_LENGTH = 256;
export const AES_IV_LENGTH = 16;
export const ECDH_CURVE = 'P-256';
export const SIGNATURE_ALGORITHM = 'SHA-256';

// ─────────────────────────────────────────────
// Timeouts & Intervals
// ─────────────────────────────────────────────

/** Peer discovery scan window (ms) */
export const DISCOVERY_SCAN_WINDOW_MS = 2_000;

/** Message delivery acknowledgement timeout (ms) */
export const ACK_TIMEOUT_MS = 5_000;

/** Gateway check interval (ms) */
export const GATEWAY_CHECK_INTERVAL_MS = 15_000;

/** Internet ping host */
export const PING_HOST = '8.8.8.8';
export const PING_TIMEOUT_MS = 2_000;

/** Cloud sync interval when gateway available (ms) */
export const SYNC_INTERVAL_MS = 30_000;

// ─────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────
export const DEFAULT_STORAGE_LIMIT_MB = 2048; // 2 GB
export const DB_NAME = 'jantarmantar.db';
export const DB_VERSION = 1;

// ─────────────────────────────────────────────
// UI / UX
// ─────────────────────────────────────────────
export const ANIMATION_DURATION_MS = 250;
export const LONG_PRESS_DELAY_MS = 500;
export const MAX_DISPLAY_NAME_LENGTH = 32;
export const MAX_MESSAGE_LENGTH = 4096;

// ─────────────────────────────────────────────
// Colors (Design Tokens)
// ─────────────────────────────────────────────
export const COLORS = {
  // Brand
  primary: '#00E5FF',
  primaryDark: '#0097A7',
  accent: '#7C4DFF',
  accentLight: '#B47AFF',

  // Background
  background: '#0A0F1E',
  surface: '#111827',
  surfaceElevated: '#1C2333',
  card: '#1A2236',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8899AA',
  textMuted: '#445566',

  // Status
  success: '#00D97E',
  warning: '#FFB300',
  error: '#FF5370',
  info: '#00B0FF',

  // Signal Strength
  signalExcellent: '#00D97E',
  signalGood: '#FFB300',
  signalWeak: '#FF5370',

  // Mesh
  nodeOnline: '#00E5FF',
  nodeOffline: '#445566',
  nodeGateway: '#7C4DFF',
  edgeActive: '#00E5FF33',
} as const;

export const GRADIENTS = {
  primary: ['#00E5FF', '#7C4DFF'],
  background: ['#0A0F1E', '#111827'],
  card: ['#1A2236', '#111827'],
  sos: ['#FF5370', '#FF0040'],
} as const;

// ─────────────────────────────────────────────
// Backend
// ─────────────────────────────────────────────
export const BACKEND_BASE_URL = 'http://localhost:3000';
export const SOCKET_URL = 'http://localhost:3000';
export const API_VERSION = 'v1';
