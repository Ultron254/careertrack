import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';

async function boot() {
  // The worker must be running before the first query fires, otherwise the
  // initial requests race past the mock layer and fail.
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    try {
      const { enableMocks } = await import('./mocks/browser');
      // If registration wedges (a stale worker from a previous deploy can do
      // this), give up after a few seconds and render anyway — the ErrorState
      // retry path recovers once the worker settles, which beats an
      // indefinitely blank screen.
      await Promise.race([
        enableMocks(),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch (error) {
      console.error('Mock worker failed to start; continuing without it.', error);
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
