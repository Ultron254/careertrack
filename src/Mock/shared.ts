import type { User } from '@/Types/domain';
import type { NavProps } from '@/Types/shared';
// The bell menu can mark notifications read from any screen, so those
// actions ride along with the shared props.
import './notifications';
import { queueUserIds } from './reviews';
import { db } from './store';

// Mock counterpart of HandleInertiaRequests::share(): the chrome-level state
// the middleware attaches to every response so the shell never has to ask.
export function navFor(user: User | null): NavProps {
  if (!user) return { notifications: [], pendingReviews: 0, directory: [] };
  return {
    notifications: db.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    pendingReviews: user.role === 'manager' ? queueUserIds.length : 0,
    directory: db.users,
  };
}
