/**
 * Jantar Mantar — Chats Screen (Conversation List)
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
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import type { RootState } from '../store';
import type { Conversation } from '../types';

export function ChatsScreen({ navigation }: any): React.JSX.Element {
  const { conversations } = useSelector((s: RootState) => s.chat);
  const { peers } = useSelector((s: RootState) => s.mesh);
  const { identity } = useSelector((s: RootState) => s.auth);
  const [search, setSearch] = useState('');

  const convList = Object.values(conversations).sort((a, b) => b.updatedAt - a.updatedAt);

  const filteredConvs = convList.filter((c) => {
    if (c.type === 'direct') {
      const otherId = c.participantIds.find((id) => id !== identity?.deviceId);
      const peer = otherId ? peers[otherId] : null;
      const name = peer?.displayName || 'Unknown Peer';
      return name.toLowerCase().includes(search.toLowerCase());
    }
    return c.groupId?.toLowerCase().includes(search.toLowerCase());
  });

  const renderItem = ({ item }: { item: Conversation }) => {
    // Determine title and active status
    let title = 'Direct Message';
    let statusText = 'offline';
    let isOnline = false;
    let peerId = '';

    if (item.type === 'direct') {
      const otherId = item.participantIds.find((id) => id !== item.participantIds[0]); // Simple fallback logic
      peerId = otherId || '';
      const peer = otherId ? peers[otherId] : null;
      title = peer?.displayName || `Peer-${peerId.slice(-6)}`;
      isOnline = peer?.status === 'online';
      statusText = peer?.status || 'offline';
    } else {
      title = `Group Chat (${item.groupId})`;
      isOnline = true;
    }

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            peerId,
            peerName: title,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{title.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textMuted }]} />
        </View>

        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.chatTime}>
              {item.lastMessage
                ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
          </View>
          <View style={styles.chatSub}>
            <Text style={styles.lastMsg} numberOfLines={1}>
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversations</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search chats..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filteredConvs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active chats found.</Text>
          <Text style={styles.emptySubText}>
            Go to the 'Nearby' tab to discover and connect with other offline devices.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConvs}
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
  searchBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  list: {
    paddingHorizontal: 20,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceElevated,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  chatDetails: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
  },
  chatTime: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  chatSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsg: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ChatsScreen;
