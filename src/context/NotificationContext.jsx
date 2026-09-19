import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead as apiMarkOne,
  markAllAsRead as apiMarkAll
} from '../services/notificationService';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch all notifications and re-compute unread count from the list
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await getMyNotifications();
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead && !n.is_read).length);
    } catch (err) {
      console.error('[NotificationContext] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count only (lightweight poll alternative)
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch {
      // silently ignore
    }
  }, [user]);

  // Load on mount / user change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll unread count every 60 seconds while user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  const markOneRead = useCallback(async (id) => {
    try {
      await apiMarkOne(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] markOneRead error:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAll();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] markAllRead error:', err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markOneRead,
        markAllRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
