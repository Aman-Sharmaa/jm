/**
 * Jantar Mantar — Nearby Screen
 * Author: Aman Sharma
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState } from '../store';
import type { MeshPeer } from '../types';

export function NearbyScreen({ navigation }: any): React.JSX.Element {
  const { peers } = useSelector((s: RootState) => s.mesh);
  const [scanning, setScanning] = useState(true);

  const activePeers = Object.values(peers).filter(p => p.status === 'online');

  const toggleScan = () => {
    setScanning(!scanning);
  };

  const handleStartChat = (peer: MeshPeer) => {
    const conversationId = `conv_${Date.now()}`;
    navigation.navigate('Chat', {
      conversationId,
      peerId: peer.deviceId,
      peerName: peer.displayName,
    });
  };

  const renderItem = ({ item }: { item: MeshPeer }) => {
    // Generate RSSI color based on link quality
    let rssiColor: string = COLORS.signalWeak;
    if (item.signalStrength > -65) rssiColor = COLORS.signalExcellent;
    else if (item.signalStrength > -85) rssiColor = COLORS.signalGood;

    return (
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.name}>{item.displayName}</Text>
          <Text style={styles.subText} numberOfLines={1}>
            ID: {item.deviceId.slice(0, 8)}... | Dist: ~{(item.distanceEstimate ?? 1.5).toFixed(1)}m
          </Text>
          <View style={styles.metricsRow}>
            <Text style={[styles.metric, { color: rssiColor }]}>
              📶 {item.signalStrength} dBm
            </Text>
            <Text style={styles.metric}>
              🔋 {item.batteryLevel}%
            </Text>
            {item.hasInternet && (
              <Text style={[styles.metric, styles.gatewayBadge]}>
                ⚡ GW
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.chatBtn} onPress={() => handleStartChat(item)}>
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fileBtn}
            onPress={() => navigation.navigate('FileTransfer', { recipientId: item.deviceId })}
          >
            <Text style={styles.fileBtnText}>Send File</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Discovered</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={toggleScan}>
          {scanning ? (
            <View style={styles.scanRow}>
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.scanBtnText}>Scanning</Text>
            </View>
          ) : (
            <Text style={styles.scanBtnText}>Start Scan</Text>
          )}
        </TouchableOpacity>
      </View>

      {activePeers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No devices in range.</Text>
          <Text style={styles.emptySubText}>
            Ensure Bluetooth and Wi-Fi are turned on. The app broadcasts and scans automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activePeers}
          keyExtractor={(item) => item.deviceId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  scanBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    flex: 2,
  },
  name: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  metric: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  gatewayBadge: {
    backgroundColor: COLORS.accent + '22',
    color: COLORS.accentLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  actions: {
    flex: 1.2,
    alignItems: 'flex-end',
    gap: 6,
  },
  chatBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  chatBtnText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: 'bold',
  },
  fileBtn: {
    borderColor: COLORS.surfaceElevated,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  fileBtnText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NearbyScreen;
