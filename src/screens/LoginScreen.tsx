/**
 * Jantar Mantar — Login Screen
 * Author: Aman Sharma
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../constants';
import { createGuestIdentity } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store';

export function LoginScreen({ navigation }: any): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((s: RootState) => s.auth);
  const [displayName, setDisplayName] = useState('');

  const handleGuestLogin = () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter a name or nickname to register your offline identity.');
      return;
    }
    dispatch(createGuestIdentity(displayName.trim()))
      .unwrap()
      .then(() => {
        navigation.replace('Main');
      })
      .catch((err) => {
        Alert.alert('Error', err?.message ?? 'Failed to initialize identity.');
      });
  };

  const handleMockGoogleLogin = () => {
    Alert.alert(
      'Internet Needed',
      'Google Login is currently disabled because this is a fully offline mesh installation. Please use Guest identity.'
    );
  };

  const handleMockOTPLogin = () => {
    Alert.alert(
      'Internet Needed',
      'OTP Login requires cell service/SMS gateway. Please use Guest identity for peer-to-peer connection.'
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Create Identity</Text>
        <Text style={styles.descText}>
          Your keypair is generated locally on your phone. No backend database required.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Aman Sharma"
          placeholderTextColor={COLORS.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={32}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGuestLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Generating keys...' : 'Create Offline Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with (internet mode)</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleMockGoogleLogin}>
          <Text style={styles.secButtonText}>Sign In with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleMockOTPLogin}>
          <Text style={styles.secButtonText}>Sign In with Phone OTP</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure ECDH/AES-256 local storage</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  descText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceElevated,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginHorizontal: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
    marginBottom: 12,
  },
  secButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});

export default LoginScreen;
