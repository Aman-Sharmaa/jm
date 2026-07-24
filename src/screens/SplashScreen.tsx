/**
 * Jantar Mantar — Splash Screen
 * Author: Aman Sharma
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { COLORS } from '../constants';
import { initializeAuth } from '../store/authSlice';
import type { AppDispatch } from '../store';

export function SplashScreen({ navigation }: any): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Initialize Identity and then redirect
    const initTimer = setTimeout(() => {
      dispatch(initializeAuth())
        .unwrap()
        .then((identity) => {
          if (identity && identity.displayName && !identity.displayName.startsWith('User-')) {
            navigation.replace('Main');
          } else {
            navigation.replace('Login');
          }
        })
        .catch(() => {
          navigation.replace('Login');
        });
    }, 2500);

    return () => clearTimeout(initTimer);
  }, [dispatch, fadeAnim, scaleAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>◎</Text>
        </View>
        <Text style={styles.title}>Jantar Mantar</Text>
        <Text style={styles.subtitle}>Decentralized Mesh Network</Text>
      </Animated.View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Author: Aman Sharma</Text>
        <Text style={styles.footerSec}>100% Offline-First communication</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00E5FF22',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 48,
    color: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  footerSec: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
});

export default SplashScreen;
