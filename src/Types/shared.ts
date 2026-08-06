import type { Notification, User } from './domain';

// The shape Inertia's shared props will take once Laravel provides them via
// the HandleInertiaRequests middleware. Until then the mock layer assembles
// the same object on the client so no page has to change when the swap
// happens — usePage().props already looks exactly like this.

export interface FlashMessages {
  success: string | null;
  error: string | null;
}

export interface AppConfig {
  name: string;
  // The active appraisal year, shown in banners and headings app-wide.
  year: number;
}

// Chrome-level state every screen needs: the bell menu, the manager's
// review-queue badge and the directory behind the command palette.
export interface NavProps {
  notifications: Notification[];
  pendingReviews: number;
  directory: User[];
}

export interface SharedProps {
  auth: {
    user: User | null;
  };
  flash: FlashMessages;
  app: AppConfig;
  nav: NavProps;
}
