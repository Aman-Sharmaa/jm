/**
 * Jantar Mantar — SQLite Database Schema
 * Author: Aman Sharma
 *
 * Defines CREATE TABLE statements and index definitions for the offline-first
 * local database. Uses react-native-quick-sqlite for best performance.
 */

export const SCHEMA_VERSION = 1;

// ─────────────────────────────────────────────
// Table Names
// ─────────────────────────────────────────────
export const TABLES = {
  IDENTITY: 'identity',
  PEERS: 'peers',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  GROUPS: 'groups',
  GROUP_MEMBERS: 'group_members',
  FILE_TRANSFERS: 'file_transfers',
  CHUNKS: 'chunks',
  PENDING_MESSAGES: 'pending_messages',
  NETWORK_CACHE: 'network_cache',
  GATEWAY_HISTORY: 'gateway_history',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
} as const;

// ─────────────────────────────────────────────
// CREATE TABLE Statements
// ─────────────────────────────────────────────

export const CREATE_IDENTITY_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.IDENTITY} (
    device_id     TEXT PRIMARY KEY,
    display_name  TEXT NOT NULL,
    public_key    TEXT NOT NULL,
    private_key   TEXT NOT NULL,
    avatar        TEXT,
    auth_mode     TEXT NOT NULL DEFAULT 'guest',
    jwt_token     TEXT,
    created_at    INTEGER NOT NULL
  );
`;

export const CREATE_PEERS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.PEERS} (
    device_id          TEXT PRIMARY KEY,
    display_name       TEXT NOT NULL,
    public_key         TEXT NOT NULL,
    transport          TEXT NOT NULL,
    signal_strength    INTEGER DEFAULT -100,
    battery_level      INTEGER DEFAULT 0,
    has_internet       INTEGER DEFAULT 0,
    internet_latency   INTEGER,
    hop_count          INTEGER DEFAULT 0,
    last_seen          INTEGER NOT NULL,
    status             TEXT NOT NULL DEFAULT 'offline',
    app_version        TEXT,
    capabilities       TEXT,
    distance_estimate  REAL
  );
`;

export const CREATE_CONVERSATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.CONVERSATIONS} (
    id               TEXT PRIMARY KEY,
    type             TEXT NOT NULL,
    participant_ids  TEXT NOT NULL,
    group_id         TEXT,
    unread_count     INTEGER DEFAULT 0,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
  );
`;

export const CREATE_MESSAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.MESSAGES} (
    id               TEXT PRIMARY KEY,
    conversation_id  TEXT NOT NULL,
    sender_id        TEXT NOT NULL,
    recipient_id     TEXT,
    group_id         TEXT,
    type             TEXT NOT NULL DEFAULT 'text',
    content          TEXT NOT NULL,
    media_ref        TEXT,
    status           TEXT NOT NULL DEFAULT 'pending',
    timestamp        INTEGER NOT NULL,
    delivered_at     INTEGER,
    read_at          INTEGER,
    signature        TEXT NOT NULL,
    nonce            TEXT NOT NULL,
    hop_path         TEXT,
    is_relayed       INTEGER DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES ${TABLES.CONVERSATIONS}(id) ON DELETE CASCADE
  );
`;

export const CREATE_GROUPS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.GROUPS} (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    description       TEXT,
    avatar            TEXT,
    admin_ids         TEXT NOT NULL,
    is_offline_group  INTEGER DEFAULT 1,
    pinned_message_id TEXT,
    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );
`;

export const CREATE_GROUP_MEMBERS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.GROUP_MEMBERS} (
    group_id   TEXT NOT NULL,
    device_id  TEXT NOT NULL,
    joined_at  INTEGER NOT NULL,
    role       TEXT NOT NULL DEFAULT 'member',
    PRIMARY KEY (group_id, device_id)
  );
`;

export const CREATE_FILE_TRANSFERS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.FILE_TRANSFERS} (
    id                TEXT PRIMARY KEY,
    file_name         TEXT NOT NULL,
    file_type         TEXT NOT NULL,
    total_size        INTEGER NOT NULL,
    total_chunks      INTEGER NOT NULL,
    chunk_size        INTEGER NOT NULL,
    sender_id         TEXT NOT NULL,
    recipient_id      TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'queued',
    progress          REAL DEFAULT 0,
    completed_chunks  TEXT NOT NULL DEFAULT '[]',
    checksum          TEXT NOT NULL,
    local_path        TEXT,
    encryption_key    TEXT,
    started_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );
`;

export const CREATE_CHUNKS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.CHUNKS} (
    transfer_id   TEXT NOT NULL,
    chunk_index   INTEGER NOT NULL,
    total_chunks  INTEGER NOT NULL,
    data          TEXT NOT NULL,
    checksum      TEXT NOT NULL,
    size          INTEGER NOT NULL,
    received_at   INTEGER,
    PRIMARY KEY (transfer_id, chunk_index)
  );
`;

export const CREATE_PENDING_MESSAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.PENDING_MESSAGES} (
    id          TEXT PRIMARY KEY,
    message_id  TEXT NOT NULL,
    payload     TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    next_retry  INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
  );
`;

export const CREATE_NETWORK_CACHE_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.NETWORK_CACHE} (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    expires_at  INTEGER NOT NULL
  );
`;

export const CREATE_GATEWAY_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.GATEWAY_HISTORY} (
    id          TEXT PRIMARY KEY,
    device_id   TEXT NOT NULL,
    latency     INTEGER NOT NULL,
    dl_speed    REAL NOT NULL,
    ul_speed    REAL NOT NULL,
    battery     INTEGER NOT NULL,
    checked_at  INTEGER NOT NULL
  );
`;

export const CREATE_NOTIFICATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.NOTIFICATIONS} (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    data       TEXT,
    is_read    INTEGER DEFAULT 0,
    timestamp  INTEGER NOT NULL
  );
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLES.SETTINGS} (
    key    TEXT PRIMARY KEY,
    value  TEXT NOT NULL
  );
`;

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ${TABLES.MESSAGES}(conversation_id, timestamp DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_sender ON ${TABLES.MESSAGES}(sender_id);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_status ON ${TABLES.MESSAGES}(status);`,
  `CREATE INDEX IF NOT EXISTS idx_peers_status ON ${TABLES.PEERS}(status, last_seen DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_transfers_status ON ${TABLES.FILE_TRANSFERS}(status);`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_updated ON ${TABLES.CONVERSATIONS}(updated_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_read ON ${TABLES.NOTIFICATIONS}(is_read, timestamp DESC);`,
];

// All schema statements in migration order
export const ALL_SCHEMA_STATEMENTS = [
  CREATE_IDENTITY_TABLE,
  CREATE_PEERS_TABLE,
  CREATE_CONVERSATIONS_TABLE,
  CREATE_MESSAGES_TABLE,
  CREATE_GROUPS_TABLE,
  CREATE_GROUP_MEMBERS_TABLE,
  CREATE_FILE_TRANSFERS_TABLE,
  CREATE_CHUNKS_TABLE,
  CREATE_PENDING_MESSAGES_TABLE,
  CREATE_NETWORK_CACHE_TABLE,
  CREATE_GATEWAY_HISTORY_TABLE,
  CREATE_NOTIFICATIONS_TABLE,
  CREATE_SETTINGS_TABLE,
  ...CREATE_INDEXES,
];
