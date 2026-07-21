import type { Department } from '@/types/domain';
import { seeded } from './time';

const created = seeded('2018-01-01T09:00:00+03:00');

// colour holds an accent token name, never a hex value; the UI resolves it
// against the palette in tokens.css.
export const departments: Department[] = [
  {
    id: 'd-client-service',
    name: 'Client Service',
    colour: 'teal',
    managerId: 'u-david',
    createdAt: created,
    updatedAt: created,
  },
  {
    id: 'd-creative',
    name: 'Creative',
    colour: 'orange',
    managerId: 'u-tom',
    createdAt: created,
    updatedAt: created,
  },
  {
    id: 'd-digital',
    name: 'Digital',
    colour: 'blue',
    managerId: 'u-lydia',
    createdAt: created,
    updatedAt: created,
  },
  {
    id: 'd-pr-media',
    name: 'PR & Media Relations',
    colour: 'gold',
    managerId: 'u-peter',
    createdAt: created,
    updatedAt: created,
  },
  {
    id: 'd-people',
    name: 'People & Culture (HR)',
    colour: 'teal',
    managerId: 'u-wanjiru',
    createdAt: created,
    updatedAt: created,
  },
  {
    id: 'd-exec',
    name: 'Executive',
    colour: 'ink',
    managerId: 'u-leila',
    createdAt: created,
    updatedAt: created,
  },
];
