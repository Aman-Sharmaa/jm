/**
 * Jantar Mantar — File Transfer Screen
 * Author: Aman Sharma
 *
 * Shows file sharing progress, divided chunks representation, throughput speed, and controls.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, Alert } from 'react-native';
import { COLORS } from '../constants';

export function FileTransferScreen({ route, navigation }: any): React.JSX.Element {
  const { recipientId } = route.params || {};
  const [progress, setProgress] = useState(0.0);
  const [status, setStatus] = useState<'Sending' | 'Completed' | 'Paused'>('Sending');
  const [speed, setSpeed] = useState('1.2 MB/s');

  useEffect(() => {
    let interval: any;
    if (status === 'Sending') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1.0) {
            setStatus('Completed');
            clearInterval(interval);
            return 1.0;
          }
          return prev + 0.05;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handlePauseResume = () => {
    if (status === 'Sending') {
      setStatus('Paused');
    } else if (status === 'Paused') {
      setStatus('Sending');
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Transfer', 'Are you sure you want to stop this file transfer?', [
      { text: 'No' },
      { text: 'Yes', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>File Exchange</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.fileIcon}>📄</Text>
          <Text style={styles.fileName}>JantarMantar_Scaffold_App.zip</Text>
          <Text style={styles.fileSize}>45.8 MB</Text>
          <Text style={styles.statusText}>{status} to {recipientId?.slice(0, 8) || 'nearby node'}...</Text>

          {/* Progress indicators */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressPct}>{(progress * 100).toFixed(0)}%</Text>
              <Text style={styles.speed}>{status === 'Sending' ? speed : '0 KB/s'}</Text>
            </View>
          </View>

          {/* Parallel pipelines visual simulation */}
          <Text style={styles.pipelineTitle}>Parallel Mesh Pipelines (4 Chunks/s)</Text>
          <View style={styles.pipelineContainer}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.pipelineDot,
                  { backgroundColor: status === 'Sending' && progress < 1.0 ? COLORS.primary : COLORS.surfaceElevated }
                ]}
              />
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {status !== 'Completed' && (
              <TouchableOpacity style={styles.controlBtn} onPress={handlePauseResume}>
                <Text style={styles.controlBtnText}>{status === 'Sending' ? 'Pause' : 'Resume'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.controlBtn, styles.cancelBtn]} onPress={handleCancel}>
              <Text style={styles.controlBtnText}>{status === 'Completed' ? 'Close' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  fileIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  fileName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  fileSize: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 14,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPct: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  speed: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  pipelineTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pipelineContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  pipelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  controlBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  controlBtnText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 83, 112, 0.1)',
    borderColor: COLORS.error,
  },
});

export default FileTransferScreen;
