/**
 * Jantar Mantar — App Navigator
 * Author: Aman Sharma
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import NetworkMapScreen from '../screens/NetworkMapScreen';
import FileTransferScreen from '../screens/FileTransferScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EmergencySOSScreen from '../screens/EmergencySOSScreen';
import DeveloperToolsScreen from '../screens/DeveloperToolsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  Chat: { conversationId: string; peerId: string; peerName: string };
  GroupChat: { groupId: string; groupName: string };
  NetworkMap: undefined;
  FileTransfer: { transferId?: string; recipientId?: string };
  Profile: { deviceId?: string };
  EmergencySOS: undefined;
  DeveloperTools: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator(): React.JSX.Element {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0A0F1E' },
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: { opacity: current.progress },
          }),
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="GroupChat" component={GroupChatScreen} />
            <Stack.Screen name="NetworkMap" component={NetworkMapScreen} />
            <Stack.Screen name="FileTransfer" component={FileTransferScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
            <Stack.Screen name="DeveloperTools" component={DeveloperToolsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
