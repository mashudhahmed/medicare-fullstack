import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface NotificationPayload {
  id?: number;
  title: string;
  message: string;
  category: 'APPOINTMENT' | 'BILLING' | 'APPOINTMENT_REMINDER' | 'GENERAL';
  created_at?: string;
}

export const useWebSocketNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000/ws';
    const wsUrl = token ? `${wsBaseUrl}/notifications/?token=${token}` : `${wsBaseUrl}/notifications/`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = jsonParse(event.data);
        if (data && data.type === 'notification') {
          const newNotif: NotificationPayload = {
            id: data.id,
            title: data.title,
            message: data.message,
            category: data.category,
            created_at: data.created_at,
          };

          setNotifications((prev) => [newNotif, ...prev]);

          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 ${
                newNotif.category === 'BILLING'
                  ? 'border-amber-500'
                  : newNotif.category === 'APPOINTMENT_REMINDER'
                  ? 'border-purple-500'
                  : newNotif.category === 'APPOINTMENT'
                  ? 'border-blue-500'
                  : 'border-emerald-500'
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{newNotif.title}</p>
                <p className="mt-1 text-sm text-gray-600">{newNotif.message}</p>
              </div>
            </div>
          ));
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { notifications, isConnected };
};

function jsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
