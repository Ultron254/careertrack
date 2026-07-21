import { z } from 'zod';
import type { ReviewDecision } from '@/types/domain';
import { entityFields, goalStatusSchema, isoDateTime } from './common';

// One row per direct report with a submission awaiting the manager.
export const reviewQueueItemSchema = z.object({
  userId: z.string(),
  goalCount: z.number().int(),
  status: goalStatusSchema,
  overdue: z.boolean(),
});
export const reviewQueueSchema = z.array(reviewQueueItemSchema);
export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>;

export const reviewDecisionSchema = z.object({
  ...entityFields,
  goalId: z.string(),
  reviewerId: z.string(),
  decision: z.enum(['approved', 'returned']),
  comment: z.string().nullable(),
  decidedAt: isoDateTime,
}) satisfies z.ZodType<ReviewDecision>;

export const reviewDecisionsSchema = z.array(reviewDecisionSchema);

export const reviewDecisionBodySchema = z.object({
  decision: z.enum(['approved', 'returned']),
  comment: z.string().nullable(),
});
export type ReviewDecisionBody = z.infer<typeof reviewDecisionBodySchema>;

export const bulkReviewBodySchema = z.object({
  subjectIds: z.array(z.string()).min(1),
  decision: z.enum(['approved', 'returned']),
  comment: z.string(),
});
export type BulkReviewBody = z.infer<typeof bulkReviewBodySchema>;

export const bulkReviewResultSchema = z.object({
  affected: z.number().int(),
});
