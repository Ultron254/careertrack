import type { GoalComment, ReviewDecision } from '@/types/domain';
import { daysAgo } from './time';

export const goalComments: GoalComment[] = [
  {
    id: 'gc-1',
    goalId: 'g-amara-client-2026',
    authorId: 'u-david',
    body: 'Love the monthly report cadence. Can we add a target for client NPS too?',
    postedAt: daysAgo(2),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'gc-2',
    goalId: 'g-amara-financial-2026',
    authorId: 'u-david',
    body: 'Please add a measurable revenue target so we can track this quarter by quarter.',
    postedAt: daysAgo(5),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
];

export const reviewDecisions: ReviewDecision[] = [
  {
    id: 'rd-1',
    goalId: 'g-amara-client-2026',
    reviewerId: 'u-david',
    decision: 'approved',
    comment: null,
    decidedAt: daysAgo(11),
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
  },
  {
    id: 'rd-2',
    goalId: 'g-amara-people-2026',
    reviewerId: 'u-david',
    decision: 'approved',
    comment: null,
    decidedAt: daysAgo(11),
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
  },
  {
    id: 'rd-3',
    goalId: 'g-amara-financial-2026',
    reviewerId: 'u-david',
    decision: 'returned',
    comment: 'Your line manager asked for a measurable revenue target; HR has unlocked editing.',
    decidedAt: daysAgo(5),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
];
