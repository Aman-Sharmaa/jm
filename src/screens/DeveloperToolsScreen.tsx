/**
 * Jantar Mantar — Developer Diagnostics Console
 * Author: Aman Sharma
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState } from '../store';

export function DeveloperToolsScreen({ navigation }: any): React.JSX.Element {
  const { peers } = useSelector((s: RootState) => s.mesh);
  const [logs, setLogs] = useState([
    { id: '1', time: '14:20:05', msg: '[MeshOrchestrator] BLE Advertising started successfully' },
    { id: '2', time: '14:20:06', msg: '[WiFiDirectManager] Interface wlan0 initialized' },
    { id: '3', time: '14:20:08', msg: '[RoutingEngine] Recalculated Dijkstra weights: 1 hops' },
  ]);

  const activePeers = Object.values(peers);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Developer Tools</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Routing Table */}
        <Text style={styles.sectionTitle}>Routing Tables</Text>
        <View style={styles.card}>
          {activePeers.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No routing paths recorded.</Text>
            </View>
          ) : (
            activePeers.map(p => (
              <View key={p.deviceId} style={styles.tableRow}>
                <Text style={styles.column}>{p.displayName}</Text>
                <Text style={styles.column}>Hops: {p.hopCount}</Text>
                <Text style={styles.column}>Status: {p.status}</Text>
              </View>
            ))
          )}
        </View>

        {/* Diagnostic Logs */}
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Link Logs</Text>
          <TouchableOpacity onPress={clearLogs}>
            <Text style={styles.clearBtnText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.logCard]}>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No link logs.</Text>
          ) : (
            logs.map(log => (
              <Text key={log.id} style={styles.logText}>
                [{log.time}] {log.msg}
              </Text>
            ))
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
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
    padding: 12,
    marginBottom: 20,
  },
  emptyRow: {
    paddingVertical: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceElevated,
  },
  column: {
    color: COLORS.textPrimary,
    fontSize: 12,
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtnText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  logCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    minHeight: 150,
  },
  logText: {
    color: COLORS.success,
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
});

export default DeveloperToolsScreen;
