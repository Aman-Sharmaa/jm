/**
 * Jantar Mantar — Emergency SOS Screen
 * Author: Aman Sharma
 *
 * Emergency SOS broadcast page using direct mesh flood routing.
 */
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants';

export function EmergencySOSScreen({ navigation }: any): React.JSX.Element {
  const [sosActive, setSosActive] = useState(false);
  const [broadcastCount, setBroadcastCount] = useState(0);
  const sosIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleTriggerSOS = () => {
    if (sosActive) {
      setSosActive(false);
      if (sosIntervalRef.current) {
        clearInterval(sosIntervalRef.current);
        sosIntervalRef.current = null;
      }
      Alert.alert('SOS Deactivated', 'Emergency broadcast has been stopped.');
    } else {
      setSosActive(true);
      setBroadcastCount(1);
      // Simulate flood routing transmission loop
      sosIntervalRef.current = setInterval(() => {
        setBroadcastCount(prev => prev + 1);
      }, 3000);
      
      Alert.alert(
        'SOS Broadcast Active',
        'Distress signal containing medical info & battery status is flood-broadcasting to all nodes in range.'
      );
    }
  };

  React.useEffect(() => {
    return () => {
      if (sosIntervalRef.current) {
        clearInterval(sosIntervalRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency SOS</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.desc}>
          Press the button below to initiate emergency mesh broadcast. Nodes receiving this will relay it indefinitely until internet access is found or rescue services acknowledge.
        </Text>

        <TouchableOpacity
          style={[styles.sosButton, sosActive ? styles.sosActiveButton : styles.sosInactiveButton]}
          onPress={handleTriggerSOS}
          activeOpacity={0.8}
        >
          <Text style={styles.sosButtonText}>{sosActive ? 'STOP' : 'SOS'}</Text>
        </TouchableOpacity>

        {sosActive && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Broadcasting Distress Signal...</Text>
            <Text style={styles.statusMeta}>Packets transmitted: {broadcastCount}</Text>
            <Text style={styles.statusMeta}>Simulated GPS: 28.6129° N, 77.2295° E</Text>
            <Text style={styles.statusMeta}>Medical Tag: Asthma Patient</Text>
          </View>
        )}
      </View>
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
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 40,
  },
  sosInactiveButton: {
    backgroundColor: COLORS.error + '22',
    borderColor: COLORS.error,
  },
  sosActiveButton: {
    backgroundColor: COLORS.error,
    borderColor: '#FFF',
  },
  sosButtonText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error + '44',
    width: '100%',
    alignItems: 'center',
  },
  statusTitle: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  statusMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});

export default EmergencySOSScreen;
