import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { currentUser, errorJson, latency } from './utils';

export const notificationHandlers = [
  http.get('/api/notifications', async ({ request }) => {
    await latency();
    const me = currentUser(request);
    const rows = db.notifications
      .filter((n) => n.userId === me.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(rows);
  }),

  http.post('/api/notifications/:id/read', async ({ params }) => {
    await latency();
    const row = db.notifications.find((n) => n.id === params.id);
    if (!row) return errorJson(404, 'not_found', 'That notification no longer exists.');
    const now = new Date().toISOString();
    row.readAt = now;
    row.updatedAt = now;
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/notifications/read-all', async ({ request }) => {
    await latency();
    const me = currentUser(request);
    const now = new Date().toISOString();
    for (const n of db.notifications) {
      if (n.userId === me.id && !n.readAt) {
        n.readAt = now;
        n.updatedAt = now;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
