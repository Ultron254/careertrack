import { http, HttpResponse } from 'msw';
import { goalDraftSchema, goalUpdateSchema } from '@/api/schemas/goal';
import type { Goal } from '@/types/domain';
import { db, nextId } from '../db';
import { cycles } from '../fixtures/cycles';
import { currentUser, errorJson, latency } from './utils';

export const goalHandlers = [
  http.get('/api/cycles', async () => {
    await latency();
    return HttpResponse.json(cycles);
  }),

  http.get('/api/cycles/:cycleId/goals', async ({ request, params }) => {
    await latency();
    const ownerId =
      new URL(request.url).searchParams.get('ownerId') ?? currentUser(request).id;
    const rows = db.goals.filter((g) => g.cycleId === params.cycleId && g.ownerId === ownerId);
    return HttpResponse.json(rows);
  }),

  http.post('/api/cycles/:cycleId/goals', async ({ request, params }) => {
    await latency();
    const body = goalDraftSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_goal', body.error.issues[0].message);
    const now = new Date().toISOString();
    const goal: Goal = {
      ...body.data,
      id: nextId('g'),
      cycleId: params.cycleId as string,
      ownerId: currentUser(request).id,
      status: 'Draft',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.goals.push(goal);
    return HttpResponse.json(goal, { status: 201 });
  }),

  http.patch('/api/goals/:goalId', async ({ request, params }) => {
    await latency();
    const goal = db.goals.find((g) => g.id === params.goalId);
    if (!goal) return errorJson(404, 'goal_not_found', 'No goal with that id.');
    const body = goalUpdateSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_goal', body.error.issues[0].message);
    Object.assign(goal, body.data, { updatedAt: new Date().toISOString() });
    // Editing a returned goal moves it back into the draft pile until resubmission.
    if (goal.status === 'Returned' && (body.data.title || body.data.outcomes || body.data.description)) {
      goal.status = 'Draft';
    }
    return HttpResponse.json(goal);
  }),

  http.delete('/api/goals/:goalId', async ({ params }) => {
    await latency();
    const index = db.goals.findIndex((g) => g.id === params.goalId);
    if (index < 0) return errorJson(404, 'goal_not_found', 'No goal with that id.');
    if (db.goals[index].status === 'Approved') {
      return errorJson(409, 'goal_locked', 'Approved goals cannot be deleted. Ask HR to unlock.');
    }
    db.goals.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/cycles/:cycleId/goals/submit', async ({ request, params }) => {
    await latency();
    const me = currentUser(request);
    const mine = db.goals.filter((g) => g.cycleId === params.cycleId && g.ownerId === me.id);
    const totalWeight = mine.reduce((sum, g) => sum + g.weight, 0);
    if (totalWeight !== 100) {
      return errorJson(422, 'weights_must_total_100', `Goal weights total ${totalWeight}%, not 100%.`);
    }
    const now = new Date().toISOString();
    for (const goal of mine) {
      if (goal.status === 'Draft' || goal.status === 'Returned') {
        goal.status = 'Submitted';
        goal.updatedAt = now;
      }
    }
    return HttpResponse.json(mine);
  }),

  http.get('/api/goals/:goalId/comments', async ({ params }) => {
    await latency();
    return HttpResponse.json(db.goalComments.filter((c) => c.goalId === params.goalId));
  }),

  http.post('/api/goals/:goalId/comments', async ({ request, params }) => {
    await latency();
    const { body } = (await request.json()) as { body?: string };
    if (!body?.trim()) return errorJson(422, 'empty_comment', 'Comment body is required.');
    const now = new Date().toISOString();
    const comment = {
      id: nextId('gc'),
      goalId: params.goalId as string,
      authorId: currentUser(request).id,
      body: body.trim(),
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.goalComments.push(comment);
    return HttpResponse.json(comment, { status: 201 });
  }),
];
