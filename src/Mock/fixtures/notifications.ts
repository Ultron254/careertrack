import type { Notification } from '@/Types/domain';
import { daysAgo, hoursAgo } from './time';

const forUser = (
  userId: string,
  rows: [string, Notification['kind'], string, string, string, string | null][],
): Notification[] =>
  rows.map(([id, kind, title, body, createdAt, readAt]) => ({
    id,
    userId,
    kind,
    title,
    body,
    readAt,
    link: {
      goal_returned: '/goals',
      goal_approved: '/goals',
      feedback_requested: '/feedback',
      meeting_reminder: '/calendar',
      system: '/settings',
    }[kind],
    createdAt,
    updatedAt: createdAt,
  }));

export const notifications: Notification[] = [
  ...forUser('u-amara', [
    [
      'n-amara-1',
      'goal_returned',
      'David Otieno',
      'returned your Financial goal.',
      hoursAgo(2),
      null,
    ],
    [
      'n-amara-2',
      'feedback_requested',
      'Grace Achieng',
      'requested your feedback, due Friday.',
      hoursAgo(5),
      null,
    ],
    ['n-amara-3', 'goal_approved', 'Your Client goal', 'was approved.', daysAgo(1), daysAgo(1)],
    [
      'n-amara-4',
      'meeting_reminder',
      'Mid-year check-in',
      'Jul 14 at 3:00 PM.',
      daysAgo(1),
      daysAgo(1),
    ],
  ]),
  ...forUser('u-david', [
    [
      'n-david-1',
      'goal_returned',
      'Kevin Njoroge',
      'submitted revised goals for review.',
      hoursAgo(3),
      null,
    ],
    [
      'n-david-2',
      'meeting_reminder',
      'Team goal review',
      'Jul 18 at 11:00 AM.',
      hoursAgo(20),
      null,
    ],
    [
      'n-david-3',
      'feedback_requested',
      'Amara Koech',
      'requested peer feedback for her appraisal.',
      daysAgo(2),
      daysAgo(1),
    ],
  ]),
  ...forUser('u-wanjiru', [
    [
      'n-wanjiru-1',
      'goal_returned',
      'Return loop',
      '4 returned goals await People Team review.',
      hoursAgo(4),
      null,
    ],
    [
      'n-wanjiru-2',
      'meeting_reminder',
      'Cycle close',
      'Goal setting closes Jul 30.',
      daysAgo(1),
      null,
    ],
  ]),
  ...forUser('u-sam', [
    [
      'n-sam-1',
      'meeting_reminder',
      'Cycle close',
      'Goal setting closes Jul 30.',
      daysAgo(1),
      daysAgo(1),
    ],
    [
      'n-sam-2',
      'system',
      'Weekly digest',
      '2 manager accounts have no direct reports assigned.',
      hoursAgo(6),
      null,
    ],
  ]),
];
