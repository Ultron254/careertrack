import { z } from 'zod';

export const roleSchema = z.enum(['employee', 'manager', 'people_team', 'admin']);
export const goalCategorySchema = z.enum(['Client', 'Company', 'People', 'Financial']);
export const goalStatusSchema = z.enum([
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Returned',
]);
export const cycleStateSchema = z.enum(['upcoming', 'open', 'closing', 'closed']);
export const reviewStageSchema = z.enum(['self', 'manager', 'peer', 'final']);

export const ratingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const isoDateTime = z.string().datetime({ offset: true });
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const entityFields = {
  id: z.string(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
};
