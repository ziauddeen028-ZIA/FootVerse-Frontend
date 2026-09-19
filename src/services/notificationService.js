import api from './api.js';

/**
 * notificationService
 * All calls go through the shared api helper which automatically
 * attaches the Supabase Bearer token from the active session.
 */

/** Fetch the current user's notifications (max 50, newest first). */
export async function getMyNotifications() {
  return api.get('/notifications');
}

/** Fetch just the unread count. */
export async function getUnreadCount() {
  return api.get('/notifications/unread-count');
}

/** Mark a single notification as read. */
export async function markOneAsRead(id) {
  return api.put(`/notifications/${id}/read`, {});
}

/** Mark all notifications as read. */
export async function markAllAsRead() {
  return api.put('/notifications/read-all', {});
}
