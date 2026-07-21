import { createBrowserRouter } from 'react-router-dom';
import { ShellLayout } from '@/components/layout/ShellLayout';
import { Dashboard } from '@/features/dashboard';
import { MyGoals, GoalSetup } from '@/features/goals';
import { ManagerReview } from '@/features/reviews';
import { PeerFeedback } from '@/features/feedback';
import { Appraisal } from '@/features/appraisals';
import { Reports } from '@/features/reports';
import { Calendar } from '@/features/calendar';
import { People, EmployeeProfile } from '@/features/people';
import { Settings } from '@/features/settings';
import { NotificationsScreen } from '@/features/notifications';
import { AccessGuard } from './AccessGuard';
import { NotFoundScreen } from './NotFoundScreen';

export const router = createBrowserRouter([
  {
    element: <ShellLayout />,
    children: [
      {
        element: <AccessGuard />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'goals', element: <MyGoals /> },
          { path: 'goals/setup', element: <GoalSetup /> },
          { path: 'reviews', element: <ManagerReview /> },
          { path: 'feedback', element: <PeerFeedback /> },
          { path: 'appraisals', element: <Appraisal /> },
          { path: 'reports', element: <Reports /> },
          { path: 'calendar', element: <Calendar /> },
          { path: 'people', element: <People /> },
          { path: 'people/:userId', element: <EmployeeProfile /> },
          { path: 'settings', element: <Settings /> },
          { path: 'notifications', element: <NotificationsScreen /> },
        ],
      },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]);
