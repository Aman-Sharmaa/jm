/**
 * Jantar Mantar — Live Topology Network Map
 * Author: Aman Sharma
 *
 * Shows the multi-hop network connection path visually.
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState } from '../store';

export function NetworkMapScreen({ navigation }: any): React.JSX.Element {
  const { identity } = useSelector((s: RootState) => s.auth);
  const { peers } = useSelector((s: RootState) => s.mesh);

  const activePeers = Object.values(peers).filter(p => p.status === 'online');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Mesh Map</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Visualizing dynamic link weight propagation over multi-hop routing paths.
        </Text>

        {/* Graph topology display */}
        <View style={styles.mapContainer}>
          {/* Self node (root) */}
          <View style={styles.nodeWrapper}>
            <View style={[styles.node, styles.selfNode]}>
              <Text style={styles.nodeInitial}>
                {identity?.displayName ? identity.displayName.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
            <Text style={styles.nodeLabel}>You (Root)</Text>
            <Text style={styles.nodeMeta}>Battery: 100%</Text>
          </View>

          {/* Connection links list representation */}
          {activePeers.length === 0 ? (
            <View style={styles.noConnections}>
              <Text style={styles.noConnText}>No mesh links discovered.</Text>
            </View>
          ) : (
            <View style={styles.linksContainer}>
              <View style={styles.arrowLine} />
              {activePeers.map((peer, idx) => (
                <View key={peer.deviceId} style={styles.peerNodeRow}>
                  <View style={styles.hopIndicator}>
                    <Text style={styles.hopText}>hop {peer.hopCount}</Text>
                  </View>
                  <View style={[styles.node, styles.peerNode]}>
                    <Text style={styles.nodeInitial}>{peer.displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.linkInfo}>
                    <Text style={styles.peerName}>{peer.displayName}</Text>
                    <Text style={styles.peerDetails}>
                      Signal: {peer.signalStrength} dBm | RSSI Latency: {peer.hopCount * 12}ms
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceElevated,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    marginRight: 16,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18,
  },
  mapContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  nodeWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  node: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  selfNode: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  peerNode: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
  },
  nodeInitial: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  nodeLabel: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  nodeMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  noConnections: {
    paddingVertical: 40,
  },
  noConnText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  linksContainer: {
    width: '100%',
    marginTop: 10,
    position: 'relative',
    alignItems: 'center',
    gap: 16,
  },
  arrowLine: {
    position: 'absolute',
    top: -20,
    width: 2,
    height: '100%',
    backgroundColor: COLORS.surfaceElevated,
    zIndex: -1,
  },
  peerNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    padding: 10,
    borderRadius: 10,
    width: '90%',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  hopIndicator: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 10,
  },
  hopText: {
    color: COLORS.background,
    fontSize: 8,
    fontWeight: 'bold',
  },
  linkInfo: {
    marginLeft: 12,
    flex: 1,
  },
  peerName: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  peerDetails: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});

export default NetworkMapScreen;
