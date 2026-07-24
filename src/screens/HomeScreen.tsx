/**
 * Jantar Mantar — Home Screen (Dashboard)
 * Author: Aman Sharma
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState } from '../store';

export function HomeScreen({ navigation }: any): React.JSX.Element {
  const { identity } = useSelector((s: RootState) => s.auth);
  const { peers, nearbyPeers } = useSelector((s: RootState) => s.mesh);
  const { conversations } = useSelector((s: RootState) => s.chat);

  const activePeersCount = Object.values(peers).filter(p => p.status === 'online').length;
  const conversationCount = Object.keys(conversations).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Profile Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste,</Text>
            <Text style={styles.name}>{identity?.displayName || 'Offline Node'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileBadgeText}>
              {identity?.displayName ? identity.displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Identity & Security Info Card */}
        <View style={styles.identityCard}>
          <Text style={styles.cardTitle}>Device Fingerprint</Text>
          <Text style={styles.deviceId} numberOfLines={1} ellipsizeMode="middle">
            ID: {identity?.deviceId}
          </Text>
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AES-256 E2EE</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: COLORS.success + '22' }]}>
              <Text style={[styles.badgeText, { color: COLORS.success }]}>Offline Connected</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activePeersCount}</Text>
            <Text style={styles.statLabel}>Active Nodes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{nearbyPeers.length}</Text>
            <Text style={styles.statLabel}>1-Hop Peers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{conversationCount}</Text>
            <Text style={styles.statLabel}>Local Chats</Text>
          </View>
        </View>

        {/* Action Panel */}
        <Text style={styles.sectionTitle}>Network Services</Text>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('NetworkMap')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: COLORS.primary + '22' }]}>
              <Text style={[styles.menuIcon, { color: COLORS.primary }]}>☊</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Live Topology Map</Text>
              <Text style={styles.menuDesc}>Visualize multi-hop mesh graph nodes and link weights</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EmergencySOS')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: COLORS.error + '22' }]}>
              <Text style={[styles.menuIcon, { color: COLORS.error }]}>⚠</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Emergency SOS Broadcast</Text>
              <Text style={styles.menuDesc}>Send distress location packets repeatedly through hops</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('DeveloperTools')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: COLORS.warning + '22' }]}>
              <Text style={[styles.menuIcon, { color: COLORS.warning }]}>⚙</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Developer Diagnostics</Text>
              <Text style={styles.menuDesc}>Inspect packet queues, raw logs, and link RSSIs</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  profileBadgeText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  identityCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
    marginBottom: 20,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  deviceId: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  menuDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
});

export default HomeScreen;
