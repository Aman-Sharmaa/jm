/**
 * Jantar Mantar — Downloads Screen (File Manager)
 * Author: Aman Sharma
 *
 * Displays files downloaded via the offline mesh network.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { COLORS } from '../constants';

export function DownloadsScreen(): React.JSX.Element {
  const [files, setFiles] = useState([
    { id: '1', name: 'Emergency_Manual.pdf', size: '1.2 MB', date: 'Today, 2:15 PM', sender: 'Rohit' },
    { id: '2', name: 'offline_map_delhi.xml', size: '124 MB', date: 'Yesterday, 6:30 PM', sender: 'karan' },
    { id: '3', name: 'photo_camp_setup.jpg', size: '4.5 MB', date: '3 days ago', sender: 'Aman' },
  ]);

  const handleOpenFile = (fileName: string) => {
    Alert.alert('Open File', `Opening ${fileName} from local storage...`);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete File', 'Remove this file from offline cache?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: () => setFiles(files.filter(f => f.id !== id)) }
    ]);
  };

  const renderItem = ({ item }: { item: typeof files[0] }) => (
    <View style={styles.card}>
      <Text style={styles.fileIcon}>📂</Text>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.subText}>{item.size} • Received from {item.sender}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.openBtn} onPress={() => handleOpenFile(item.name)}>
          <Text style={styles.openBtnText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shared Files</Text>
      </View>

      {files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No downloaded files.</Text>
          <Text style={styles.emptySubText}>Files shared by other mesh nodes will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
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
  fileIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  details: {
    flex: 1,
    marginRight: 8,
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
    marginBottom: 4,
  },
  date: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openBtn: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  openBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 16,
    color: COLORS.error,
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
  },
});

export default DownloadsScreen;
