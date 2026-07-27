import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep long-lived vendor code in its own cached chunks so app
        // updates only invalidate the small chunks that actually changed.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@azure/msal')) return 'vendor-auth';
          if (id.includes('msw') || id.includes('@mswjs')) return 'vendor-mocks';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('react-router')) return 'vendor-router';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
});
