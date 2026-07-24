/**
 * Jantar Mantar — Settings Screen
 * Author: Aman Sharma
 *
 * Configures the offline mesh link adapters and limits.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../constants';

export function SettingsScreen({ navigation }: any): React.JSX.Element {
  const [bleEnabled, setBleEnabled] = useState(true);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [autoRelay, setAutoRelay] = useState(true);
  const [batteryLimit, setBatteryLimit] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Connection Section */}
        <Text style={styles.sectionTitle}>Radio Transports</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingName}>Bluetooth LE Link</Text>
              <Text style={styles.settingDesc}>Use low-energy scans for discovery</Text>
            </View>
            <Switch
              value={bleEnabled}
              onValueChange={setBleEnabled}
              thumbColor={bleEnabled ? COLORS.primary : COLORS.textMuted}
              trackColor={{ true: COLORS.primary + '44', false: COLORS.surfaceElevated }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingName}>Wi-Fi Direct Links</Text>
              <Text style={styles.settingDesc}>High bandwidth file transfers</Text>
            </View>
            <Switch
              value={wifiEnabled}
              onValueChange={setWifiEnabled}
              thumbColor={wifiEnabled ? COLORS.primary : COLORS.textMuted}
              trackColor={{ true: COLORS.primary + '44', false: COLORS.surfaceElevated }}
            />
          </View>
        </View>

        {/* Mesh Policies */}
        <Text style={styles.sectionTitle}>Mesh Policies</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingName}>Auto Relay Packets</Text>
              <Text style={styles.settingDesc}>Route other nodes messages over hops</Text>
            </View>
            <Switch
              value={autoRelay}
              onValueChange={setAutoRelay}
              thumbColor={autoRelay ? COLORS.primary : COLORS.textMuted}
              trackColor={{ true: COLORS.primary + '44', false: COLORS.surfaceElevated }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingName}>Battery Saver Threshold</Text>
              <Text style={styles.settingDesc}>Stop relaying below 20% charge</Text>
            </View>
            <Switch
              value={batteryLimit}
              onValueChange={setBatteryLimit}
              thumbColor={batteryLimit ? COLORS.primary : COLORS.textMuted}
              trackColor={{ true: COLORS.primary + '44', false: COLORS.surfaceElevated }}
            />
          </View>
        </View>

        {/* Navigation buttons */}
        <Text style={styles.sectionTitle}>Identity & Diagnostic</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingNavBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.navBtnText}>Identity Profiles & Key Pairs</Text>
            <Text style={styles.navArrow}>➔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingNavBtn} onPress={() => navigation.navigate('DeveloperTools')}>
            <Text style={styles.navBtnText}>Developer Diagnostics Console</Text>
            <Text style={styles.navArrow}>➔</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceElevated,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  settingDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  settingNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceElevated,
  },
  navBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  navArrow: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

export default SettingsScreen;
