import { z } from 'zod';
import type { TeamAppraisal } from '@/types/domain';
import { entityFields, isoDateTime, ratingSchema } from './common';

export const teamAppraisalStageSchema = z.enum(['manager', 'discussion', 'acknowledge', 'done']);

export const finalRatingSchema = z.object({
  value: ratingSchema.nullable(),
  status: z.enum(['open', 'proposed', 'locked', 'flagged', 'resolved']),
});

export const signaturePartySchema = z.enum(['employee', 'manager', 'people_team']);
export type SignaturePartyInput = z.infer<typeof signaturePartySchema>;

export const signRequestSchema = z.object({ party: signaturePartySchema });

export const teamAppraisalSchema = z.object({
  ...entityFields,
  cycleId: z.string(),
  subjectId: z.string(),
  managerId: z.string(),
  stage: teamAppraisalStageSchema,
  managerRatings: z.record(z.string(), ratingSchema),
  evidence: z.record(z.string(), z.string()),
  overallComment: z.string(),
  finals: z.record(z.string(), finalRatingSchema),
  signatures: z.object({
    employee: isoDateTime.nullable(),
    manager: isoDateTime.nullable(),
    people_team: isoDateTime.nullable(),
  }),
}) satisfies z.ZodType<TeamAppraisal>;

// Draft the manager saves as they work; signatures only move through the
// dedicated sign endpoint.
export const teamAppraisalDraftSchema = teamAppraisalSchema.pick({
  stage: true,
  managerRatings: true,
  evidence: true,
  overallComment: true,
  finals: true,
});
export type TeamAppraisalDraft = z.infer<typeof teamAppraisalDraftSchema>;

// One row in the People Team calibration table. The backend aggregates the
// self, manager and final scores per person for the requested cycle.
export const calibrationRowSchema = z.object({
  userId: z.string(),
  name: z.string(),
  jobTitle: z.string(),
  self: z.number().nullable(),
  manager: z.number().nullable(),
  final: z.number().nullable(),
  stage: z.enum(['self', 'manager', 'discussion', 'acknowledge', 'done']),
  // True when the appraisal is still being worked and can be opened live.
  live: z.boolean(),
});
export type CalibrationRow = z.infer<typeof calibrationRowSchema>;

export const calibrationSchema = z.object({
  cycleId: z.string(),
  teamName: z.string(),
  rows: z.array(calibrationRowSchema),
});
export type Calibration = z.infer<typeof calibrationSchema>;
