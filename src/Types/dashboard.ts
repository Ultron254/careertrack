import type { GoalCategory } from './domain';

// Colours never travel over the wire; the UI maps these accents onto tokens.
export type Accent = 'teal' | 'blue' | 'orange' | 'gold' | 'ink';

export type Tone = 'positive' | 'negative' | 'caution' | 'info' | 'muted';

export type StatusTone = 'approved' | 'submitted' | 'review' | 'returned' | 'neutral';

export interface Kpi {
  label: string;
  value: string;
  delta: string | null;
  deltaTone: Tone;
  sub: string;
  accent: Accent;
  // Optional extras used by the dashboard/reports: a one line explanation shown
  // on hover, and a route the card drills into when clicked.
  hint?: string;
  target?: string;
}

export interface DonutSegment {
  label: string;
  // 0 to 100.
  share: number;
  accent: Accent;
  // Optional hover detail (e.g. "2 goals") and a route to drill into.
  detail?: string;
  target?: string;
}

export interface TrendSeries {
  title: string;
  sub: string;
  points: number[];
  labels: string[];
}

export interface CategoryBar {
  label: string;
  valueLabel: string;
  // 0 to 100.
  heightPct: number;
  accent: Accent;
  // Optional hover detail and a route to drill into.
  detail?: string;
  target?: string;
}

export interface Dashboard {
  banner: {
    kicker: string;
    title: string;
    subtitle: string;
    cta: string;
    daysLeft: number | null;
    target: string;
  };
  kpis: Kpi[];
  statusDonut: { title: string; segments: DonutSegment[] };
  trend: TrendSeries;
  categoryBars: { title: string; bars: CategoryBar[] };
  list: {
    title: string;
    linkLabel: string;
    target: string;
    rows: {
      id: string;
      avatarUserId: string | null;
      chip: GoalCategory | null;
      title: string;
      meta: string;
      status: string;
      statusTone: StatusTone;
      accent: Accent;
    }[];
  };
  side: {
    title: string;
    rows: {
      label: string;
      count: string;
      // 0 to 100.
      pct: number;
      accent: Accent;
      target?: string;
    }[];
  };
  promo: {
    title: string;
    subtitle: string;
    cta: string;
    target: string;
  };
}
