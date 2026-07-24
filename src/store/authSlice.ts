/**
 * Jantar Mantar — Auth Redux Slice
 * Author: Aman Sharma
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { DeviceIdentity, AuthMode } from '../types';
import authService from '../services/AuthService';

interface AuthState {
  identity: DeviceIdentity | null;
  mode: AuthMode;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  identity: null,
  mode: 'guest',
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
};

export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  return authService.initialize();
});

export const createGuestIdentity = createAsyncThunk(
  'auth/createGuest',
  async (displayName?: string) => authService.createGuestIdentity(displayName),
);

export const updateDisplayName = createAsyncThunk(
  'auth/updateDisplayName',
  async ({ identity, name }: { identity: DeviceIdentity; name: string }) =>
    authService.updateDisplayName(identity, name),
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    setMode(state, action: PayloadAction<AuthMode>) {
      state.mode = action.payload;
    },
    signOut(state) {
      state.identity = null;
      state.mode = 'guest';
      state.isAuthenticated = false;
      state.token = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(initializeAuth.pending, state => { state.loading = true; state.error = null; })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.identity = action.payload;
        state.isAuthenticated = true;
        state.mode = 'guest';
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Auth failed';
      })
      .addCase(createGuestIdentity.fulfilled, (state, action) => {
        state.identity = action.payload;
        state.isAuthenticated = true;
        state.mode = 'guest';
      })
      .addCase(updateDisplayName.fulfilled, (state, action) => {
        state.identity = action.payload;
      });
  },
});

export const { setToken, setMode, signOut } = authSlice.actions;
export default authSlice.reducer;
