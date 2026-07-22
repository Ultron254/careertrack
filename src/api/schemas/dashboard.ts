import { z } from 'zod';
import { goalCategorySchema } from './common';

// Colours never travel over the wire; the UI maps these accents onto tokens.
export const accentSchema = z.enum(['teal', 'blue', 'orange', 'gold', 'ink']);
export type Accent = z.infer<typeof accentSchema>;

export const toneSchema = z.enum(['positive', 'negative', 'caution', 'info', 'muted']);
export type Tone = z.infer<typeof toneSchema>;

export const statusToneSchema = z.enum(['approved', 'submitted', 'review', 'returned', 'neutral']);
export type StatusTone = z.infer<typeof statusToneSchema>;

export const kpiSchema = z.object({
  label: z.string(),
  value: z.string(),
  delta: z.string().nullable(),
  deltaTone: toneSchema,
  sub: z.string(),
  accent: accentSchema,
  // Optional extras used by the dashboard/reports: a one line explanation shown
  // on hover, and a route the card drills into when clicked.
  hint: z.string().optional(),
  target: z.string().optional(),
});
export type Kpi = z.infer<typeof kpiSchema>;

export const donutSegmentSchema = z.object({
  label: z.string(),
  share: z.number().min(0).max(100),
  accent: accentSchema,
  // Optional hover detail (e.g. "2 goals") and a route to drill into.
  detail: z.string().optional(),
  target: z.string().optional(),
});
export type DonutSegment = z.infer<typeof donutSegmentSchema>;

export const trendSeriesSchema = z.object({
  title: z.string(),
  sub: z.string(),
  points: z.array(z.number()),
  labels: z.array(z.string()),
});
export type TrendSeries = z.infer<typeof trendSeriesSchema>;

export const categoryBarSchema = z.object({
  label: z.string(),
  valueLabel: z.string(),
  heightPct: z.number().min(0).max(100),
  accent: accentSchema,
  // Optional hover detail and a route to drill into.
  detail: z.string().optional(),
  target: z.string().optional(),
});

export const dashboardSchema = z.object({
  banner: z.object({
    kicker: z.string(),
    title: z.string(),
    subtitle: z.string(),
    cta: z.string(),
    daysLeft: z.number().nullable(),
    target: z.string(),
  }),
  kpis: z.array(kpiSchema),
  statusDonut: z.object({ title: z.string(), segments: z.array(donutSegmentSchema) }),
  trend: trendSeriesSchema,
  categoryBars: z.object({ title: z.string(), bars: z.array(categoryBarSchema) }),
  list: z.object({
    title: z.string(),
    linkLabel: z.string(),
    target: z.string(),
    rows: z.array(
      z.object({
        id: z.string(),
        avatarUserId: z.string().nullable(),
        chip: goalCategorySchema.nullable(),
        title: z.string(),
        meta: z.string(),
        status: z.string(),
        statusTone: statusToneSchema,
        accent: accentSchema,
      }),
    ),
  }),
  side: z.object({
    title: z.string(),
    rows: z.array(
      z.object({
        label: z.string(),
        count: z.string(),
        pct: z.number().min(0).max(100),
        accent: accentSchema,
        target: z.string().optional(),
      }),
    ),
  }),
  promo: z.object({
    title: z.string(),
    subtitle: z.string(),
    cta: z.string(),
    target: z.string(),
  }),
});
export type Dashboard = z.infer<typeof dashboardSchema>;
