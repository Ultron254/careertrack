import type { Appraisal } from '@/Types/domain';
import { daysAgo, seeded } from './time';

export const appraisals: Appraisal[] = [
  {
    id: 'ap-amara-2026',
    cycleId: 'c-2026',
    subjectId: 'u-amara',
    stage: 'self',
    perGoalRatings: {},
    perGoalComments: {},
    overallRating: null,
    overallComment: '',
    growthAreas: [
      {
        id: 'gr-powerpoint',
        area: 'PowerPoint / pitch presentation',
        whyItMatters: 'Client role needs regular pitch prep',
        competencies: 'Communication, Job knowledge',
      },
    ],
    submittedAt: null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(4),
  },
  {
    id: 'ap-amara-2025',
    cycleId: 'c-2025',
    subjectId: 'u-amara',
    stage: 'final',
    perGoalRatings: {
      'g-amara-client-2025': 3,
      'g-amara-people-2025': 3,
      'g-amara-company-2025': 3,
      'g-amara-financial-2025': 2,
    },
    perGoalComments: {},
    overallRating: 3,
    overallComment: 'Strong client delivery through the year; grow the commercial side next cycle.',
    growthAreas: [],
    submittedAt: seeded('2025-12-18T15:00:00+03:00'),
    createdAt: seeded('2025-12-01T09:00:00+03:00'),
    updatedAt: seeded('2025-12-18T15:00:00+03:00'),
  },
  {
    id: 'ap-amara-2024',
    cycleId: 'c-2024',
    subjectId: 'u-amara',
    stage: 'final',
    perGoalRatings: {
      'g-amara-client-2024': 3,
      'g-amara-people-2024': 3,
      'g-amara-company-2024': 2,
      'g-amara-financial-2024': 3,
    },
    perGoalComments: {},
    overallRating: 3,
    overallComment: 'A confident first cycle. Check-ins became consistent and it showed.',
    growthAreas: [],
    submittedAt: seeded('2024-12-19T15:00:00+03:00'),
    createdAt: seeded('2024-12-01T09:00:00+03:00'),
    updatedAt: seeded('2024-12-19T15:00:00+03:00'),
  },
];
