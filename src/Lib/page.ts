import { useSyncExternalStore } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePage } from '@/Context/SharedPropsContext';
import { storeVersion, subscribe } from '@/Mock/store';
import type { User } from '@/Types/domain';

// The bridge between a route and a page. Each page declares the props it
// wants; a resolver (the mock counterpart of a Laravel controller) builds
// them from the store. Once Inertia serves real pages this file and the
// resolvers go away — the page components already receive plain props.

export interface PageContext {
  // Route access is guarded upstream, so resolvers always have a user.
  user: User;
  params: Record<string, string | undefined>;
  query: URLSearchParams;
}

export type PageResolver<P> = (ctx: PageContext) => P;

export function usePageProps<P>(resolve: PageResolver<P>): P {
  // The resolver reads the mutable mock store, which the React Compiler
  // cannot see through — skip memoization so every commit re-resolves.
  'use no memo';
  const { props: shared } = usePage();
  const params = useParams();
  const [query] = useSearchParams();
  // Re-resolve after every store commit, the way an Inertia redirect back
  // delivers a fresh props payload.
  useSyncExternalStore(subscribe, storeVersion);
  const user = shared.auth.user;
  if (!user) throw new Error('Page rendered without an authenticated user');
  // Pages get a snapshot, not the store's own objects — the same separation a
  // JSON response enforces. Every commit therefore hands the page a payload
  // with fresh identities, which is also what memoised components diff on.
  return structuredClone(resolve({ user, params, query }));
}
