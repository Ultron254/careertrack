import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
  );
}

// The two designs are different information architectures, not one layout at
// two widths; 900px is where the shell switches between them.
export const useIsDesktop = () => useMediaQuery('(min-width: 900px)');
