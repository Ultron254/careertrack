import type { Goal, GoalCategory, GoalStatus } from '@/types/domain';
import { daysAgo, seeded } from './time';

const stamp = (created: string, updated?: string) => ({
  createdAt: seeded(created),
  updatedAt: updated ? seeded(updated) : seeded(created),
});

// Amara's goals carry the full copy from the design; everyone else gets the
// same four standard goals so every profile and review pane has content.

const amara2026: Goal[] = [
  {
    id: 'g-amara-client-2026',
    cycleId: 'c-2026',
    ownerId: 'u-amara',
    category: 'Client',
    title: 'Client retention & growth',
    description:
      'Weekly deliverables, monthly report by the 5th, collateral shared 48h before posting, and host clients regularly.',
    outcomes: '2 media engagements/quarter; report by 5th monthly.',
    weight: 30,
    targetDate: '2026-12-31',
    isStretch: false,
    status: 'Approved',
    progress: 100,
    privateNote: null,
    ...stamp('2026-07-04T10:12:00+03:00', '2026-07-10T09:00:00+03:00'),
  },
  {
    id: 'g-amara-company-2026',
    cycleId: 'c-2026',
    ownerId: 'u-amara',
    category: 'Company',
    title: 'Develop 2 case studies',
    description: 'Build case studies from delivered projects and contribute to pitches.',
    outcomes:
      '2 case studies a year; contribute to 1 successful pitch/month; proper filing per the Oxygène system.',
    weight: 20,
    targetDate: '2026-12-31',
    isStretch: false,
    status: 'Under Review',
    progress: 60,
    privateNote: null,
    ...stamp('2026-07-04T10:25:00+03:00', '2026-07-15T14:30:00+03:00'),
  },
  {
    id: 'g-amara-people-2026',
    cycleId: 'c-2026',
    ownerId: 'u-amara',
    category: 'People',
    title: 'Team development & onboarding',
    description: 'Take part in 2+ training sessions a year and onboard new team members.',
    outcomes: '2 trainings a year; smooth onboarding for new joiners.',
    weight: 30,
    targetDate: '2026-12-31',
    isStretch: true,
    status: 'Approved',
    progress: 100,
    privateNote: 'Ask Wanjiru about the mentoring circle before Q3.',
    ...stamp('2026-07-04T10:40:00+03:00', '2026-07-10T09:00:00+03:00'),
  },
  {
    id: 'g-amara-financial-2026',
    cycleId: 'c-2026',
    ownerId: 'u-amara',
    category: 'Financial',
    title: 'Revenue growth & upselling',
    description: 'Grow client revenue through upselling and new-business contribution.',
    outcomes: 'Contribute to new-business revenue with POD.',
    weight: 20,
    targetDate: '2026-12-31',
    isStretch: false,
    status: 'Returned',
    progress: 0,
    privateNote: null,
    ...stamp('2026-07-04T10:55:00+03:00', '2026-07-16T11:20:00+03:00'),
  },
];

const amaraHistory: Goal[] = (
  [
    ['c-2025', 'Client', 'Grew 3 key accounts', 35],
    ['c-2025', 'People', 'Mentored 2 juniors', 25],
    ['c-2025', 'Company', '1 case study published', 20],
    ['c-2025', 'Financial', 'Hit upsell target', 20],
    ['c-2024', 'Client', 'Onboarded smoothly', 30],
    ['c-2024', 'People', 'Joined the DEI group', 20],
    ['c-2024', 'Company', 'Supported 2 pitches', 30],
    ['c-2024', 'Financial', 'Tracked billable hours', 20],
  ] as [string, GoalCategory, string, number][]
).map(([cycleId, category, title, weight]) => {
  const year = cycleId === 'c-2025' ? 2025 : 2024;
  return {
    id: `g-amara-${category.toLowerCase()}-${year}`,
    cycleId,
    ownerId: 'u-amara',
    category,
    title,
    description: '',
    outcomes: '',
    weight,
    targetDate: `${year}-12-31`,
    isStretch: false,
    status: 'Approved' as GoalStatus,
    progress: 100,
    privateNote: null,
    ...stamp(`${year}-07-05T10:00:00+03:00`, `${year}-12-15T10:00:00+03:00`),
  };
});

const standardTitles: [GoalCategory, string, number][] = [
  ['Client', 'Client retention & growth', 30],
  ['Company', 'Develop 2 case studies', 20],
  ['People', 'Team development & onboarding', 30],
  ['Financial', 'Revenue growth & upselling', 20],
];

function standardGoals(
  ownerId: string,
  statuses: Partial<Record<GoalCategory, GoalStatus>>,
  fallback: GoalStatus,
): Goal[] {
  return standardTitles.map(([category, title, weight]) => ({
    id: `g-${ownerId.slice(2)}-${category.toLowerCase()}-2026`,
    cycleId: 'c-2026',
    ownerId,
    category,
    title,
    description: '',
    outcomes: '',
    weight,
    targetDate: '2026-12-31',
    isStretch: category === 'People',
    status: statuses[category] ?? fallback,
    progress: (statuses[category] ?? fallback) === 'Approved' ? 100 : 25,
    privateNote: null,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(3),
  }));
}

export const goals: Goal[] = [
  ...amara2026,
  ...amaraHistory,
  ...standardGoals('u-sana', {}, 'Approved'),
  ...standardGoals('u-grace', {}, 'Approved'),
  ...standardGoals('u-kevin', { Client: 'Returned' }, 'Submitted'),
  ...standardGoals('u-lydia', {}, 'Submitted'),
  ...standardGoals('u-brian', {}, 'Submitted'),
  ...standardGoals('u-faith', { People: 'Returned' }, 'Submitted'),
  ...standardGoals('u-nadia', {}, 'Approved'),
  ...standardGoals('u-ruth', {}, 'Approved'),
  ...standardGoals('u-ali', {}, 'Submitted'),
  ...standardGoals('u-tom', { Company: 'Returned' }, 'Submitted'),
];
