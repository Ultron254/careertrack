import { z } from 'zod';
import { goalCategorySchema, reviewStageSchema } from './common';

export const reminderOffsetSchema = z.enum(['14d', '7d', '3d', '1d', 'due']);
export type ReminderOffset = z.infer<typeof reminderOffsetSchema>;

export const escalationRuleSchema = z.enum(['notify_manager', 'notify_people_team', 'auto_extend', 'flag_record']);
export type EscalationRule = z.infer<typeof escalationRuleSchema>;

export const adHocConditionSchema = z.enum(['specific_employee', 'department', 'circumstance']);
export type AdHocCondition = z.infer<typeof adHocConditionSchema>;

export const hrConfigSchema = z.object({
  categories: z.array(
    z.object({
      category: goalCategorySchema,
      defaultWeightPct: z.number().min(0).max(100),
      enabled: z.boolean(),
    }),
  ),
  // self and manager stages are mandatory; the API rejects attempts to disable them.
  reviewStages: z.array(
    z.object({
      stage: reviewStageSchema,
      enabled: z.boolean(),
      locked: z.boolean(),
    }),
  ),
  reminders: z.array(
    z.object({
      offset: reminderOffsetSchema,
      enabled: z.boolean(),
    }),
  ),
  escalations: z.array(
    z.object({
      rule: escalationRuleSchema,
      enabled: z.boolean(),
    }),
  ),
  adHocGoals: z.object({
    enabled: z.boolean(),
    conditions: z.array(
      z.object({
        condition: adHocConditionSchema,
        enabled: z.boolean(),
      }),
    ),
  }),
  cyclePhases: z.array(
    z.object({
      name: z.string(),
      startsOn: z.string(),
      endsOn: z.string(),
    }),
  ),
});
export type HrConfig = z.infer<typeof hrConfigSchema>;
