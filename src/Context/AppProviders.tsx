import type { ReactNode } from 'react';
import { ToastProvider } from '@/Components/ui/Toast';
import { AuthProvider } from '@/Context/AuthContext';
import { SharedPropsProvider } from '@/Context/SharedPropsContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SharedPropsProvider>
        <ToastProvider>{children}</ToastProvider>
      </SharedPropsProvider>
    </AuthProvider>
  );
}
