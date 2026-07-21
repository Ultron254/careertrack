import { z } from 'zod';
import type { Goal, GoalComment } from '@/types/domain';
import { entityFields, goalCategorySchema, goalStatusSchema, isoDate, isoDateTime } from './common';

export const goalSchema = z.object({
  ...entityFields,
  cycleId: z.string(),
  ownerId: z.string(),
  category: goalCategorySchema,
  title: z.string(),
  description: z.string(),
  outcomes: z.string(),
  weight: z.number().min(0).max(100),
  targetDate: isoDate,
  isStretch: z.boolean(),
  status: goalStatusSchema,
  progress: z.number().min(0).max(100),
  privateNote: z.string().nullable(),
}) satisfies z.ZodType<Goal>;

export const goalsSchema = z.array(goalSchema);

export const goalCommentSchema = z.object({
  ...entityFields,
  goalId: z.string(),
  authorId: z.string(),
  body: z.string(),
  postedAt: isoDateTime,
}) satisfies z.ZodType<GoalComment>;

export const goalCommentsSchema = z.array(goalCommentSchema);

// Request bodies. The server owns id, status and timestamps.
export const goalDraftSchema = goalSchema.pick({
  cycleId: true,
  category: true,
  title: true,
  description: true,
  outcomes: true,
  weight: true,
  targetDate: true,
  isStretch: true,
  privateNote: true,
});
export type GoalDraft = z.infer<typeof goalDraftSchema>;

export const goalUpdateSchema = goalDraftSchema.partial().extend({
  progress: z.number().min(0).max(100).optional(),
});
export type GoalUpdate = z.infer<typeof goalUpdateSchema>;
