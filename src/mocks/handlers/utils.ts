import { delay, HttpResponse } from 'msw';
import { userById, users } from '../fixtures/users';

// The mock auth provider issues tokens shaped mock-token-<userId>. Reading the
// user from the Authorization header keeps the mock API role aware the same
// way the real backend will be, and keeps components oblivious.
export function currentUser(request: Request) {
  const auth = request.headers.get('Authorization') ?? '';
  const id = auth.replace('Bearer mock-token-', '');
  return userById(id) ?? users[0];
}

// Enough lag to make skeleton states visible without feeling broken.
export const latency = () => delay(180 + Math.random() * 240);

export const errorJson = (status: number, code: string, message: string) =>
  HttpResponse.json({ code, message }, { status });
