/**
 * Jantar Mantar — Chat Screen (One-to-One Chat Window)
 * Author: Aman Sharma
 */
import React, { useState, useEffect } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState, AppDispatch } from '../store';
import { messageReceived } from '../store/chatSlice';
import type { Message } from '../types';

export function ChatScreen({ route, navigation }: any): React.JSX.Element {
  const { conversationId, peerId, peerName } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const messages = useSelector((s: RootState) => s.chat.messages[conversationId] || []);
  const selfIdentity = useSelector((s: RootState) => s.auth.identity);
  const peers = useSelector((s: RootState) => s.mesh.peers);
  
  const [inputText, setInputText] = useState('');

  const isOnline = peers[peerId]?.status === 'online';

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Simulate sending an offline message and writing to database/store
    const newMsg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      conversationId,
      senderId: selfIdentity?.deviceId ?? 'self',
      recipientId: peerId,
      type: 'text',
      content: inputText.trim(),
      status: isOnline ? 'sent' : 'pending',
      timestamp: Date.now(),
      signature: '',
      nonce: '',
      isRelayed: false,
    };

    dispatch(messageReceived(newMsg));
    setInputText('');
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isSelf = item.senderId === selfIdentity?.deviceId;

    return (
      <View style={[styles.messageRow, isSelf ? styles.selfRow : styles.peerRow]}>
        <View style={[styles.bubble, isSelf ? styles.selfBubble : styles.peerBubble]}>
          <Text style={[styles.messageText, isSelf ? styles.selfText : styles.peerText]}>
            {item.content}
          </Text>
          <View style={styles.msgFooter}>
            <Text style={styles.timeText}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isSelf && (
              <Text style={[styles.statusText, item.status === 'sent' && { color: COLORS.primary }]}>
                {item.status === 'sent' ? '✓' : item.status === 'delivered' ? '✓✓' : '◷'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.peerName}>{peerName}</Text>
          <Text style={[styles.onlineStatus, { color: isOnline ? COLORS.success : COLORS.textMuted }]}>
            {isOnline ? 'Online via Mesh' : 'Offline — messages queued'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('FileTransfer', { recipientId: peerId })}
        >
          <Text style={styles.actionIcon}>📎</Text>
        </TouchableOpacity>
      </View>

      {/* Message List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.list}
      />

      {/* Input keyboard container */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type offline message..."
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
  peerName: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  onlineStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  actionBtn: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  selfRow: {
    justifyContent: 'flex-end',
  },
  peerRow: {
    justifyContent: 'flex-start',
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
    fontSize: 14,
    lineHeight: 20,
  },
  selfText: {
    color: COLORS.textPrimary,
  },
  peerText: {
    color: COLORS.textPrimary,
  },
  msgFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  statusText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
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

export default ChatScreen;
