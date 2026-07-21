import { z } from 'zod';
import type { Appraisal, GrowthArea } from '@/types/domain';
import { entityFields, isoDateTime, ratingSchema, reviewStageSchema } from './common';

export const growthAreaSchema = z.object({
  id: z.string(),
  area: z.string(),
  whyItMatters: z.string(),
  competencies: z.string(),
}) satisfies z.ZodType<GrowthArea>;

export const appraisalSchema = z.object({
  ...entityFields,
  cycleId: z.string(),
  subjectId: z.string(),
  stage: reviewStageSchema,
  perGoalRatings: z.record(z.string(), ratingSchema),
  perGoalComments: z.record(z.string(), z.string()),
  overallRating: ratingSchema.nullable(),
  overallComment: z.string(),
  growthAreas: z.array(growthAreaSchema),
  submittedAt: isoDateTime.nullable(),
}) satisfies z.ZodType<Appraisal>;

export const appraisalsSchema = z.array(appraisalSchema);

export const appraisalDraftSchema = appraisalSchema.pick({
  perGoalRatings: true,
  perGoalComments: true,
  overallRating: true,
  overallComment: true,
  growthAreas: true,
});
export type AppraisalDraft = z.infer<typeof appraisalDraftSchema>;
