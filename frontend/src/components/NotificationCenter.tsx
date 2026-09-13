import React, { useState } from 'react';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';

export const NotificationCenter: React.FC = () => {
  const { notifications, isConnected } = useWebSocketNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none rounded-full hover:bg-gray-100 transition duration-150"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        <span
          className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            isConnected ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />

        {notifications.length > 0 && (
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100">
          <div className="p-3 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            <span className="text-xs font-medium text-gray-500">
              {isConnected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 text-center">No new notifications</p>
            ) : (
              notifications.map((notif, idx) => (
                <div key={idx} className="p-3 hover:bg-gray-50 transition duration-150">
                  <p className="text-xs font-bold text-gray-800">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                  {notif.created_at && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};