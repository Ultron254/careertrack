import { z } from 'zod';
import type { FeedbackRequest, FeedbackResponse } from '@/types/domain';
import { entityFields, isoDate, ratingSchema } from './common';

export const feedbackTemplateSchema = z.enum(['full', 'quick', 'project']);

export const feedbackRequestSchema = z.object({
  ...entityFields,
  requesterId: z.string(),
  peerId: z.string(),
  template: feedbackTemplateSchema,
  message: z.string(),
  dueDate: isoDate.nullable(),
  includesRating: z.boolean(),
  status: z.enum(['pending', 'completed']),
}) satisfies z.ZodType<FeedbackRequest>;

export const feedbackRequestsSchema = z.array(feedbackRequestSchema);

export const feedbackResponseSchema = z.object({
  ...entityFields,
  requestId: z.string(),
  strengths: z.string(),
  growthAreas: z.string(),
  rating: ratingSchema.nullable(),
}) satisfies z.ZodType<FeedbackResponse>;

export const feedbackResponsesSchema = z.array(feedbackResponseSchema);

export const feedbackRequestBodySchema = z.object({
  peerIds: z.array(z.string()).min(1),
  template: feedbackTemplateSchema,
  message: z.string(),
  dueDate: isoDate.nullable(),
  includesRating: z.boolean(),
});
export type FeedbackRequestBody = z.infer<typeof feedbackRequestBodySchema>;

export const feedbackResponseBodySchema = z.object({
  strengths: z.string().min(1),
  growthAreas: z.string(),
  rating: ratingSchema.nullable(),
});
export type FeedbackResponseBody = z.infer<typeof feedbackResponseBodySchema>;
