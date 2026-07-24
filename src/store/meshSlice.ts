/**
 * Jantar Mantar — Mesh Network Redux Slice
 * Author: Aman Sharma
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MeshPeer, NetworkGraph, GatewayInfo, RoutingStrategy } from '../types';

interface MeshState {
  peers: Record<string, MeshPeer>;
  topology: NetworkGraph | null;
  nearbyPeers: string[];       // device IDs within 1 hop
  gatewayDeviceId: string | null;
  gatewayInfo: GatewayInfo | null;
  selfHasInternet: boolean;
  routingStrategy: RoutingStrategy;
  isActive: boolean;
  lastTopologyUpdate: number;
}

const initialState: MeshState = {
  peers: {},
  topology: null,
  nearbyPeers: [],
  gatewayDeviceId: null,
  gatewayInfo: null,
  selfHasInternet: false,
  routingStrategy: 'shortest_path',
  isActive: false,
  lastTopologyUpdate: 0,
};

const meshSlice = createSlice({
  name: 'mesh',
  initialState,
  reducers: {
    peerJoined(state, action: PayloadAction<MeshPeer>) {
      const peer = action.payload;
      state.peers[peer.deviceId] = peer;
      if (peer.hopCount === 1 && !state.nearbyPeers.includes(peer.deviceId)) {
        state.nearbyPeers.push(peer.deviceId);
      }
    },
    peerUpdated(state, action: PayloadAction<Partial<MeshPeer> & { deviceId: string }>) {
      const { deviceId, ...updates } = action.payload;
      if (state.peers[deviceId]) {
        state.peers[deviceId] = { ...state.peers[deviceId], ...updates };
      }
    },
    peerLeft(state, action: PayloadAction<string>) {
      const deviceId = action.payload;
      delete state.peers[deviceId];
      state.nearbyPeers = state.nearbyPeers.filter(id => id !== deviceId);
      if (state.gatewayDeviceId === deviceId) {
        state.gatewayDeviceId = null;
        state.gatewayInfo = null;
      }
    },
    topologyUpdated(state, action: PayloadAction<NetworkGraph>) {
      state.topology = action.payload;
      state.lastTopologyUpdate = Date.now();
    },
    gatewayFound(state, action: PayloadAction<{ deviceId: string; info: GatewayInfo }>) {
      state.gatewayDeviceId = action.payload.deviceId;
      state.gatewayInfo = action.payload.info;
    },
    gatewayLost(state) {
      state.gatewayDeviceId = null;
      state.gatewayInfo = null;
    },
    setSelfInternet(state, action: PayloadAction<boolean>) {
      state.selfHasInternet = action.payload;
    },
    setRoutingStrategy(state, action: PayloadAction<RoutingStrategy>) {
      state.routingStrategy = action.payload;
    },
    setMeshActive(state, action: PayloadAction<boolean>) {
      state.isActive = action.payload;
    },
  },
});

export const {
  peerJoined, peerUpdated, peerLeft, topologyUpdated,
  gatewayFound, gatewayLost, setSelfInternet, setRoutingStrategy, setMeshActive,
} = meshSlice.actions;
export default meshSlice.reducer;
