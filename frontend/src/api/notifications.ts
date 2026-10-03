import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { Notification } from '../types';

export const notificationsApi = {
  getAll: async (): Promise<{ results: Notification[] } | Notification[]> => {
    const { data } = await api.get(ENDPOINTS.NOTIFICATIONS.LIST);
    return data;
  },

  markAsRead: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.post(ENDPOINTS.NOTIFICATIONS.READ(id));
    return data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const { data } = await api.post(ENDPOINTS.NOTIFICATIONS.READ_ALL);
    return data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number; latest_notification?: Notification | null }> => {
    const { data } = await api.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return data;
  },
};

export default notificationsApi;
