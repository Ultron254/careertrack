import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { GoalSetupProps } from '@/Pages/goals/GoalSetup';
import type { MyGoalsProps } from '@/Pages/goals/MyGoals';
import { pickActiveCycle } from '@/Pages/goals/useActiveCycle';
import { isStatusFilter } from '@/Pages/goals/useMyGoals';
import type { Goal, GoalCategory } from '@/Types/domain';
import { cycles } from './fixtures/cycles';
import { yearEvaluations } from './fixtures/evaluations';
import { db, nextId } from './store';
// The goal wizard's review step books meetings through '/calendar/events',
// so landing straight on /goals/setup must register that action too.
import './calendar';

// Mock counterpart of GoalController@index: every cycle newest year first,
// each with the signed-in user's goals and the on-request AI evaluation for
// that year. The ?status= deep link resolves here so the page owns no URL
// parsing.
export const myGoalsProps: PageResolver<MyGoalsProps> = ({ user, query }) => {
  const status = query.get('status');
  return {
    groups: [...cycles]
      .sort((a, b) => b.year - a.year)
      .map((cycle) => ({
        year: cycle.year,
        cycle,
        goals: db.goals.filter((g) => g.cycleId === cycle.id && g.ownerId === user.id),
        evaluation: yearEvaluations.find((e) => e.year === cycle.year) ?? null,
      })),
    initialStatus: isStatusFilter(status) ? status : 'All',
  };
};

// Mock counterpart of GoalController@setup: the cycle currently accepting
// goals, the user's goals in it, and the colleagues the review-meeting
// scheduler can invite.
export const goalSetupProps: PageResolver<GoalSetupProps> = ({ user }) => {
  const activeCycle = pickActiveCycle(cycles) ?? null;
  return {
    activeCycle,
    goals: activeCycle
      ? db.goals.filter((g) => g.cycleId === activeCycle.id && g.ownerId === user.id)
      : [],
    attendees: db.users,
  };
};

const categories: GoalCategory[] = ['Client', 'Company', 'People', 'Financial'];

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

// One validator serves both writes: a store checks every field, an update
// only the fields present in the body.
function goalErrors(body: Record<string, unknown>, partial: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  const check = (key: string) => !partial || key in body;
  if (check('category') && !categories.includes(body.category as GoalCategory)) {
    errors.category = 'Choose a goal category.';
  }
  if (check('title') && typeof body.title !== 'string') errors.title = 'A goal needs a title.';
  if (check('description') && typeof body.description !== 'string') {
    errors.description = 'The description must be text.';
  }
  if (check('outcomes') && typeof body.outcomes !== 'string') {
    errors.outcomes = 'Desired outcomes must be text.';
  }
  if (
    check('weight') &&
    (typeof body.weight !== 'number' || body.weight < 0 || body.weight > 100)
  ) {
    errors.weight = 'The weight must be between 0 and 100.';
  }
  if (check('targetDate') && !isIsoDate(body.targetDate)) {
    errors.targetDate = 'The target date must be a real date.';
  }
  if (check('isStretch') && typeof body.isStretch !== 'boolean') {
    errors.isStretch = 'Say whether this is a stretch goal.';
  }
  if (check('privateNote') && body.privateNote !== null && typeof body.privateNote !== 'string') {
    errors.privateNote = 'The private note must be text.';
  }
  if (
    partial &&
    'progress' in body &&
    (typeof body.progress !== 'number' || body.progress < 0 || body.progress > 100)
  ) {
    errors.progress = 'Progress must be between 0 and 100.';
  }
  return errors;
}

// Adding a goal. New goals always start as drafts with no progress.
registerAction('post', '/cycles/:cycleId/goals', ({ user, params, body }) => {
  const errors = goalErrors(body, false);
  if (Object.keys(errors).length > 0) return { errors };
  const now = new Date().toISOString();
  const goal: Goal = {
    id: nextId('g'),
    cycleId: params.cycleId,
    ownerId: user.id,
    category: body.category as GoalCategory,
    title: body.title as string,
    description: body.description as string,
    outcomes: body.outcomes as string,
    weight: body.weight as number,
    targetDate: body.targetDate as string,
    isStretch: body.isStretch as boolean,
    status: 'Draft',
    progress: 0,
    privateNote: body.privateNote as string | null,
    createdAt: now,
    updatedAt: now,
  };
  db.goals.push(goal);
});

// Saving changes to a goal. Only the fields sent are touched.
registerAction('patch', '/goals/:goalId', ({ params, body }) => {
  const goal = db.goals.find((g) => g.id === params.goalId);
  if (!goal) return { errors: { goal: 'No goal with that id.' } };
  const errors = goalErrors(body, true);
  if (Object.keys(errors).length > 0) return { errors };

  if ('category' in body) goal.category = body.category as GoalCategory;
  if ('title' in body) goal.title = body.title as string;
  if ('description' in body) goal.description = body.description as string;
  if ('outcomes' in body) goal.outcomes = body.outcomes as string;
  if ('weight' in body) goal.weight = body.weight as number;
  if ('targetDate' in body) goal.targetDate = body.targetDate as string;
  if ('isStretch' in body) goal.isStretch = body.isStretch as boolean;
  if ('privateNote' in body) goal.privateNote = body.privateNote as string | null;
  if ('progress' in body) goal.progress = body.progress as number;
  goal.updatedAt = new Date().toISOString();
  // Editing a returned goal moves it back into the draft pile until resubmission.
  if (goal.status === 'Returned' && (body.title || body.outcomes || body.description)) {
    goal.status = 'Draft';
  }
});

// Deleting a goal. Approval locks it in; only HR can unlock, so the refusal
// reads exactly the way the page toasts it.
registerAction('delete', '/goals/:goalId', ({ params }) => {
  const index = db.goals.findIndex((g) => g.id === params.goalId);
  if (index < 0) return { errors: { goal: 'No goal with that id.' } };
  if (db.goals[index].status === 'Approved') {
    return { errors: { goal: 'Approved goals cannot be deleted. Ask HR to unlock.' } };
  }
  db.goals.splice(index, 1);
});

// Submitting a cycle's goals all together. Weights must land on exactly 100
// across the whole set; anything still Draft or Returned moves to Submitted.
registerAction('post', '/cycles/:cycleId/goals/submit', ({ user, params }) => {
  const mine = db.goals.filter((g) => g.cycleId === params.cycleId && g.ownerId === user.id);
  const totalWeight = mine.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight !== 100) {
    return { errors: { weight: `Goal weights total ${totalWeight}%, not 100%.` } };
  }
  const now = new Date().toISOString();
  for (const goal of mine) {
    if (goal.status === 'Draft' || goal.status === 'Returned') {
      goal.status = 'Submitted';
      goal.updatedAt = now;
    }
  }
});

// Commenting on a goal, used from the manager review thread.
registerAction('post', '/goals/:goalId/comments', ({ user, params, body }) => {
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return { errors: { body: 'Comment body is required.' } };
  const now = new Date().toISOString();
  db.goalComments.push({
    id: nextId('gc'),
    goalId: params.goalId,
    authorId: user.id,
    body: text,
    postedAt: now,
    createdAt: now,
    updatedAt: now,
  });
});
