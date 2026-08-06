import type { Accent, CategoryBar, DonutSegment, Kpi, Tone, TrendSeries } from './dashboard';

export type ReportScope = 'me' | 'member' | 'team' | 'employee' | 'dept' | 'org';

export interface Report {
  kpis: Kpi[];
  categoryBars: {
    title: string;
    sub: string;
    bars: CategoryBar[];
  };
  statusDonut: { title: string; segments: DonutSegment[] };
  trend: TrendSeries;
  table: {
    title: string;
    columns: [string, string, string, string];
    rows: {
      name: string;
      avatarUserId: string | null;
      cells: [string, string, string];
      lastCellTone: Tone;
    }[];
  };
  insights: {
    sub: string;
    headline: string;
    cards: {
      emoji: string;
      tag: string;
      accent: Accent;
      text: string;
      metric: string;
      metricLabel: string;
    }[];
    prompts: string[];
  };
}

export interface ExportResult {
  status: 'queued' | 'ready';
  format: 'pdf' | 'xlsx' | 'csv' | 'pptx';
  // Download location once the export is ready; null while queued.
  url: string | null;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}
