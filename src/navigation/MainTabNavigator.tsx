/**
 * Jantar Mantar — Main Tab Navigator
 * Author: Aman Sharma
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { COLORS } from '../constants';

import HomeScreen from '../screens/HomeScreen';
import ChatsScreen from '../screens/ChatsScreen';
import NearbyScreen from '../screens/NearbyScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type MainTabParamList = {
  Home: undefined;
  Chats: undefined;
  Nearby: undefined;
  Downloads: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─────────────────────────────────────────────
// Custom Tab Bar
// ─────────────────────────────────────────────

type TabItem = {
  name: keyof MainTabParamList;
  label: string;
  icon: string;
};

const TABS: TabItem[] = [
  { name: 'Home', label: 'Home', icon: '⌂' },
  { name: 'Chats', label: 'Chats', icon: '✉' },
  { name: 'Nearby', label: 'Nearby', icon: '◎' },
  { name: 'Downloads', label: 'Files', icon: '⬇' },
  { name: 'Settings', label: 'Settings', icon: '⚙' },
];

function CustomTabBar({ state, descriptors, navigation }: any): React.JSX.Element {
  const unreadCount = useSelector((s: RootState) =>
    Object.values(s.chat.conversations).reduce((sum, c) => sum + c.unreadCount, 0),
  );

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = TABS[index];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
              <Text style={[styles.icon, isFocused && styles.iconActive]}>{tab.icon}</Text>
              {tab.name === 'Chats' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1C2333',
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: '#00E5FF22',
  },
  icon: {
    fontSize: 18,
    color: '#445566',
  },
  iconActive: {
    color: '#00E5FF',
  },
  label: {
    fontSize: 10,
    color: '#445566',
    fontWeight: '500',
  },
  labelActive: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5370',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Nearby" component={NearbyScreen} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default MainTabNavigator;
