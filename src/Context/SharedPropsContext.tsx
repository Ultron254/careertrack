import { createContext, useContext, type ReactNode } from 'react';
import { currentFlash, onFlash } from '@/Lib/router';
import { cycles } from '@/Mock/fixtures/cycles';
import { navFor } from '@/Mock/shared';
import { storeVersion, subscribe } from '@/Mock/store';
import type { SharedProps } from '@/Types/shared';
import { useAuth } from './AuthContext';
import { useSyncExternalStore } from 'react';

// The client half of Laravel's HandleInertiaRequests middleware: every page
// can reach { auth, flash, app } through usePage().props without asking for
// them. When Inertia lands, usePage comes from '@inertiajs/react' and this
// file disappears — the property paths stay identical.

const SharedPropsContext = createContext<SharedProps | null>(null);

// The year in headings and banners follows the cycle currently accepting
// activity, falling back to the newest cycle once everything is closed.
const activeYear =
  cycles.find((cycle) => cycle.state === 'open' || cycle.state === 'closing')?.year ??
  Math.max(...cycles.map((cycle) => cycle.year));

export function SharedPropsProvider({ children }: { children: ReactNode }) {
  // navFor reads the mutable mock store, which the React Compiler cannot
  // see through — skip memoization so every commit rebuilds the nav slice.
  'use no memo';
  const { user } = useAuth();
  const flash = useSyncExternalStore(onFlash, currentFlash);
  // Re-assemble the nav slice whenever an action commits, the way a fresh
  // Inertia response would carry updated shared props.
  useSyncExternalStore(subscribe, storeVersion);

  const value: SharedProps = {
    auth: { user },
    flash,
    app: { name: 'CareerTrack', year: activeYear },
    // A snapshot, not the store's own objects — fresh identities on every
    // commit are what tell memoised components something changed.
    nav: structuredClone(navFor(user)),
  };

  return <SharedPropsContext.Provider value={value}>{children}</SharedPropsContext.Provider>;
}

export function usePage(): { props: SharedProps } {
  const props = useContext(SharedPropsContext);
  if (!props) throw new Error('usePage must be used inside SharedPropsProvider');
  return { props };
}
