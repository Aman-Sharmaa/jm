/**
 * Jantar Mantar — Redux Store
 * Author: Aman Sharma
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import meshReducer from './meshSlice';
import chatReducer from './chatSlice';
import transferReducer from './transferSlice';
import gatewayReducer from './gatewaySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    mesh: meshReducer,
    chat: chatReducer,
    transfer: transferReducer,
    gateway: gatewayReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredActions: ['mesh/topologyUpdated'],
        ignoredPaths: ['mesh.topology'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
