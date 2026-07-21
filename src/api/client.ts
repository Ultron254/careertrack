import type { z } from 'zod';

// The only file that calls fetch. Components go through the query hooks in
// src/api/queries, which all funnel into request() below.

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Origin of the backend. Empty string means same origin, which is what the
// mock worker intercepts in development.
const baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? '';

type TokenProvider = () => Promise<string | null>;

let getAccessToken: TokenProvider = () => Promise.resolve(null);

// Called once by the auth provider on mount. Keeps the client free of any
// dependency on MSAL or React context.
export function setAccessTokenProvider(provider: TokenProvider) {
  getAccessToken = provider;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function request<T>(
  schema: z.ZodType<T>,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(baseUrl + path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'Could not reach the server. Check your connection and retry.');
  }

  if (!response.ok) {
    let code = 'http_error';
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as { code?: string; message?: string };
      if (body.code) code = body.code;
      if (body.message) message = body.message;
    } catch {
      // Non JSON error body; the defaults above already describe the failure.
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path.join('.') || 'response root';
    throw new ApiError(
      response.status,
      'invalid_response',
      `Response from ${path} does not match the contract at ${where}: ${issue.message}`,
    );
  }
  return parsed.data;
}
