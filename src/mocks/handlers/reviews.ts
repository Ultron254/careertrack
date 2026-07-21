import { http, HttpResponse } from 'msw';
import { bulkReviewBodySchema, reviewDecisionBodySchema } from '@/api/schemas/review';
import { db, nextId } from '../db';
import { currentUser, errorJson, latency } from './utils';

// The design's review queue for David spans departments (a matrix agency),
// so the queue is its own view rather than a filter on managerId.
const queueUserIds = ['u-amara', 'u-kevin', 'u-lydia', 'u-brian'];

export const reviewHandlers = [
  http.get('/api/reviews/queue', async () => {
    await latency();
    const queue = queueUserIds.map((userId) => {
      const goals = db.goals.filter((g) => g.ownerId === userId && g.cycleId === 'c-2026');
      const status = goals.some((g) => g.status === 'Under Review')
        ? 'Under Review'
        : goals.some((g) => g.status === 'Submitted')
          ? 'Submitted'
          : 'Approved';
      return { userId, goalCount: goals.length, status, overdue: userId === 'u-kevin' };
    });
    return HttpResponse.json(queue);
  }),

  http.post('/api/goals/:goalId/decision', async ({ request, params }) => {
    await latency();
    const goal = db.goals.find((g) => g.id === params.goalId);
    if (!goal) return errorJson(404, 'goal_not_found', 'No goal with that id.');
    const body = reviewDecisionBodySchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_decision', body.error.issues[0].message);
    if (body.data.decision === 'returned' && !body.data.comment?.trim()) {
      return errorJson(422, 'comment_required', 'Returning a goal requires a comment.');
    }
    const now = new Date().toISOString();
    goal.status = body.data.decision === 'approved' ? 'Approved' : 'Returned';
    goal.updatedAt = now;
    const decision = {
      id: nextId('rd'),
      goalId: goal.id,
      reviewerId: currentUser(request).id,
      decision: body.data.decision,
      comment: body.data.comment,
      decidedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.reviewDecisions.push(decision);
    return HttpResponse.json(decision, { status: 201 });
  }),

  http.post('/api/reviews/bulk', async ({ request }) => {
    await latency();
    const body = bulkReviewBodySchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_bulk_review', body.error.issues[0].message);
    const now = new Date().toISOString();
    let affected = 0;
    for (const goal of db.goals) {
      const inScope =
        body.data.subjectIds.includes(goal.ownerId) &&
        (goal.status === 'Submitted' || goal.status === 'Under Review');
      if (!inScope) continue;
      goal.status = body.data.decision === 'approved' ? 'Approved' : 'Returned';
      goal.updatedAt = now;
      affected++;
    }
    return HttpResponse.json({ affected });
  }),
];
