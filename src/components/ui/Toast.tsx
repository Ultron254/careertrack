import clsx from 'clsx';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import styles from './Toast.module.css';

interface ToastMessage {
  id: number;
  text: string;
  kind: 'default' | 'error';
}

const ToastContext = createContext<(text: string, kind?: 'default' | 'error') => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  const show = useCallback((text: string, kind: 'default' | 'error' = 'default') => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, text, kind }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={clsx(styles.toast, toast.kind === 'error' && styles.error)}>
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
