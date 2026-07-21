import { differenceInCalendarDays } from 'date-fns';
import { http, HttpResponse } from 'msw';
import { reportScheduleSchema } from '@/api/schemas/report';
import { db } from '../db';
import { activeCycle } from '../fixtures/cycles';
import { dashboards } from '../fixtures/dashboards';
import { reports } from '../fixtures/reports';
import { currentUser, errorJson, latency } from './utils';

export const insightHandlers = [
  http.get('/api/dashboard', async ({ request }) => {
    await latency();
    const role = currentUser(request).role;
    const dashboard = dashboards[role];
    const daysLeft = Math.max(0, differenceInCalendarDays(new Date(activeCycle.closesAt), new Date()));
    return HttpResponse.json({
      ...dashboard,
      banner: { ...dashboard.banner, daysLeft },
    });
  }),

  http.get('/api/reports', async ({ request }) => {
    await latency();
    return HttpResponse.json(reports[currentUser(request).role]);
  }),

  http.post('/api/reports/export', async ({ request }) => {
    await latency();
    await latency();
    const { format } = (await request.json()) as { format?: string };
    if (format !== 'pdf' && format !== 'xlsx') {
      // Deliberate stub gap so the export error state stays reachable.
      return errorJson(501, 'format_not_available', 'Only PDF and Excel exports exist so far.');
    }
    return HttpResponse.json({ status: 'ready', format, url: null });
  }),

  http.get('/api/reports/schedule', async () => {
    await latency();
    return HttpResponse.json(db.reportSchedule);
  }),

  http.put('/api/reports/schedule', async ({ request }) => {
    await latency();
    const body = reportScheduleSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_schedule', body.error.issues[0].message);
    db.reportSchedule = body.data;
    return HttpResponse.json(db.reportSchedule);
  }),
];
