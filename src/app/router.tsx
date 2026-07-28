import { Suspense, lazy, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ShellLayout } from '@/components/layout/ShellLayout';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { AccessGuard } from './AccessGuard';
import { NotFoundScreen } from './NotFoundScreen';

// Each screen ships as its own chunk so the first paint only downloads the
// shell plus the page being visited. The skeleton keeps the layout steady
// while a chunk streams in.
function lazyView(loader: () => Promise<{ default: ComponentType }>) {
  const View = lazy(loader);
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <View />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <ShellLayout />,
    children: [
      {
        element: <AccessGuard />,
        children: [
          {
            index: true,
            element: lazyView(() =>
              import('@/features/dashboard').then((m) => ({ default: m.Dashboard })),
            ),
          },
          {
            path: 'goals',
            element: lazyView(() =>
              import('@/features/goals').then((m) => ({ default: m.MyGoals })),
            ),
          },
          {
            path: 'goals/setup',
            element: lazyView(() =>
              import('@/features/goals').then((m) => ({ default: m.GoalSetup })),
            ),
          },
          {
            path: 'reviews',
            element: lazyView(() =>
              import('@/features/reviews').then((m) => ({ default: m.ManagerReview })),
            ),
          },
          {
            path: 'feedback',
            element: lazyView(() =>
              import('@/features/feedback').then((m) => ({ default: m.PeerFeedback })),
            ),
          },
          {
            path: 'appraisals',
            element: lazyView(() =>
              import('@/features/appraisals').then((m) => ({ default: m.Appraisal })),
            ),
          },
          {
            path: 'reports',
            element: lazyView(() =>
              import('@/features/reports').then((m) => ({ default: m.Reports })),
            ),
          },
          {
            path: 'calendar',
            element: lazyView(() =>
              import('@/features/calendar').then((m) => ({ default: m.Calendar })),
            ),
          },
          {
            path: 'people',
            element: lazyView(() =>
              import('@/features/people').then((m) => ({ default: m.People })),
            ),
          },
          {
            path: 'people/:userId',
            element: lazyView(() =>
              import('@/features/people').then((m) => ({ default: m.EmployeeProfile })),
            ),
          },
          {
            path: 'accounts',
            element: lazyView(() =>
              import('@/features/admin').then((m) => ({ default: m.UserManagement })),
            ),
          },
          {
            path: 'audit',
            element: lazyView(() =>
              import('@/features/admin').then((m) => ({ default: m.AuditLog })),
            ),
          },
          {
            path: 'settings',
            element: lazyView(() =>
              import('@/features/settings').then((m) => ({ default: m.Settings })),
            ),
          },
          {
            path: 'notifications',
            element: lazyView(() =>
              import('@/features/notifications').then((m) => ({ default: m.NotificationsScreen })),
            ),
          },
        ],
      },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]);
