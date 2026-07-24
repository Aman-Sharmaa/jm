/**
 * Jantar Mantar — Group Chat Screen
 * Author: Aman Sharma
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState } from '../store';
import type { Message } from '../types';

export function GroupChatScreen({ route, navigation }: any): React.JSX.Element {
  const { groupId, groupName } = route.params;
  const selfIdentity = useSelector((s: RootState) => s.auth.identity);
  const [inputText, setInputText] = useState('');

  // Sample static chat history
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      conversationId: groupId,
      senderId: 'karan-id',
      type: 'text',
      content: 'Hello everyone! Formed the mesh link successfully.',
      status: 'read',
      timestamp: Date.now() - 3600000,
      signature: '',
      nonce: '',
      isRelayed: true,
    },
    {
      id: '2',
      conversationId: groupId,
      senderId: 'rohit-id',
      type: 'text',
      content: 'Awesome. I can route through Karan to reach Aman.',
      status: 'read',
      timestamp: Date.now() - 1800000,
      signature: '',
      nonce: '',
      isRelayed: true,
    },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: `${Date.now()}`,
      conversationId: groupId,
      senderId: selfIdentity?.deviceId ?? 'self',
      type: 'text',
      content: inputText.trim(),
      status: 'sent',
      timestamp: Date.now(),
      signature: '',
      nonce: '',
      isRelayed: false,
    };
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isSelf = item.senderId === selfIdentity?.deviceId;
    return (
      <View style={[styles.messageRow, isSelf ? styles.selfRow : styles.peerRow]}>
        {!isSelf && (
          <Text style={styles.senderLabel}>
            {item.senderId.slice(0, 6).toUpperCase()}
          </Text>
        )}
        <View style={[styles.bubble, isSelf ? styles.selfBubble : styles.peerBubble]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <View style={styles.msgFooter}>
            <Text style={styles.timeText}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.onlineStatus}>Mesh Multi-cast</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.list}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Broadcast to group..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendIcon}>➔</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerContent: {
    flex: 1,
  },
  groupName: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  onlineStatus: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    marginBottom: 12,
  },
  selfRow: {
    alignItems: 'flex-end',
  },
  peerRow: {
    alignItems: 'flex-start',
  },
  senderLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selfBubble: {
    backgroundColor: COLORS.primary + '22',
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  peerBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  msgFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceElevated,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 12,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GroupChatScreen;
