import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Notification {
  id: string;
  message: string;
  status: 'read' | 'unread';
  created_at: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    subscribeToNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      return;
    }

    setNotifications(data);
    setUnreadCount(data.filter((n) => n.status === 'unread').length);
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          setNotifications((current) => [payload.new, ...current].slice(0, 10));
          setUnreadCount((count) => count + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      return;
    }

    setNotifications((current) =>
      current.map((n) =>
        n.id === notificationId ? { ...n, status: 'read' } : n
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllAsRead = async () => {
    const { error } = await supabase.rpc('mark_notifications_as_read');

    if (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      return;
    }

    setNotifications((current) =>
      current.map((n) => ({ ...n, status: 'read' }))
    );
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1 hover:bg-gray-100"
      >
        <svg
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start p-4 ${
                      notification.status === 'unread'
                        ? 'bg-blue-50'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {notification.status === 'unread' && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-4 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-center text-gray-500">
                Aucune notification
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
