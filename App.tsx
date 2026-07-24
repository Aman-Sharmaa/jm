/**
 * Jantar Mantar — Main Application Entry Point
 * Author: Aman Sharma
 *
 * Bootstraps the application, loading the Redux provider and navigation router.
 */
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import DatabaseService from './src/database/DatabaseService';

export function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize Database
    DatabaseService.init()
      .then(() => {
        console.log('[App] Database init successful');
      })
      .catch((e) => {
        console.error('[App] Database init failed:', e);
      });
  }, []);

  return (
    <Provider store={store}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />
      <AppNavigator />
    </Provider>
  );
}

export default App;
