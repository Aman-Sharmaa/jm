/**
 * Jantar Mantar — File Chunk Manager
 * Author: Aman Sharma
 *
 * Splits files into chunks, manages parallel sending, checksum validation,
 * pause/resume/retry, and reassembles received chunks into the final file.
 */

import { EventEmitter } from 'events';
import {
  DEFAULT_CHUNK_SIZE_BYTES,
  MAX_PARALLEL_CHUNKS,
  CHUNK_RETRY_LIMIT,
} from '../constants';
import type { FileChunk, FileTransfer, TransferStatus } from '../types';
import cryptoService from '../crypto/CryptoService';

export type ChunkEvent =
  | { type: 'progress'; transferId: string; progress: number; completedChunks: number[] }
  | { type: 'completed'; transferId: string; localPath: string }
  | { type: 'failed'; transferId: string; error: string }
  | { type: 'paused'; transferId: string }
  | { type: 'resumed'; transferId: string };

type ChunkSendFn = (chunk: FileChunk) => Promise<void>;

export class ChunkManager extends EventEmitter {
  private activeTransfers: Map<string, {
    transfer: FileTransfer;
    sendFn: ChunkSendFn;
    paused: boolean;
    chunkBuffer: Uint8Array[];
    retryCount: Map<number, number>;
    inflightCount: number;
  }> = new Map();

  // Received chunks awaiting reassembly: transferId → chunkIndex → data
  private receivedChunks: Map<string, Map<number, FileChunk>> = new Map();

  // ─────────────────────────────────────────────
  // Outgoing — Sender Side
  // ─────────────────────────────────────────────

  /**
   * Begin sending a file by splitting it into chunks and forwarding them.
   * @param transfer  FileTransfer metadata
   * @param fileData  Full file content as Uint8Array
   * @param sendFn    Async function that sends one chunk to the recipient
   */
  async startSend(
    transfer: FileTransfer,
    fileData: Uint8Array,
    sendFn: ChunkSendFn,
  ): Promise<void> {
    const chunkSize = transfer.chunkSize || DEFAULT_CHUNK_SIZE_BYTES;
    const chunks = this._splitIntoChunks(fileData, chunkSize);

    this.activeTransfers.set(transfer.id, {
      transfer: { ...transfer, totalChunks: chunks.length },
      sendFn,
      paused: false,
      chunkBuffer: chunks,
      retryCount: new Map(),
      inflightCount: 0,
    });

    await this._sendChunks(transfer.id);
  }

  pause(transferId: string): void {
    const state = this.activeTransfers.get(transferId);
    if (state) {
      state.paused = true;
      this.emit('paused', { type: 'paused', transferId });
    }
  }

  resume(transferId: string): void {
    const state = this.activeTransfers.get(transferId);
    if (state && state.paused) {
      state.paused = false;
      this.emit('resumed', { type: 'resumed', transferId });
      this._sendChunks(transferId);
    }
  }

  cancel(transferId: string): void {
    this.activeTransfers.delete(transferId);
  }

  private async _sendChunks(transferId: string): Promise<void> {
    const state = this.activeTransfers.get(transferId);
    if (!state) return;

    const { transfer, chunkBuffer, sendFn, retryCount } = state;
    const completedSet = new Set(transfer.completedChunks);
    const pending = chunkBuffer
      .map((_, i) => i)
      .filter(i => !completedSet.has(i));

    // Send in parallel batches
    for (let i = 0; i < pending.length; i += MAX_PARALLEL_CHUNKS) {
      if (!this.activeTransfers.has(transferId)) return; // cancelled
      const batch = pending.slice(i, i + MAX_PARALLEL_CHUNKS);

      await Promise.allSettled(
        batch.map(chunkIdx => this._sendOneChunk(transferId, chunkIdx)),
      );

      if (state.paused) return; // will resume later
    }
  }

  private async _sendOneChunk(transferId: string, chunkIndex: number): Promise<void> {
    const state = this.activeTransfers.get(transferId);
    if (!state) return;

    const { transfer, chunkBuffer, sendFn, retryCount } = state;
    const rawData = chunkBuffer[chunkIndex];
    const dataBase64 = Buffer.from(rawData).toString('base64');
    const checksum = await cryptoService.sha256(dataBase64);

    const chunk: FileChunk = {
      transferId,
      chunkIndex,
      totalChunks: chunkBuffer.length,
      data: dataBase64,
      checksum,
      size: rawData.byteLength,
    };

    try {
      await sendFn(chunk);
      transfer.completedChunks.push(chunkIndex);
      transfer.progress = transfer.completedChunks.length / chunkBuffer.length;

      this.emit('progress', {
        type: 'progress',
        transferId,
        progress: transfer.progress,
        completedChunks: transfer.completedChunks,
      });

      if (transfer.completedChunks.length === chunkBuffer.length) {
        this.activeTransfers.delete(transferId);
        this.emit('completed', { type: 'completed', transferId, localPath: '' });
      }
    } catch (e) {
      const tries = (retryCount.get(chunkIndex) ?? 0) + 1;
      retryCount.set(chunkIndex, tries);

      if (tries >= CHUNK_RETRY_LIMIT) {
        this.activeTransfers.delete(transferId);
        this.emit('failed', {
          type: 'failed',
          transferId,
          error: `Chunk ${chunkIndex} failed after ${tries} attempts`,
        });
      }
      // Otherwise it stays in pending for next _sendChunks call
    }
  }

  private _splitIntoChunks(data: Uint8Array, chunkSize: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    let offset = 0;
    while (offset < data.byteLength) {
      chunks.push(data.slice(offset, offset + chunkSize));
      offset += chunkSize;
    }
    return chunks;
  }

  // ─────────────────────────────────────────────
  // Incoming — Receiver Side
  // ─────────────────────────────────────────────

  /**
   * Called when a chunk arrives from the network.
   * Returns the reconstructed file data if all chunks are received.
   */
  async receiveChunk(chunk: FileChunk): Promise<Uint8Array | null> {
    // Validate checksum
    const expectedChecksum = await cryptoService.sha256(chunk.data);
    if (expectedChecksum !== chunk.checksum) {
      console.warn(`[ChunkManager] Chunk ${chunk.chunkIndex} checksum mismatch — dropping`);
      return null;
    }

    if (!this.receivedChunks.has(chunk.transferId)) {
      this.receivedChunks.set(chunk.transferId, new Map());
    }
    this.receivedChunks.get(chunk.transferId)!.set(chunk.chunkIndex, chunk);

    const received = this.receivedChunks.get(chunk.transferId)!;
    if (received.size === chunk.totalChunks) {
      // All chunks received — reassemble
      return this._reassemble(chunk.transferId, chunk.totalChunks);
    }
    return null;
  }

  private _reassemble(transferId: string, totalChunks: number): Uint8Array {
    const chunks = this.receivedChunks.get(transferId)!;
    const sorted = Array.from({ length: totalChunks }, (_, i) => {
      const c = chunks.get(i);
      if (!c) throw new Error(`Missing chunk ${i} for transfer ${transferId}`);
      return Buffer.from(c.data, 'base64');
    });

    const totalSize = sorted.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalSize);
    let offset = 0;
    for (const buf of sorted) {
      result.set(buf, offset);
      offset += buf.byteLength;
    }

    this.receivedChunks.delete(transferId);
    return result;
  }

  getReceivedChunkCount(transferId: string): number {
    return this.receivedChunks.get(transferId)?.size ?? 0;
  }
}

export default ChunkManager;
