import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { ChatMessage, SendChatMessageData, ConversationSummary } from '../types';

export const messagesApi = {
  getConversations: async (): Promise<ConversationSummary[]> => {
    const { data } = await api.get(ENDPOINTS.MESSAGES.CONVERSATIONS);
    return Array.isArray(data) ? data : [];
  },

  getThread: async (userId: string): Promise<ChatMessage[]> => {
    const { data } = await api.get(ENDPOINTS.MESSAGES.THREAD(userId));
    return Array.isArray(data) ? data : [];
  },

  sendMessage: async (payload: SendChatMessageData): Promise<ChatMessage> => {
    const { data } = await api.post(ENDPOINTS.MESSAGES.SEND, payload);
    return data;
  },

  markRead: async (userId: string): Promise<{ message: string; updated_count: number }> => {
    const { data } = await api.post(ENDPOINTS.MESSAGES.MARK_READ(userId));
    return data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const { data } = await api.get(ENDPOINTS.MESSAGES.UNREAD_COUNT);
    return data;
  },
};

export default messagesApi;
