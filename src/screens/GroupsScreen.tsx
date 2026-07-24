/**
 * Jantar Mantar — Groups Screen (Offline Groups Management)
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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState } from '../store';

export function GroupsScreen({ navigation }: any): React.JSX.Element {
  const { peers } = useSelector((s: RootState) => s.mesh);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');

  // Sample static groups for representation
  const [groups, setGroups] = useState([
    { id: '1', name: 'General Broadcast', membersCount: 5, description: 'Default local offline broadcast channel' },
    { id: '2', name: 'Rescue & SOS Team', membersCount: 3, description: 'Emergency coordination group' },
  ]);

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    const newGroup = {
      id: `${Date.now()}`,
      name: groupName.trim(),
      membersCount: 1, // only self initially
      description: 'Custom peer group created offline',
    };
    setGroups([...groups, newGroup]);
    setGroupName('');
    setModalVisible(false);
    Alert.alert('Group Created', 'Offline group has been created. Invite nearby users via BLE!');
  };

  const renderItem = ({ item }: { item: typeof groups[0] }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('GroupChat', { groupId: item.id, groupName: item.name })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.memberCount}>{item.membersCount} nodes connected</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Groups</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.createBtnText}>+ New Group</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Offline Group</Text>
            <Text style={styles.modalDesc}>
              This group exists completely peer-to-peer. Members join via local direct wireless linkage.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              placeholderTextColor={COLORS.textMuted}
              value={groupName}
              onChangeText={setGroupName}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateGroup}>
                <Text style={styles.confirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  createBtn: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  name: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  memberCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
    width: '100%',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  modalDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
});

export default GroupsScreen;
