/**
 * Jantar Mantar — Chat Redux Slice
 * Author: Aman Sharma
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Message, Conversation, TypingIndicator } from '../types';

interface ChatState {
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>; // conversationId → messages
  typingIndicators: Record<string, TypingIndicator>;
  activeConversationId: string | null;
}

const initialState: ChatState = {
  conversations: {},
  messages: {},
  typingIndicators: {},
  activeConversationId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    conversationLoaded(state, action: PayloadAction<Conversation>) {
      state.conversations[action.payload.id] = action.payload;
    },
    conversationsLoaded(state, action: PayloadAction<Conversation[]>) {
      for (const c of action.payload) {
        state.conversations[c.id] = c;
      }
    },
    messageReceived(state, action: PayloadAction<Message>) {
      const msg = action.payload;
      if (!state.messages[msg.conversationId]) {
        state.messages[msg.conversationId] = [];
      }
      // Avoid duplicates
      const exists = state.messages[msg.conversationId].some(m => m.id === msg.id);
      if (!exists) {
        state.messages[msg.conversationId].push(msg);
      }
      // Update conversation preview
      if (state.conversations[msg.conversationId]) {
        state.conversations[msg.conversationId].lastMessage = msg;
        state.conversations[msg.conversationId].updatedAt = msg.timestamp;
        if (msg.conversationId !== state.activeConversationId) {
          state.conversations[msg.conversationId].unreadCount += 1;
        }
      }
    },
    messagesLoaded(state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) {
      state.messages[action.payload.conversationId] = action.payload.messages;
    },
    messageStatusUpdated(state, action: PayloadAction<{ messageId: string; conversationId: string; status: Message['status'] }>) {
      const msgs = state.messages[action.payload.conversationId] ?? [];
      const msg = msgs.find(m => m.id === action.payload.messageId);
      if (msg) msg.status = action.payload.status;
    },
    typingUpdated(state, action: PayloadAction<TypingIndicator>) {
      state.typingIndicators[action.payload.conversationId] = action.payload;
    },
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
      if (action.payload && state.conversations[action.payload]) {
        state.conversations[action.payload].unreadCount = 0;
      }
    },
    markRead(state, action: PayloadAction<string>) {
      if (state.conversations[action.payload]) {
        state.conversations[action.payload].unreadCount = 0;
      }
    },
  },
});

export const {
  conversationLoaded, conversationsLoaded, messageReceived, messagesLoaded,
  messageStatusUpdated, typingUpdated, setActiveConversation, markRead,
} = chatSlice.actions;
export default chatSlice.reducer;
