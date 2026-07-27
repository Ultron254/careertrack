import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function enableMocks() {
  // After a fresh deploy the browser can hold a service worker registration
  // from the previous build. Nudging an update check here means a stale
  // worker never sits between the new bundle and its data.
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) await registration.update().catch(() => undefined);
  }

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
