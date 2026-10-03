import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import { Notification } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaBell, FaCheckDouble, FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

type NotificationFilterType = 'all' | 'unread' | 'appointment' | 'billing' | 'system' | 'medical';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NotificationFilterType>('all');

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
    fetchNotifications();
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

  const filteredNotifications = notifications.filter((n) => {
    let matchesType = true;
    if (filterType === 'unread') {
      matchesType = !n.is_read;
    } else if (filterType !== 'all') {
      matchesType = n.notification_type === filterType;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesType;

    const title = n.title?.toLowerCase() || '';
    const message = n.message?.toLowerCase() || '';
    return matchesType && (title.includes(query) || message.includes(query));
  });

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || filterType !== 'all';

  if (loading && notifications.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-medicare-dark">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-outline flex items-center text-sm self-start sm:self-auto"
          >
            <FaCheckDouble className="mr-2" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search notification contents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-medium">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'unread', label: `Unread (${unreadCount})` },
              { key: 'appointment', label: 'Appointments' },
              { key: 'billing', label: 'Billing' },
              { key: 'medical', label: 'Medical' },
              { key: 'system', label: 'System' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                filterType === tab.key
                  ? 'bg-medicare-teal text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 border rounded-lg transition"
          >
            <FaTimes /> Clear
          </button>
        )}
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          Showing {filteredNotifications.length}{' '}
          {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
        </span>
        {hasActiveFilters && (
          <span className="flex items-center gap-1 text-medicare-teal">
            <FaFilter className="text-[10px]" /> Filtered results
          </span>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="card text-center py-14">
          <FaBell className="text-4xl mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 font-medium">No notifications found</p>
          <p className="text-xs text-gray-400 mt-1">There are no updates matching your search or active filter tab.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 btn-outline inline-flex items-center text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`card flex items-start gap-4 hover:shadow-md transition-shadow ${
                !notification.is_read ? 'border-l-4 border-medicare-teal bg-teal-50/20' : ''
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
                  <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[11px] capitalize bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                    {notification.notification_type}
                  </span>
                  {notification.notification_type === 'appointment' && (
                    <Link
                      to="/appointments"
                      className="text-xs text-medicare-teal hover:underline font-semibold"
                    >
                      Open Appointments &rarr;
                    </Link>
                  )}
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 hover:underline font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
