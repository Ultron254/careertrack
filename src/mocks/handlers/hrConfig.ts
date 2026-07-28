import { http, HttpResponse } from 'msw';
import { hrConfigSchema } from '@/api/schemas/hrConfig';
import { db } from '../db';
import { recordAudit } from './admin';
import { currentUser, errorJson, latency } from './utils';

export const hrConfigHandlers = [
  http.get('/api/hr-config', async () => {
    await latency();
    return HttpResponse.json(db.hrConfig);
  }),

  http.put('/api/hr-config', async ({ request }) => {
    await latency();
    const user = currentUser(request);
    if (user.role !== 'people_team' && user.role !== 'admin') {
      return errorJson(403, 'forbidden', 'Only the People Team or an admin can change configuration.');
    }
    const body = hrConfigSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_config', body.error.issues[0].message);
    const lockedOff = body.data.reviewStages.some(
      (s) => (s.stage === 'self' || s.stage === 'manager') && !s.enabled,
    );
    if (lockedOff) {
      return errorJson(422, 'stage_locked', 'Self and manager stages cannot be disabled.');
    }
    db.hrConfig = body.data;
    recordAudit(user, 'config_updated', 'Updated the performance cycle configuration');
    return HttpResponse.json(db.hrConfig);
  }),
];
