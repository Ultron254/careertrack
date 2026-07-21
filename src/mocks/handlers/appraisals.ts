import { http, HttpResponse } from 'msw';
import { appraisalDraftSchema } from '@/api/schemas/appraisal';
import type { Appraisal } from '@/types/domain';
import { db, nextId } from '../db';
import { yearEvaluations } from '../fixtures/evaluations';
import { currentUser, errorJson, latency } from './utils';

function findOrCreate(cycleId: string, subjectId: string): Appraisal {
  let appraisal = db.appraisals.find((a) => a.cycleId === cycleId && a.subjectId === subjectId);
  if (!appraisal) {
    const now = new Date().toISOString();
    appraisal = {
      id: nextId('ap'),
      cycleId,
      subjectId,
      stage: 'self',
      perGoalRatings: {},
      perGoalComments: {},
      overallRating: null,
      overallComment: '',
      growthAreas: [],
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    db.appraisals.push(appraisal);
  }
  return appraisal;
}

const subjectFor = (request: Request) =>
  new URL(request.url).searchParams.get('subjectId') ?? currentUser(request).id;

export const appraisalHandlers = [
  http.get('/api/cycles/:cycleId/appraisal', async ({ request, params }) => {
    await latency();
    return HttpResponse.json(findOrCreate(params.cycleId as string, subjectFor(request)));
  }),

  http.put('/api/cycles/:cycleId/appraisal', async ({ request, params }) => {
    await latency();
    const body = appraisalDraftSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_appraisal', body.error.issues[0].message);
    const appraisal = findOrCreate(params.cycleId as string, subjectFor(request));
    if (appraisal.submittedAt) {
      return errorJson(409, 'appraisal_submitted', 'A submitted appraisal can no longer change.');
    }
    Object.assign(appraisal, body.data, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(appraisal);
  }),

  http.post('/api/cycles/:cycleId/appraisal/submit', async ({ request, params }) => {
    await latency();
    const appraisal = findOrCreate(params.cycleId as string, subjectFor(request));
    if (appraisal.overallRating === null) {
      return errorJson(422, 'overall_rating_required', 'Set an overall rating before submitting.');
    }
    const now = new Date().toISOString();
    appraisal.submittedAt = now;
    appraisal.updatedAt = now;
    return HttpResponse.json(appraisal);
  }),

  http.get('/api/evaluations/:year', async ({ params }) => {
    // The evaluation is generated on request, so it takes noticeably longer.
    await latency();
    await latency();
    const evaluation = yearEvaluations.find((e) => e.year === Number(params.year));
    if (!evaluation) {
      return errorJson(404, 'no_evaluation', 'No evaluation exists for that year yet.');
    }
    return HttpResponse.json(evaluation);
  }),
];
