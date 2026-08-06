import { Suspense, lazy, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ShellLayout } from '@/Layouts/ShellLayout';
import { ViewSkeleton } from '@/Components/ui/Skeleton';
import { AccessGuard } from './AccessGuard';
import { bindNavigator } from './router';
import { usePageProps, type PageResolver } from './page';
import { NotFoundScreen } from '@/Pages/Errors/NotFoundScreen';

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

// Route-to-page wiring in the Inertia style: the page component is pure and
// typed, and its props come from a resolver loaded alongside it. This table
// is the only place that knows about both — pages never import the router.
function lazyPage<P extends object>(
  loader: () => Promise<{ component: ComponentType<P>; resolve: PageResolver<P> }>,
) {
  return lazyView(() =>
    loader().then(({ component: Component, resolve }) => ({
      default: function Page() {
        const props = usePageProps(resolve);
        return <Component {...props} />;
      },
    })),
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
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/dashboard'),
                import('@/Mock/dashboard'),
              ]);
              return { component: page.Dashboard, resolve: mock.dashboardProps };
            }),
          },
          {
            path: 'goals',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/goals'),
                import('@/Mock/goals'),
              ]);
              return { component: page.MyGoals, resolve: mock.myGoalsProps };
            }),
          },
          {
            path: 'goals/setup',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/goals'),
                import('@/Mock/goals'),
              ]);
              return { component: page.GoalSetup, resolve: mock.goalSetupProps };
            }),
          },
          {
            path: 'reviews',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/reviews'),
                import('@/Mock/reviews'),
              ]);
              return { component: page.ManagerReview, resolve: mock.managerReviewProps };
            }),
          },
          {
            path: 'feedback',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/feedback'),
                import('@/Mock/feedback'),
              ]);
              return { component: page.PeerFeedback, resolve: mock.feedbackProps };
            }),
          },
          {
            path: 'appraisals',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/appraisals'),
                import('@/Mock/appraisals'),
              ]);
              return { component: page.Appraisal, resolve: mock.appraisalProps };
            }),
          },
          {
            path: 'reports',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/reports'),
                import('@/Mock/reports'),
              ]);
              return { component: page.Reports, resolve: mock.reportsProps };
            }),
          },
          {
            path: 'calendar',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/calendar'),
                import('@/Mock/calendar'),
              ]);
              return { component: page.Calendar, resolve: mock.calendarProps };
            }),
          },
          {
            path: 'people',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/people'),
                import('@/Mock/people'),
              ]);
              return { component: page.People, resolve: mock.peopleProps };
            }),
          },
          {
            path: 'people/:userId',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/people'),
                import('@/Mock/people'),
              ]);
              return { component: page.EmployeeProfile, resolve: mock.employeeProfileProps };
            }),
          },
          {
            path: 'accounts',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/admin'),
                import('@/Mock/admin'),
              ]);
              return { component: page.UserManagement, resolve: mock.userManagementProps };
            }),
          },
          {
            path: 'audit',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/admin'),
                import('@/Mock/admin'),
              ]);
              return { component: page.AuditLog, resolve: mock.auditLogProps };
            }),
          },
          {
            path: 'settings',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/settings'),
                import('@/Mock/settings'),
              ]);
              return { component: page.Settings, resolve: mock.settingsProps };
            }),
          },
          {
            path: 'notifications',
            element: lazyPage(async () => {
              const [page, mock] = await Promise.all([
                import('@/Pages/notifications'),
                import('@/Mock/notifications'),
              ]);
              return { component: page.NotificationsScreen, resolve: mock.notificationsProps };
            }),
          },
        ],
      },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]);

// GET navigation triggered through the Inertia-style router (router.visit)
// funnels into React Router here rather than pages importing it directly.
bindNavigator((to) => void router.navigate(to));
