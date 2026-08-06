import { useCallback, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AUTH_FLAG, ROLE_KEY, personaFor, storedRole } from '@/Mock/session';
import { storeVersion, subscribe } from '@/Mock/store';
import type { Role } from '@/Types/domain';
import { AuthContext, RolePreviewContext, type AuthContextValue } from './AuthContext';

// Development stand-in for the company sign-in. No backend required: the
// four personas mirror the seeded users, and the demo role switcher swaps
// between them so every audience can be previewed. Laravel's session guard
// takes over this job wholesale — the rest of the app only ever reads
// auth.user from shared props.

export function MockAuthProvider({ children }: { children: ReactNode }) {
  // personaFor reads the mutable mock store, which the React Compiler cannot
  // see through — skip memoization so profile edits reach the persona.
  'use no memo';
  const [signedIn, setSignedIn] = useState(() => sessionStorage.getItem(AUTH_FLAG) === '1');
  const [role, setRoleState] = useState<Role>(storedRole);

  // The persona is looked up in the live store so profile edits made in
  // Settings show up in the avatar menu immediately.
  useSyncExternalStore(subscribe, storeVersion);
  const user = personaFor(role);

  const setRole = useCallback((next: Role) => {
    sessionStorage.setItem(ROLE_KEY, next);
    setRoleState(next);
  }, []);

  const value: AuthContextValue = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      <RolePreviewContext.Provider value={{ role, setRole }}>
        {children}
      </RolePreviewContext.Provider>
    </AuthContext.Provider>
  );
}
