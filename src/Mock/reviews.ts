import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { ManagerReviewProps } from '@/Pages/reviews/ManagerReview';
import { knownStatuses, type QueueRow } from '@/Pages/reviews/useManagerReview';
import type { Goal, GoalComment } from '@/Types/domain';
import { cycles } from './fixtures/cycles';
import { departments } from './fixtures/departments';
import { db, nextId } from './store';
// Managers post comments from the review thread, and that action lives with
// the goals module — pull it in so landing straight on /reviews registers it.
import './goals';

// The design's review queue for David spans departments (a matrix agency),
// so the queue is its own view rather than a filter on managerId.
export const queueUserIds = ['u-amara', 'u-kevin', 'u-lydia', 'u-brian'];

// Mock counterpart of ReviewController@index: the queue enriched with people
// and department names, each member's goals for the cycle under review, and
// the comment thread per goal. The ?status= deep link resolves here.
export const managerReviewProps: PageResolver<ManagerReviewProps> = ({ query }) => {
  const activeCycle = cycles.find((c) => c.state === 'open' || c.state === 'closing') ?? cycles[0];

  const queue: QueueRow[] = queueUserIds.map((userId) => {
    const cycleGoals = db.goals.filter((g) => g.ownerId === userId && g.cycleId === 'c-2026');
    const status = cycleGoals.some((g) => g.status === 'Under Review')
      ? 'Under Review'
      : cycleGoals.some((g) => g.status === 'Submitted')
        ? 'Submitted'
        : 'Approved';
    const user = db.users.find((u) => u.id === userId);
    return {
      userId,
      user,
      departmentName: user ? (departments.find((d) => d.id === user.departmentId)?.name ?? '') : '',
      goalCount: cycleGoals.length,
      status,
      overdue: userId === 'u-kevin',
      // What a bulk decision would touch right now, so the page can report
      // the affected count the moment it fires the request.
      pendingGoals: db.goals.filter(
        (g) => g.ownerId === userId && (g.status === 'Submitted' || g.status === 'Under Review'),
      ).length,
    };
  });

  const goalsBySubject: Record<string, Goal[]> = {};
  const commentsByGoal: Record<string, GoalComment[]> = {};
  for (const userId of queueUserIds) {
    const goals = db.goals.filter((g) => g.cycleId === activeCycle.id && g.ownerId === userId);
    goalsBySubject[userId] = goals;
    for (const goal of goals) {
      commentsByGoal[goal.id] = db.goalComments.filter((c) => c.goalId === goal.id);
    }
  }

  const status = query.get('status');
  return {
    queue,
    goalsBySubject,
    commentsByGoal,
    users: db.users,
    initialStatus: status && knownStatuses.includes(status) ? status : 'All',
  };
};

// Deciding a single goal. Returning one always carries a comment, and the
// decision is kept as its own record for the audit trail.
registerAction('post', '/goals/:goalId/decision', ({ user, params, body }) => {
  const fail = (errors: Record<string, string>) => ({ errors });
  const goal = db.goals.find((g) => g.id === params.goalId);
  if (!goal) return fail({ goal: 'No goal with that id.' });
  const { decision } = body;
  if (decision !== 'approved' && decision !== 'returned') {
    return fail({ decision: 'The decision must approve or return the goal.' });
  }
  const comment = typeof body.comment === 'string' ? body.comment : null;
  if (decision === 'returned' && !comment?.trim()) {
    return fail({ comment: 'Returning a goal requires a comment.' });
  }
  const now = new Date().toISOString();
  goal.status = decision === 'approved' ? 'Approved' : 'Returned';
  goal.updatedAt = now;
  db.reviewDecisions.push({
    id: nextId('rd'),
    goalId: goal.id,
    reviewerId: user.id,
    decision,
    comment,
    decidedAt: now,
    createdAt: now,
    updatedAt: now,
  });
});

// Deciding whole submissions in one sweep. Only goals still awaiting a
// verdict (Submitted or Under Review) move; everything else is untouched, so
// a partially-decided selection simply affects fewer goals.
registerAction('post', '/reviews/bulk', ({ body }) => {
  const fail = (errors: Record<string, string>) => ({ errors });
  const subjectIds = Array.isArray(body.subjectIds) ? (body.subjectIds as string[]) : [];
  if (subjectIds.length === 0) {
    return fail({ subjectIds: 'Pick at least one team member.' });
  }
  const { decision } = body;
  if (decision !== 'approved' && decision !== 'returned') {
    return fail({ decision: 'The decision must approve or return the goals.' });
  }
  const now = new Date().toISOString();
  for (const goal of db.goals) {
    const inScope =
      subjectIds.includes(goal.ownerId) &&
      (goal.status === 'Submitted' || goal.status === 'Under Review');
    if (!inScope) continue;
    goal.status = decision === 'approved' ? 'Approved' : 'Returned';
    goal.updatedAt = now;
  }
});
