import { z } from 'zod';
import { accentSchema, categoryBarSchema, donutSegmentSchema, kpiSchema, toneSchema, trendSeriesSchema } from './dashboard';

export const reportScopeSchema = z.enum(['me', 'member', 'team', 'employee', 'dept', 'org']);
export type ReportScope = z.infer<typeof reportScopeSchema>;

export const reportSchema = z.object({
  kpis: z.array(kpiSchema),
  categoryBars: z.object({
    title: z.string(),
    sub: z.string(),
    bars: z.array(categoryBarSchema),
  }),
  statusDonut: z.object({ title: z.string(), segments: z.array(donutSegmentSchema) }),
  trend: trendSeriesSchema,
  table: z.object({
    title: z.string(),
    columns: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    rows: z.array(
      z.object({
        name: z.string(),
        avatarUserId: z.string().nullable(),
        cells: z.tuple([z.string(), z.string(), z.string()]),
        lastCellTone: toneSchema,
      }),
    ),
  }),
  insights: z.object({
    sub: z.string(),
    headline: z.string(),
    cards: z.array(
      z.object({
        emoji: z.string(),
        tag: z.string(),
        accent: accentSchema,
        text: z.string(),
        metric: z.string(),
        metricLabel: z.string(),
      }),
    ),
    prompts: z.array(z.string()),
  }),
});
export type Report = z.infer<typeof reportSchema>;

export const exportResultSchema = z.object({
  status: z.enum(['queued', 'ready']),
  format: z.enum(['pdf', 'xlsx', 'csv', 'pptx']),
  // Download location once the export is ready; null while queued.
  url: z.string().nullable(),
});
export type ExportResult = z.infer<typeof exportResultSchema>;

export const reportScheduleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  enabled: z.boolean(),
});
export type ReportSchedule = z.infer<typeof reportScheduleSchema>;
