import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { NotificationsScreenProps } from '@/Pages/notifications/NotificationsScreen';
import { db } from './store';

// Mock counterpart of NotificationController@index: the signed-in user's
// notifications, newest first — read and unread together, the page splits them.
export const notificationsProps: PageResolver<NotificationsScreenProps> = ({ user }) => ({
  notifications: db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
});

// Marking a single notification read. Idempotent on purpose: re-marking a
// read row just refreshes its timestamp, which is harmless.
registerAction('post', '/notifications/:id/read', ({ params }) => {
  const row = db.notifications.find((n) => n.id === params.id);
  if (!row) return { errors: { notification: 'That notification no longer exists.' } };
  const now = new Date().toISOString();
  row.readAt = now;
  row.updatedAt = now;
});

// Clears the whole unread pile in one sweep, only for the caller's rows.
registerAction('post', '/notifications/read-all', ({ user }) => {
  const now = new Date().toISOString();
  for (const n of db.notifications) {
    if (n.userId === user.id && !n.readAt) {
      n.readAt = now;
      n.updatedAt = now;
    }
  }
});
