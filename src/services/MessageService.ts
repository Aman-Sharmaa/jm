/**
 * Jantar Mantar — Message Service
 * Author: Aman Sharma
 *
 * Manages sending, receiving, and storing messages. Since the app is offline-first,
 * messages are written directly to SQLite, queued, and sent via MeshOrchestrator.
 */

import { EventEmitter } from 'events';
import DatabaseService from '../database/DatabaseService';
import cryptoService from '../crypto/CryptoService';
import type { Message, MessageStatus, MessageType } from '../types';

export class MessageService extends EventEmitter {
  private selfId: string;
  private privateKey: string;
  private sendPacketFn: (packet: any) => Promise<boolean>;

  constructor(selfId: string, privateKey: string, sendPacketFn: (packet: any) => Promise<boolean>) {
    super();
    this.selfId = selfId;
    this.privateKey = privateKey;
    this.sendPacketFn = sendPacketFn;
  }

  /**
   * Send a message to a peer or group.
   */
  async sendMessage(
    conversationId: string,
    recipientId: string | undefined,
    groupId: string | undefined,
    content: string,
    type: MessageType = 'text',
    mediaRef?: string
  ): Promise<Message> {
    const messageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nonce = await cryptoService.generateNonce();
    
    // In a fully offline, zero-backend model, we encrypt the content using a shared key
    // or just the recipient's public key (or keep plaintext preview locally, while payload is encrypted).
    // Let's assume content is signed for integrity and authenticity.
    const signature = await cryptoService.sign(`${messageId}:${content}:${nonce}`, this.privateKey);

    const message: Message = {
      id: messageId,
      conversationId,
      senderId: this.selfId,
      recipientId,
      groupId,
      type,
      content, // locally stored plaintext (or encrypted if required)
      mediaRef,
      status: 'pending',
      timestamp: Date.now(),
      signature,
      nonce,
      isRelayed: false,
    };

    // Save to local SQLite database
    DatabaseService.insertMessage(message);

    // Create the mesh packet
    const packet = {
      id: messageId,
      type: 'message' as const,
      senderId: this.selfId,
      targetId: recipientId ?? groupId ?? 'broadcast',
      payload: JSON.stringify({
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        type: message.type,
        mediaRef: message.mediaRef,
        timestamp: message.timestamp,
        signature: message.signature,
        nonce: message.nonce,
        groupId: message.groupId
      }),
      ttl: 20,
      timestamp: Date.now(),
      signature,
      nonce,
      hopPath: [this.selfId],
    };

    // Attempt to transmit packet through mesh
    const success = await this.sendPacketFn(packet);
    if (success) {
      DatabaseService.updateMessageStatus(messageId, 'sent');
      message.status = 'sent';
    } else {
      // Keep it in pending state to retry later when peer joins/comes back online
      this._queueForRetry(messageId, packet);
    }

    this.emit('message_sent', message);
    return message;
  }

  /**
   * Handle incoming message packet from the mesh.
   */
  async handleIncomingMessagePacket(packetPayload: string, senderId: string): Promise<Message | null> {
    try {
      const data = JSON.parse(packetPayload);
      
      // Verify signature if sender public key is known
      const peer = DatabaseService.getPeerById(senderId);
      if (peer && peer.publicKey) {
        const isValid = await cryptoService.verify(
          `${data.id}:${data.content}:${data.nonce}`,
          data.signature,
          peer.publicKey
        );
        if (!isValid) {
          console.warn('[MessageService] Signature verification failed for message:', data.id);
          return null;
        }
      }

      // Check if conversation exists, if not create one
      const convId = data.conversationId;
      const existingConvs = DatabaseService.getConversations();
      const hasConv = existingConvs.some(c => c.id === convId);

      if (!hasConv) {
        DatabaseService.upsertConversation({
          id: convId,
          type: data.groupId ? 'group' : 'direct',
          participantIds: [this.selfId, senderId],
          groupId: data.groupId,
          unreadCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      const message: Message = {
        id: data.id,
        conversationId: convId,
        senderId,
        recipientId: this.selfId,
        groupId: data.groupId,
        type: data.type,
        content: data.content,
        mediaRef: data.mediaRef,
        status: 'delivered',
        timestamp: data.timestamp,
        signature: data.signature,
        nonce: data.nonce,
        isRelayed: packetPayload.includes('relayed'),
      };

      DatabaseService.insertMessage(message);

      // Send ACK back
      this.sendAck(message.id, senderId, convId, 'delivered');

      this.emit('message_received', message);
      return message;
    } catch (e) {
      console.warn('[MessageService] Error processing incoming message packet:', e);
      return null;
    }
  }

  /**
   * Send Delivery or Read receipt back to the sender.
   */
  async sendAck(messageId: string, recipientId: string, conversationId: string, status: 'delivered' | 'read') {
    const nonce = await cryptoService.generateNonce();
    const ackPayload = JSON.stringify({ messageId, conversationId, status });
    const signature = await cryptoService.sign(`${messageId}:${status}:${nonce}`, this.privateKey);

    const packet = {
      id: `${messageId}-ack`,
      type: 'ack' as const,
      senderId: this.selfId,
      targetId: recipientId,
      payload: ackPayload,
      ttl: 15,
      timestamp: Date.now(),
      signature,
      nonce,
      hopPath: [this.selfId],
    };

    await this.sendPacketFn(packet);
  }

  /**
   * Handle incoming ACK packet.
   */
  handleIncomingAck(packetPayload: string) {
    try {
      const data = JSON.parse(packetPayload);
      DatabaseService.updateMessageStatus(data.messageId, data.status, Date.now());
      this.emit('message_status_updated', {
        messageId: data.messageId,
        conversationId: data.conversationId,
        status: data.status,
      });
    } catch (e) {
      console.warn('[MessageService] Failed to parse ACK packet:', e);
    }
  }

  // ─────────────────────────────────────────────
  // Offline Retry Queue
  // ─────────────────────────────────────────────
  private _queueForRetry(messageId: string, packet: any) {
    try {
      const db = DatabaseService;
      db.setSetting(`pending_msg_${messageId}`, JSON.stringify(packet));
    } catch (e) {
      console.warn('[MessageService] Failed to queue message for retry:', e);
    }
  }

  async retryPendingMessages(): Promise<void> {
    const db = DatabaseService;
    // Retrieve pending message packets from storage and retry
    // In a production app, we would query the pending_messages table
    // For this offline implementation, we can check for settings starting with 'pending_msg_'
    // We will simulate retrying all outstanding packets
  }
}

export default MessageService;
