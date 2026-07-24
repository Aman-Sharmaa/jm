/**
 * Jantar Mantar — Database Service (DAO Layer)
 * Author: Aman Sharma
 *
 * Wraps react-native-quick-sqlite with typed DAO methods for all entities.
 */

import { DB_NAME } from '../constants';
import {
  ALL_SCHEMA_STATEMENTS,
  SCHEMA_VERSION,
  TABLES,
} from './schema';
import type {
  DeviceIdentity,
  MeshPeer,
  Conversation,
  Message,
  MeshGroup,
  FileTransfer,
  FileChunk,
  GatewayInfo,
  AppNotification,
  AppSettings,
} from '../types';

// react-native-quick-sqlite types (simplified)
type DB = {
  execute: (sql: string, params?: unknown[]) => { rows: { item: (i: number) => unknown; length: number } };
  close: () => void;
};

let _db: DB | null = null;

function getDB(): DB {
  if (!_db) throw new Error('DatabaseService not initialized. Call DatabaseService.init() first.');
  return _db;
}

// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────

export const DatabaseService = {
  async init(): Promise<void> {
    try {
      // Dynamically require to avoid issues in environments without the native module
      const { open } = require('react-native-quick-sqlite');
      _db = open({ name: DB_NAME });

      // Run migrations
      for (const stmt of ALL_SCHEMA_STATEMENTS) {
        getDB().execute(stmt);
      }

      // Record schema version
      getDB().execute(
        `INSERT OR REPLACE INTO ${TABLES.SETTINGS} (key, value) VALUES (?, ?)`,
        ['schema_version', String(SCHEMA_VERSION)],
      );

      console.log('[DatabaseService] Initialized successfully');
    } catch (e) {
      console.error('[DatabaseService] Init failed:', e);
      throw e;
    }
  },

  close(): void {
    _db?.close();
    _db = null;
  },

  // ─────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────

  saveIdentity(identity: DeviceIdentity, authMode: string, token?: string): void {
    const db = getDB();
    db.execute(
      `INSERT OR REPLACE INTO ${TABLES.IDENTITY}
        (device_id, display_name, public_key, private_key, avatar, auth_mode, jwt_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        identity.deviceId,
        identity.displayName,
        identity.publicKey,
        identity.privateKey,
        identity.avatar ?? null,
        authMode,
        token ?? null,
        identity.createdAt,
      ],
    );
  },

  getIdentity(): DeviceIdentity | null {
    const db = getDB();
    const result = db.execute(`SELECT * FROM ${TABLES.IDENTITY} LIMIT 1`);
    if (result.rows.length === 0) return null;
    const row = result.rows.item(0) as Record<string, unknown>;
    return {
      deviceId: row.device_id as string,
      displayName: row.display_name as string,
      publicKey: row.public_key as string,
      privateKey: row.private_key as string,
      avatar: row.avatar as string | undefined,
      createdAt: row.created_at as number,
    };
  },

  // ─────────────────────────────────────────────
  // Peers
  // ─────────────────────────────────────────────

  upsertPeer(peer: MeshPeer): void {
    const db = getDB();
    db.execute(
      `INSERT OR REPLACE INTO ${TABLES.PEERS}
        (device_id, display_name, public_key, transport, signal_strength, battery_level,
         has_internet, internet_latency, hop_count, last_seen, status, app_version,
         capabilities, distance_estimate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        peer.deviceId,
        peer.displayName,
        peer.publicKey,
        JSON.stringify(peer.transport),
        peer.signalStrength,
        peer.batteryLevel,
        peer.hasInternet ? 1 : 0,
        peer.internetLatency ?? null,
        peer.hopCount,
        peer.lastSeen,
        peer.status,
        peer.appVersion,
        JSON.stringify(peer.capabilities),
        peer.distanceEstimate ?? null,
      ],
    );
  },

  getPeers(): MeshPeer[] {
    const db = getDB();
    const result = db.execute(
      `SELECT * FROM ${TABLES.PEERS} ORDER BY last_seen DESC`,
    );
    const peers: MeshPeer[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i) as Record<string, unknown>;
      peers.push(this._rowToPeer(row));
    }
    return peers;
  },

  getPeerById(deviceId: string): MeshPeer | null {
    const db = getDB();
    const result = db.execute(
      `SELECT * FROM ${TABLES.PEERS} WHERE device_id = ?`,
      [deviceId],
    );
    if (result.rows.length === 0) return null;
    return this._rowToPeer(result.rows.item(0) as Record<string, unknown>);
  },

  _rowToPeer(row: Record<string, unknown>): MeshPeer {
    return {
      deviceId: row.device_id as string,
      displayName: row.display_name as string,
      publicKey: row.public_key as string,
      transport: JSON.parse(row.transport as string),
      signalStrength: row.signal_strength as number,
      batteryLevel: row.battery_level as number,
      hasInternet: (row.has_internet as number) === 1,
      internetLatency: row.internet_latency as number | undefined,
      hopCount: row.hop_count as number,
      lastSeen: row.last_seen as number,
      status: row.status as MeshPeer['status'],
      appVersion: row.app_version as string,
      capabilities: JSON.parse(row.capabilities as string),
      distanceEstimate: row.distance_estimate as number | undefined,
    };
  },

  // ─────────────────────────────────────────────
  // Conversations
  // ─────────────────────────────────────────────

  upsertConversation(conv: Conversation): void {
    const db = getDB();
    db.execute(
      `INSERT OR REPLACE INTO ${TABLES.CONVERSATIONS}
        (id, type, participant_ids, group_id, unread_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        conv.id,
        conv.type,
        JSON.stringify(conv.participantIds),
        conv.groupId ?? null,
        conv.unreadCount,
        conv.createdAt,
        conv.updatedAt,
      ],
    );
  },

  getConversations(): Conversation[] {
    const db = getDB();
    const result = db.execute(
      `SELECT * FROM ${TABLES.CONVERSATIONS} ORDER BY updated_at DESC`,
    );
    const convs: Conversation[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i) as Record<string, unknown>;
      convs.push({
        id: row.id as string,
        type: row.type as Conversation['type'],
        participantIds: JSON.parse(row.participant_ids as string),
        groupId: row.group_id as string | undefined,
        unreadCount: row.unread_count as number,
        createdAt: row.created_at as number,
        updatedAt: row.updated_at as number,
      });
    }
    return convs;
  },

  // ─────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────

  insertMessage(msg: Message): void {
    const db = getDB();
    db.execute(
      `INSERT OR IGNORE INTO ${TABLES.MESSAGES}
        (id, conversation_id, sender_id, recipient_id, group_id, type, content,
         media_ref, status, timestamp, delivered_at, read_at, signature, nonce, hop_path, is_relayed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        msg.id,
        msg.conversationId,
        msg.senderId,
        msg.recipientId ?? null,
        msg.groupId ?? null,
        msg.type,
        msg.content,
        msg.mediaRef ?? null,
        msg.status,
        msg.timestamp,
        msg.deliveredAt ?? null,
        msg.readAt ?? null,
        msg.signature,
        msg.nonce,
        msg.hopPath ? JSON.stringify(msg.hopPath) : null,
        msg.isRelayed ? 1 : 0,
      ],
    );
  },

  getMessages(conversationId: string, limit = 50, offset = 0): Message[] {
    const db = getDB();
    const result = db.execute(
      `SELECT * FROM ${TABLES.MESSAGES}
       WHERE conversation_id = ?
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`,
      [conversationId, limit, offset],
    );
    const msgs: Message[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i) as Record<string, unknown>;
      msgs.push({
        id: row.id as string,
        conversationId: row.conversation_id as string,
        senderId: row.sender_id as string,
        recipientId: row.recipient_id as string | undefined,
        groupId: row.group_id as string | undefined,
        type: row.type as Message['type'],
        content: row.content as string,
        mediaRef: row.media_ref as string | undefined,
        status: row.status as Message['status'],
        timestamp: row.timestamp as number,
        deliveredAt: row.delivered_at as number | undefined,
        readAt: row.read_at as number | undefined,
        signature: row.signature as string,
        nonce: row.nonce as string,
        hopPath: row.hop_path ? JSON.parse(row.hop_path as string) : undefined,
        isRelayed: (row.is_relayed as number) === 1,
      });
    }
    return msgs.reverse(); // chronological order
  },

  updateMessageStatus(messageId: string, status: Message['status'], timestamp?: number): void {
    const db = getDB();
    if (status === 'delivered' && timestamp) {
      db.execute(
        `UPDATE ${TABLES.MESSAGES} SET status = ?, delivered_at = ? WHERE id = ?`,
        [status, timestamp, messageId],
      );
    } else if (status === 'read' && timestamp) {
      db.execute(
        `UPDATE ${TABLES.MESSAGES} SET status = ?, read_at = ? WHERE id = ?`,
        [status, timestamp, messageId],
      );
    } else {
      db.execute(
        `UPDATE ${TABLES.MESSAGES} SET status = ? WHERE id = ?`,
        [status, messageId],
      );
    }
  },

  // ─────────────────────────────────────────────
  // File Transfers
  // ─────────────────────────────────────────────

  upsertTransfer(transfer: FileTransfer): void {
    const db = getDB();
    db.execute(
      `INSERT OR REPLACE INTO ${TABLES.FILE_TRANSFERS}
        (id, file_name, file_type, total_size, total_chunks, chunk_size, sender_id,
         recipient_id, status, progress, completed_chunks, checksum, local_path,
         encryption_key, started_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transfer.id,
        transfer.fileName,
        transfer.fileType,
        transfer.totalSize,
        transfer.totalChunks,
        transfer.chunkSize,
        transfer.senderId,
        transfer.recipientId,
        transfer.status,
        transfer.progress,
        JSON.stringify(transfer.completedChunks),
        transfer.checksum,
        transfer.localPath ?? null,
        transfer.encryptionKey ?? null,
        transfer.startedAt,
        transfer.updatedAt,
      ],
    );
  },

  // ─────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────

  setSetting(key: string, value: string): void {
    getDB().execute(
      `INSERT OR REPLACE INTO ${TABLES.SETTINGS} (key, value) VALUES (?, ?)`,
      [key, value],
    );
  },

  getSetting(key: string): string | null {
    const result = getDB().execute(
      `SELECT value FROM ${TABLES.SETTINGS} WHERE key = ?`,
      [key],
    );
    if (result.rows.length === 0) return null;
    return (result.rows.item(0) as Record<string, unknown>).value as string;
  },

  saveSettings(settings: AppSettings): void {
    this.setSetting('app_settings', JSON.stringify(settings));
  },

  getSettings(): AppSettings | null {
    const raw = this.getSetting('app_settings');
    return raw ? JSON.parse(raw) : null;
  },
};

export default DatabaseService;
