/**
 * Jantar Mantar — Core TypeScript Interfaces
 * Author: Aman Sharma
 */

// ─────────────────────────────────────────────
// Identity & Authentication
// ─────────────────────────────────────────────

export interface DeviceIdentity {
  deviceId: string;       // UUID v4 — generated once, stored locally
  displayName: string;
  publicKey: string;      // ECDH public key (base64)
  privateKey: string;     // ECDH private key (base64, encrypted at rest)
  avatar?: string;        // base64 or local URI
  createdAt: number;
}

export type AuthMode = 'guest' | 'google' | 'otp';

export interface AuthState {
  identity: DeviceIdentity | null;
  mode: AuthMode;
  isAuthenticated: boolean;
  token?: string;         // JWT if internet auth succeeded
}

// ─────────────────────────────────────────────
// Mesh Network Peers
// ─────────────────────────────────────────────

export type TransportType = 'ble' | 'wifi_direct' | 'nearby' | 'wifi_aware';
export type PeerStatus = 'online' | 'offline' | 'away';

export interface MeshPeer {
  deviceId: string;
  displayName: string;
  publicKey: string;
  transport: TransportType[];
  signalStrength: number;   // -100 to 0 dBm
  batteryLevel: number;     // 0–100
  hasInternet: boolean;
  internetLatency?: number; // ms
  internetBandwidth?: number; // Mbps
  hopCount: number;          // hops from this device
  lastSeen: number;          // unix timestamp
  status: PeerStatus;
  appVersion: string;
  capabilities: PeerCapability[];
  distanceEstimate?: number; // meters (BLE RSSI-based)
}

export type PeerCapability =
  | 'relay'
  | 'gateway'
  | 'file_transfer'
  | 'voice'
  | 'emergency';

// ─────────────────────────────────────────────
// Network Graph / Routing
// ─────────────────────────────────────────────

export interface NetworkEdge {
  fromId: string;
  toId: string;
  weight: number;         // composite routing metric
  latency: number;        // ms
  signalStrength: number;
  transport: TransportType;
  updatedAt: number;
}

export interface NetworkGraph {
  nodes: Record<string, MeshPeer>;
  edges: NetworkEdge[];
  selfId: string;
}

export interface Route {
  path: string[];         // ordered device IDs
  totalHops: number;
  estimatedLatency: number;
  transport: TransportType[];
  score: number;
}

export type RoutingStrategy = 'shortest_path' | 'lowest_latency' | 'highest_battery' | 'best_gateway';

// ─────────────────────────────────────────────
// Messaging
// ─────────────────────────────────────────────

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sos';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;             // UUID
  conversationId: string;
  senderId: string;
  recipientId?: string;   // null for broadcast
  groupId?: string;
  type: MessageType;
  content: string;        // encrypted ciphertext
  plaintextPreview?: string; // decrypted (in-memory only, never stored)
  mediaRef?: string;      // local file URI or chunk transfer ID
  status: MessageStatus;
  timestamp: number;
  deliveredAt?: number;
  readAt?: number;
  signature: string;      // ECDSA signature
  nonce: string;          // replay protection
  hopPath?: string[];     // devices this message traversed
  isRelayed: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'broadcast';
  participantIds: string[];
  groupId?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface TypingIndicator {
  conversationId: string;
  senderId: string;
  isTyping: boolean;
}

// ─────────────────────────────────────────────
// Groups
// ─────────────────────────────────────────────

export interface MeshGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
  isOfflineGroup: boolean;
  pinnedMessageId?: string;
}

// ─────────────────────────────────────────────
// File Transfer / Chunks
// ─────────────────────────────────────────────

export type TransferStatus = 'queued' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'retrying';
export type FileType = 'image' | 'video' | 'audio' | 'pdf' | 'apk' | 'zip' | 'document' | 'other';

export interface FileChunk {
  transferId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;           // base64
  checksum: string;       // SHA-256 of chunk data
  size: number;           // bytes
}

export interface FileTransfer {
  id: string;
  fileName: string;
  fileType: FileType;
  totalSize: number;      // bytes
  totalChunks: number;
  chunkSize: number;
  senderId: string;
  recipientId: string;
  status: TransferStatus;
  progress: number;       // 0–1
  completedChunks: number[];
  checksum: string;       // SHA-256 of full file
  localPath?: string;
  startedAt: number;
  updatedAt: number;
  encryptionKey?: string; // per-transfer AES key
}

// ─────────────────────────────────────────────
// Internet Gateway
// ─────────────────────────────────────────────

export interface GatewayInfo {
  deviceId: string;
  hasInternet: boolean;
  latency: number;        // ms to 8.8.8.8
  downloadSpeed: number;  // Mbps
  uploadSpeed: number;    // Mbps
  batteryLevel: number;
  checkedAt: number;
  isActive: boolean;
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export type NotificationType =
  | 'message_received'
  | 'file_received'
  | 'peer_joined'
  | 'peer_left'
  | 'gateway_found'
  | 'gateway_lost'
  | 'transfer_complete'
  | 'sos_received';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: number;
  isRead: boolean;
}

// ─────────────────────────────────────────────
// Emergency SOS
// ─────────────────────────────────────────────

export interface SOSBroadcast {
  senderId: string;
  senderName: string;
  latitude?: number;
  longitude?: number;
  batteryLevel: number;
  medicalInfo?: string;
  message?: string;
  timestamp: number;
  hopPath: string[];
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

export interface AppSettings {
  bluetoothEnabled: boolean;
  wifiDirectEnabled: boolean;
  nearbyEnabled: boolean;
  autoRelay: boolean;
  autoDownload: boolean;
  storageLimitMB: number;
  encryptionEnabled: boolean;
  batteryOptimization: boolean;
  routingStrategy: RoutingStrategy;
  chunkSizeKB: number;
  maxHops: number;
}

// ─────────────────────────────────────────────
// Mesh Packet (wire format)
// ─────────────────────────────────────────────

export type PacketType = 'discovery' | 'message' | 'chunk' | 'ack' | 'route' | 'gateway' | 'sos' | 'heartbeat';

export interface MeshPacket {
  id: string;
  type: PacketType;
  senderId: string;
  targetId: string | 'broadcast';
  payload: string;          // JSON-stringified + encrypted
  ttl: number;              // time-to-live hop count
  timestamp: number;
  signature: string;
  nonce: string;
  hopPath: string[];
}
