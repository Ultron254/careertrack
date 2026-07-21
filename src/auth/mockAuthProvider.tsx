import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { setAccessTokenProvider } from '@/api/client';
import type { Role, User } from '@/types/domain';
import { AuthContext, RolePreviewContext, type AuthContextValue } from './authProvider';

// Development stand-in for Entra ID. No tenant required: the four personas
// below mirror the mock fixtures (same ids), and the issued token encodes the
// persona id so the mock API can answer role-aware requests the way the real
// backend will from a genuine bearer token.

const personas: Record<Role, User> = {
  employee: persona('u-amara', 'Amara Koech', 'amara.koech@oxygene.africa', 'employee', 'Account Manager', 'd-client-service', 'u-david'),
  manager: persona('u-david', 'David Otieno', 'david.otieno@oxygene.africa', 'manager', 'Client Service Director', 'd-client-service', 'u-james'),
  people_team: persona('u-wanjiru', 'Wanjiru Mwangi', 'wanjiru.mwangi@oxygene.africa', 'people_team', 'HR Business Partner', 'd-people', 'u-leila'),
  admin: persona('u-sam', 'Sam Ndlovu', 'sam.ndlovu@oxygene.africa', 'admin', 'Systems Administrator', null, null),
};

function persona(
  id: string,
  name: string,
  email: string,
  role: Role,
  jobTitle: string,
  departmentId: string | null,
  managerId: string | null,
): User {
  const joined = '2023-01-01T09:00:00+03:00';
  return { id, name, email, role, jobTitle, departmentId, managerId, avatarUrl: null, createdAt: joined, updatedAt: joined };
}

const AUTH_FLAG = 'careertrack.mock.signedIn';
const ROLE_KEY = 'careertrack.mock.role';

const storedRole = (): Role => {
  const value = sessionStorage.getItem(ROLE_KEY) as Role | null;
  return value && value in personas ? value : 'employee';
};

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(() => sessionStorage.getItem(AUTH_FLAG) === '1');
  const [role, setRoleState] = useState<Role>(storedRole);

  const user = personas[role];

  const setRole = useCallback((next: Role) => {
    sessionStorage.setItem(ROLE_KEY, next);
    setRoleState(next);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const getAccessToken = () => Promise.resolve(signedIn ? `mock-token-${user.id}` : null);
    // Registered during render, not in an effect: child components fire their
    // first queries in effects that run before a parent effect would.
    setAccessTokenProvider(getAccessToken);
    return {
      user: signedIn ? user : null,
      role,
      isAuthenticated: signedIn,
      isLoading: false,
      signIn: () => {
        sessionStorage.setItem(AUTH_FLAG, '1');
        setSignedIn(true);
        return Promise.resolve();
      },
      signOut: () => {
        sessionStorage.removeItem(AUTH_FLAG);
        setSignedIn(false);
        return Promise.resolve();
      },
      getAccessToken,
    };
  }, [role, signedIn, user]);

  const preview = useMemo(() => ({ role, setRole }), [role, setRole]);

  return (
    <AuthContext.Provider value={value}>
      <RolePreviewContext.Provider value={preview}>{children}</RolePreviewContext.Provider>
    </AuthContext.Provider>
  );
}
