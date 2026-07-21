import { z } from 'zod';
import { goalCategorySchema } from './common';

// On-request yearly summary shown inside My Goals. Advisory only; it never
// replaces the formal appraisal.
export const yearEvaluationSchema = z.object({
  year: z.number().int(),
  score: z.number().min(0).max(4),
  yoyLabel: z.string(),
  narrative: z.string(),
  categories: z.array(
    z.object({
      category: goalCategorySchema,
      score: z.number().min(0).max(4),
    }),
  ),
});
export type YearEvaluation = z.infer<typeof yearEvaluationSchema>;
