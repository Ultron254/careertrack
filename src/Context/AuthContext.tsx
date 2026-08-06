import { createContext, useContext, type ReactNode } from 'react';
import type { Role, User } from '@/Types/domain';
import { MockAuthProvider } from './MockAuth';

// Authentication is the backend's job. Once this frontend lives inside
// Laravel, the signed-in user arrives through Inertia's shared props and this
// context simply re-exposes it; until then the mock provider plays the part
// of the session Laravel would establish.
export interface AuthContextValue {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth called outside AuthProvider');
  return value;
}

// The role preview switcher lets a reviewer walk the app as each persona
// without signing in and out.
export interface RolePreviewValue {
  role: Role;
  setRole: (role: Role) => void;
}
export const RolePreviewContext = createContext<RolePreviewValue | null>(null);
export const useRolePreview = () => useContext(RolePreviewContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <MockAuthProvider>{children}</MockAuthProvider>;
}
