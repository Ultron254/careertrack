import { useSyncExternalStore } from 'react';

// Mobile write actions disable themselves when the connection drops. Reads the
// browser's own online flag, so it reflects real connectivity, not a guess.
export function useOnlineStatus() {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener('online', notify);
      window.addEventListener('offline', notify);
      return () => {
        window.removeEventListener('online', notify);
        window.removeEventListener('offline', notify);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
