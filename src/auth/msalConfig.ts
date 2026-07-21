import type { Configuration } from '@azure/msal-browser';

// All values come from the Entra ID app registration; see .env.example.
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string | undefined;
const redirectUri = import.meta.env.VITE_ENTRA_REDIRECT_URI as string | undefined;

export const apiScopes: string[] = [import.meta.env.VITE_ENTRA_API_SCOPE ?? ''].filter(Boolean);

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId ?? '',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    redirectUri: redirectUri ?? window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export function assertMsalConfigured() {
  if (!tenantId || !clientId) {
    throw new Error(
      'VITE_AUTH_MODE is msal but VITE_ENTRA_TENANT_ID or VITE_ENTRA_CLIENT_ID is missing. ' +
        'Fill in the Entra ID values from .env.example or switch VITE_AUTH_MODE to mock.',
    );
  }
}
