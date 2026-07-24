/**
 * Jantar Mantar — Gateway Redux Slice
 * Author: Aman Sharma
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GatewayInfo } from '../types';

interface GatewayState {
  selfInfo: GatewayInfo | null;
  knownGateways: Record<string, GatewayInfo>; // deviceId → info
  bestGatewayId: string | null;
  isMonitoring: boolean;
}

const initialState: GatewayState = {
  selfInfo: null,
  knownGateways: {},
  bestGatewayId: null,
  isMonitoring: false,
};

function computeBest(knownGateways: Record<string, GatewayInfo>): string | null {
  const gateways = Object.values(knownGateways);
  if (gateways.length === 0) return null;
  const best = gateways.sort((a, b) => {
    if (a.batteryLevel > 50 && b.batteryLevel <= 50) return -1;
    return a.latency - b.latency;
  })[0];
  return best?.deviceId ?? null;
}

const gatewaySlice = createSlice({
  name: 'gateway',
  initialState,
  reducers: {
    selfGatewayUpdated(state, action: PayloadAction<GatewayInfo>) {
      state.selfInfo = action.payload;
      if (action.payload.hasInternet) {
        state.knownGateways[action.payload.deviceId] = action.payload;
      } else {
        delete state.knownGateways[action.payload.deviceId];
      }
      state.bestGatewayId = computeBest(state.knownGateways);
    },
    remoteGatewayUpdated(state, action: PayloadAction<GatewayInfo>) {
      if (action.payload.hasInternet) {
        state.knownGateways[action.payload.deviceId] = action.payload;
      } else {
        delete state.knownGateways[action.payload.deviceId];
      }
      state.bestGatewayId = computeBest(state.knownGateways);
    },
    gatewayLost(state, action: PayloadAction<string>) {
      delete state.knownGateways[action.payload];
      if (state.bestGatewayId === action.payload) {
        state.bestGatewayId = computeBest(state.knownGateways);
      }
    },
    setMonitoring(state, action: PayloadAction<boolean>) {
      state.isMonitoring = action.payload;
    },
  },
});

export const {
  selfGatewayUpdated, remoteGatewayUpdated, gatewayLost, setMonitoring,
} = gatewaySlice.actions;
export default gatewaySlice.reducer;
