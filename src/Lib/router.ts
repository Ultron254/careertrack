// A client-side stand-in for Inertia's router. Pages and forms call
// router.post/put/patch/delete with the same URLs and options they will use
// against Laravel; here the requests are answered by the action handlers the
// Mock modules register, followed by a commit() that refreshes page props.
// Swapping this file for `import { router } from '@inertiajs/react'` is the
// whole integration story on the client.

import { commit } from '@/Mock/store';
import { currentUser } from '@/Mock/session';
import type { User } from '@/Types/domain';

export type Method = 'post' | 'put' | 'patch' | 'delete';
export type RequestBody = Record<string, unknown>;

export interface ActionResult {
  // Laravel validation errors, already flattened to one message per field —
  // the shape Inertia hands to useForm after a 422 redirect back.
  errors?: Record<string, string | undefined>;
  flash?: { success?: string; error?: string };
}

export interface ActionContext {
  // The signed-in user, the way a controller reads $request->user().
  user: User;
  params: Record<string, string>;
  body: RequestBody;
}

export type ActionHandler = (ctx: ActionContext) => ActionResult | void;

export interface VisitOptions {
  onSuccess?: () => void;
  onError?: (errors: Record<string, string | undefined>) => void;
  onFinish?: () => void;
  preserveScroll?: boolean;
}

// -- Action registry ---------------------------------------------------------
// The mock counterpart of routes/web.php. Patterns use ':param' segments the
// same way the Laravel routes will, so URLs in pages are already correct.

const actions: { method: Method; segments: string[]; handler: ActionHandler }[] = [];

export function registerAction(method: Method, pattern: string, handler: ActionHandler) {
  actions.push({ method, segments: pattern.split('/').filter(Boolean), handler });
}

function match(method: Method, url: string) {
  const path = url.split('?')[0].split('/').filter(Boolean);
  outer: for (const action of actions) {
    if (action.method !== method || action.segments.length !== path.length) continue;
    const params: Record<string, string> = {};
    for (let i = 0; i < action.segments.length; i++) {
      const segment = action.segments[i];
      if (segment.startsWith(':')) params[segment.slice(1)] = decodeURIComponent(path[i]);
      else if (segment !== path[i]) continue outer;
    }
    return { handler: action.handler, params };
  }
  return null;
}

// -- Flash -------------------------------------------------------------------
// Handlers can flash a message the way a controller does; the shared-props
// provider surfaces it and the toaster shows it.

import type { FlashMessages } from '@/Types/shared';

let flash: FlashMessages = { success: null, error: null };
const flashListeners = new Set<() => void>();

export const currentFlash = () => flash;

export function onFlash(listener: () => void) {
  flashListeners.add(listener);
  return () => {
    flashListeners.delete(listener);
  };
}

function setFlash(next: { success?: string; error?: string }) {
  flash = { success: next.success ?? null, error: next.error ?? null };
  for (const listener of flashListeners) listener();
}

// -- Navigation --------------------------------------------------------------
// GET visits go through React Router today. The binding is injected from the
// route table so this module stays free of routing imports.

let navigate: (to: string) => void = () => {
  throw new Error('router.visit called before the navigator was bound');
};

export function bindNavigator(fn: (to: string) => void) {
  navigate = fn;
}

// A short pause keeps submit buttons honest about their processing state,
// like a fast network would. Tests skip it.
const settle = () =>
  new Promise<void>((resolve) => {
    if (import.meta.env.MODE === 'test') resolve();
    else setTimeout(resolve, 150);
  });

async function dispatch(method: Method, url: string, body: RequestBody, options: VisitOptions) {
  await settle();
  const found = match(method, url);
  if (!found) {
    throw new Error(`No action handles ${method.toUpperCase()} ${url}`);
  }
  const user = currentUser();
  if (!user) throw new Error('Actions require a signed-in user');
  const result = found.handler({ user, params: found.params, body }) ?? {};
  if (result.errors && Object.keys(result.errors).length > 0) {
    options.onError?.(result.errors);
  } else {
    // Mirrors the redirect-back after a successful write: the store bumps its
    // version and every mounted page resolves fresh props.
    commit();
    if (result.flash) setFlash(result.flash);
    options.onSuccess?.();
  }
  options.onFinish?.();
}

export const router = {
  visit: (url: string) => navigate(url),
  get: (url: string) => navigate(url),
  reload: () => commit(),
  post: (url: string, body: RequestBody = {}, options: VisitOptions = {}) =>
    dispatch('post', url, body, options),
  put: (url: string, body: RequestBody = {}, options: VisitOptions = {}) =>
    dispatch('put', url, body, options),
  patch: (url: string, body: RequestBody = {}, options: VisitOptions = {}) =>
    dispatch('patch', url, body, options),
  delete: (url: string, options: VisitOptions = {}) => dispatch('delete', url, {}, options),
};
