import { http, HttpResponse } from 'msw';
import { calendarEventBodySchema } from '@/api/schemas/calendarEvent';
import { db, nextId } from '../db';
import { errorJson, latency } from './utils';

export const calendarHandlers = [
  http.get('/api/calendar/events', async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const rows = db.calendarEvents.filter((e) => {
      if (from && e.startsAt < from) return false;
      if (to && e.startsAt > to) return false;
      return true;
    });
    return HttpResponse.json(rows);
  }),

  http.post('/api/calendar/events', async ({ request }) => {
    await latency();
    const body = calendarEventBodySchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_event', body.error.issues[0].message);
    const now = new Date().toISOString();
    const event = { ...body.data, id: nextId('ev'), createdAt: now, updatedAt: now };
    db.calendarEvents.push(event);
    return HttpResponse.json(event, { status: 201 });
  }),
];
