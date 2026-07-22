import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/auth/authProvider';
import { ToastProvider } from '@/components/ui/Toast';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RefetchOnIdentityChange>
          <ToastProvider>{children}</ToastProvider>
        </RefetchOnIdentityChange>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Every query answers for the signed-in user, but the cache keys do not carry
// the identity. When the demo role switcher swaps persona (or a real sign in
// changes who we are), drop the previous user's cached data so views refetch
// against the new bearer token instead of showing stale results.
function RefetchOnIdentityChange({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastUserId = useRef(user?.id);

  useEffect(() => {
    if (lastUserId.current !== user?.id) {
      lastUserId.current = user?.id;
      queryClient.removeQueries();
    }
  }, [user?.id, queryClient]);

  return <>{children}</>;
}
