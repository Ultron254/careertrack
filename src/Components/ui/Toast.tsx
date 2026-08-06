import clsx from 'clsx';
import { useEffect, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { currentFlash, onFlash } from '@/Lib/router';
import styles from './Toast.module.css';

// Sonner handles queueing, timing and screen-reader announcements; the pill
// itself keeps our own styling so nothing shifts visually.

export const useToast = () => show;

function show(text: string, kind: 'default' | 'error' = 'default') {
  toast.custom(
    () => <div className={clsx(styles.toast, kind === 'error' && styles.error)}>{text}</div>,
    { duration: 4000 },
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  // Controller flash messages surface here, exactly as they will when they
  // arrive through Inertia's shared props instead of the mock router.
  useEffect(
    () =>
      onFlash(() => {
        const flash = currentFlash();
        if (flash.success) show(flash.success);
        if (flash.error) show(flash.error, 'error');
      }),
    [],
  );

  return (
    <>
      {children}
      <Toaster position="bottom-center" gap={8} toastOptions={{ unstyled: true }} />
    </>
  );
}
