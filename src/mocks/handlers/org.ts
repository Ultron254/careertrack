import { http, HttpResponse } from 'msw';
import { departments } from '../fixtures/departments';
import { directory } from '../fixtures/directory';
import { userById, users } from '../fixtures/users';
import { currentUser, errorJson, latency } from './utils';

export const orgHandlers = [
  http.get('/api/me', async ({ request }) => {
    await latency();
    return HttpResponse.json(currentUser(request));
  }),

  http.get('/api/users', async () => {
    await latency();
    return HttpResponse.json(users);
  }),

  http.get('/api/users/:userId', async ({ params }) => {
    await latency();
    const user = userById(params.userId as string);
    if (!user) return errorJson(404, 'user_not_found', 'No user with that id.');
    return HttpResponse.json(user);
  }),

  http.get('/api/departments', async () => {
    await latency();
    return HttpResponse.json(departments);
  }),

  http.get('/api/directory', async () => {
    await latency();
    return HttpResponse.json(directory);
  }),
];
