import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
} from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { request, setAccessTokenProvider } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { userSchema } from '@/api/schemas/user';
import type { Role, User } from '@/types/domain';
import { MockAuthProvider } from './mockAuthProvider';
import { apiScopes, assertMsalConfigured, msalConfig } from './msalConfig';
import { roleFromClaims } from './roles';

export interface AuthContextValue {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth called outside AuthProvider');
  return value;
}

// The role preview switcher only exists in mock mode; everywhere else this
// context stays null and the preview bar renders nothing.
export interface RolePreviewValue {
  role: Role;
  setRole: (role: Role) => void;
}
export const RolePreviewContext = createContext<RolePreviewValue | null>(null);
export const useRolePreview = () => useContext(RolePreviewContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  if (import.meta.env.VITE_AUTH_MODE === 'msal') {
    return <EntraAuthProvider>{children}</EntraAuthProvider>;
  }
  return <MockAuthProvider>{children}</MockAuthProvider>;
}

let pca: PublicClientApplication | null = null;
function getPca() {
  if (!pca) {
    assertMsalConfigured();
    pca = new PublicClientApplication(msalConfig);
  }
  return pca;
}

function EntraAuthProvider({ children }: { children: ReactNode }) {
  return (
    <MsalProvider instance={getPca()}>
      <EntraAuthState>{children}</EntraAuthState>
    </MsalProvider>
  );
}

function EntraAuthState({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const account: AccountInfo | undefined = accounts[0];
  const [profile, setProfile] = useState<User | null>(null);

  const role = roleFromClaims(account?.idTokenClaims);

  const value = useMemo<AuthContextValue>(() => {
    const getAccessToken = async () => {
      if (!account) return null;
      try {
        const result = await instance.acquireTokenSilent({ scopes: apiScopes, account });
        return result.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          await instance.acquireTokenRedirect({ scopes: apiScopes });
        }
        return null;
      }
    };

    // Registered during render so the first child queries already carry it.
    setAccessTokenProvider(getAccessToken);

    return {
      user: profile,
      role,
      isAuthenticated: !!account,
      isLoading: inProgress !== 'none',
      signIn: () => instance.loginRedirect({ scopes: apiScopes }),
      signOut: () => instance.logoutRedirect(),
      getAccessToken,
    };
  }, [account, instance, inProgress, profile, role]);

  // The token only carries name and role; the full profile (department,
  // manager, avatar) is the backend's job.
  useEffect(() => {
    if (!account) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    request(userSchema, endpoints.me())
      .then((user) => {
        if (!cancelled) setProfile(user);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [account]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
