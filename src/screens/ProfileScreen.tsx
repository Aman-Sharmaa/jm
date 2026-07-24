/**
 * Jantar Mantar — Profile Screen
 * Author: Aman Sharma
 *
 * Displays local cryptographic node fingerprint and handles identity resets.
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState, AppDispatch } from '../store';
import { signOut } from '../store/authSlice';

export function ProfileScreen({ navigation }: any): React.JSX.Element {
  const { identity } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleSignOut = () => {
    Alert.alert(
      'Reset Node Identity',
      'This will erase your current private/public keypair and generate a new anonymous guest identity. Proceed?',
      [
        { text: 'Cancel' },
        {
          text: 'Confirm Reset',
          style: 'destructive',
          onPress: () => {
            dispatch(signOut());
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cryptographic Identity</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {identity?.displayName ? identity.displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.name}>{identity?.displayName || 'Anonymous Guest'}</Text>
          <Text style={styles.role}>Offline Peer Node</Text>
        </View>

        <Text style={styles.label}>Node Device ID (UUIDv4)</Text>
        <View style={styles.keyBlock}>
          <Text style={styles.keyText}>{identity?.deviceId || 'No ID loaded'}</Text>
        </View>

        <Text style={styles.label}>ECDH Public Key (Base64 Fingerprint)</Text>
        <View style={styles.keyBlock}>
          <Text style={styles.keyText} numberOfLines={4}>
            {identity?.publicKey || 'No key generated'}
          </Text>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleSignOut}>
          <Text style={styles.resetBtnText}>Regenerate Identity & Keys</Text>
        </TouchableOpacity>
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
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarLargeText: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  role: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  keyBlock: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
    marginBottom: 20,
  },
  keyText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  resetBtn: {
    backgroundColor: 'rgba(255, 83, 112, 0.1)',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  resetBtnText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ProfileScreen;
