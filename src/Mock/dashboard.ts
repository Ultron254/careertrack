import { differenceInCalendarDays } from 'date-fns';
import type { PageResolver } from '@/Lib/page';
import type { DashboardProps } from '@/Pages/dashboard/Dashboard';
import { activeCycle } from './fixtures/cycles';
import { dashboards } from './fixtures/dashboards';

// Mock counterpart of DashboardController@show: assemble the props the page
// receives. Every figure is precomputed server-side so the page just renders.

export const dashboardProps: PageResolver<DashboardProps> = ({ user }) => {
  const dashboard = dashboards[user.role];
  // Deadlines are Nairobi midnight; count whole calendar days to that instant.
  const daysLeft = Math.max(
    0,
    differenceInCalendarDays(new Date(activeCycle.closesAt), new Date()),
  );
  return {
    dashboard: { ...dashboard, banner: { ...dashboard.banner, daysLeft } },
  };
};
