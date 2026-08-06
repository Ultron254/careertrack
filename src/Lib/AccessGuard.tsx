import { matchPath, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/Context/AuthContext';
import { routeAccess } from '@/Constants/navigation';
import { ForbiddenScreen } from '@/Pages/Errors/ForbiddenScreen';

// Access derives entirely from the routeAccess map. A role that cannot reach a
// route gets the 403 screen, never a blank page. Adding a role is one map entry.
export function AccessGuard() {
  const { role } = useAuth();
  const location = useLocation();

  const allowed = routeAccess[role].some((pattern) =>
    matchPath({ path: pattern, end: true }, location.pathname),
  );

  return allowed ? <Outlet /> : <ForbiddenScreen />;
}
