import React, { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications';
import { Notification } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaBell, FaCheck, FaCheckDouble } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.getAll();
      const list: Notification[] = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      await fetchNotifications();
    };
    loadNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      appointment: 'bg-blue-100 text-blue-600',
      billing: 'bg-green-100 text-green-600',
      system: 'bg-purple-100 text-purple-600',
      medical: 'bg-orange-100 text-orange-600',
    };
    return icons[type] || 'bg-gray-100 text-gray-600';
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-medicare-dark">Notifications</h1>
          {unreadCount > 0 && (
            <span className="ml-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-outline flex items-center text-sm"
          >
            <FaCheckDouble className="mr-2" /> Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <FaBell className="text-4xl mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card flex items-start gap-4 hover:shadow-lg transition-shadow ${
                !notification.is_read ? 'border-l-4 border-medicare-teal' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIcon(
                  notification.notification_type
                )}`}
              >
                <FaBell className="text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-medicare-dark">{notification.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs text-medicare-teal hover:underline mt-2 flex items-center"
                  >
                    <FaCheck className="mr-1" /> Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
