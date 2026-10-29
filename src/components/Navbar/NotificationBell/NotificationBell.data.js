// NotificationBell'in veri erişim katmanı — bildirimler ve takip isteği kararı.
// Sözleşme: GET /api/me/notifications, /unread-count, POST /{id}/read,
// /read-all; istek kararı POST/DELETE /api/me/follow-requests/{username}.
import { getStoredAuth } from '../../../shared/api/authStorage';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  acceptFollowRequest,
  rejectFollowRequest,
} from '../../../shared/api/account';

export { getMyNotifications, markNotificationRead, markAllNotificationsRead, acceptFollowRequest, rejectFollowRequest };

export function hasSession() {
  return Boolean(getStoredAuth()?.token);
}

export async function getUnreadCount() {
  const res = await getUnreadNotificationCount();
  return res.unreadCount;
}
