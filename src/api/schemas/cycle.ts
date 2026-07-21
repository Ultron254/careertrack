import { z } from 'zod';
import type { Cycle } from '@/types/domain';
import { cycleStateSchema, entityFields, isoDateTime, reviewStageSchema } from './common';

export const cycleSchema = z.object({
  ...entityFields,
  year: z.number().int(),
  state: cycleStateSchema,
  opensAt: isoDateTime,
  closesAt: isoDateTime,
  categoryWeights: z.object({
    Client: z.number(),
    Company: z.number(),
    People: z.number(),
    Financial: z.number(),
  }),
  enabledReviewStages: z.array(reviewStageSchema),
}) satisfies z.ZodType<Cycle>;

export const cyclesSchema = z.array(cycleSchema);
