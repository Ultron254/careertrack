import type { Cycle } from '@/types/domain';
import { seeded } from './time';

const defaults = {
  categoryWeights: { Client: 30, Company: 20, People: 30, Financial: 20 },
  enabledReviewStages: ['self', 'manager', 'peer', 'final'] as Cycle['enabledReviewStages'],
};

export const cycles: Cycle[] = [
  {
    id: 'c-2024',
    year: 2024,
    state: 'closed',
    opensAt: seeded('2024-07-01T00:00:00+03:00'),
    closesAt: seeded('2024-07-31T23:59:59+03:00'),
    ...defaults,
    createdAt: seeded('2024-06-01T09:00:00+03:00'),
    updatedAt: seeded('2024-12-20T17:00:00+03:00'),
  },
  {
    id: 'c-2025',
    year: 2025,
    state: 'closed',
    opensAt: seeded('2025-07-01T00:00:00+03:00'),
    closesAt: seeded('2025-07-31T23:59:59+03:00'),
    ...defaults,
    createdAt: seeded('2025-06-01T09:00:00+03:00'),
    updatedAt: seeded('2025-12-19T17:00:00+03:00'),
  },
  {
    id: 'c-2026',
    year: 2026,
    state: 'closing',
    opensAt: seeded('2026-07-03T00:00:00+03:00'),
    // Deadlines are Nairobi midnight; the days-left counter compares against
    // this instant rather than the browser's local midnight.
    closesAt: seeded('2026-07-30T23:59:59+03:00'),
    ...defaults,
    createdAt: seeded('2026-06-01T09:00:00+03:00'),
    updatedAt: seeded('2026-07-03T09:00:00+03:00'),
  },
];

export const activeCycle = cycles[2];
