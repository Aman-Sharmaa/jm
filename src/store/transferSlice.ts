/**
 * Jantar Mantar — Transfer Redux Slice
 * Author: Aman Sharma
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FileTransfer, TransferStatus } from '../types';

interface TransferState {
  transfers: Record<string, FileTransfer>;
  activeTransferIds: string[];
  completedTransferIds: string[];
}

const initialState: TransferState = {
  transfers: {},
  activeTransferIds: [],
  completedTransferIds: [],
};

const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    transferStarted(state, action: PayloadAction<FileTransfer>) {
      state.transfers[action.payload.id] = action.payload;
      state.activeTransferIds.push(action.payload.id);
    },
    transferProgressUpdated(state, action: PayloadAction<{
      transferId: string;
      progress: number;
      completedChunks: number[];
    }>) {
      const t = state.transfers[action.payload.transferId];
      if (t) {
        t.progress = action.payload.progress;
        t.completedChunks = action.payload.completedChunks;
        t.status = 'in_progress';
        t.updatedAt = Date.now();
      }
    },
    transferStatusChanged(state, action: PayloadAction<{ transferId: string; status: TransferStatus; localPath?: string }>) {
      const t = state.transfers[action.payload.transferId];
      if (t) {
        t.status = action.payload.status;
        t.updatedAt = Date.now();
        if (action.payload.localPath) t.localPath = action.payload.localPath;
      }
      if (action.payload.status === 'completed') {
        state.activeTransferIds = state.activeTransferIds.filter(id => id !== action.payload.transferId);
        state.completedTransferIds.push(action.payload.transferId);
      } else if (action.payload.status === 'failed') {
        state.activeTransferIds = state.activeTransferIds.filter(id => id !== action.payload.transferId);
      }
    },
    transferRemoved(state, action: PayloadAction<string>) {
      delete state.transfers[action.payload];
      state.activeTransferIds = state.activeTransferIds.filter(id => id !== action.payload);
      state.completedTransferIds = state.completedTransferIds.filter(id => id !== action.payload);
    },
  },
});

export const {
  transferStarted, transferProgressUpdated, transferStatusChanged, transferRemoved,
} = transferSlice.actions;
export default transferSlice.reducer;
