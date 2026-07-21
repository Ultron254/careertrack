import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { currentUser, latency } from './utils';

export const notificationHandlers = [
  http.get('/api/notifications', async ({ request }) => {
    await latency();
    const me = currentUser(request);
    const rows = db.notifications
      .filter((n) => n.userId === me.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(rows);
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
