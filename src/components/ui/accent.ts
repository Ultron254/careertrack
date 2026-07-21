import type { Accent, StatusTone, Tone } from '@/api/schemas/dashboard';
import type { GoalCategory, GoalStatus, Rating } from '@/types/domain';

// Central place where wire-level accent and tone names become CSS custom
// properties. Colours themselves live only in tokens.css.

export const accentColour: Record<Accent, string> = {
  teal: 'var(--teal)',
  blue: 'var(--blue)',
  orange: 'var(--orange)',
  gold: 'var(--gold)',
  ink: 'var(--ink)',
};

export const categoryColour: Record<GoalCategory, string> = {
  Client: 'var(--cat-client)',
  Company: 'var(--cat-company)',
  People: 'var(--cat-people)',
  Financial: 'var(--cat-financial)',
};

export const categoryTint: Record<GoalCategory, string> = {
  Client: 'var(--tint-client)',
  Company: 'var(--tint-company)',
  People: 'var(--tint-people)',
  Financial: 'var(--tint-financial)',
};

export const categoryGradient: Record<GoalCategory, string> = {
  Client: 'var(--grad-client)',
  Company: 'var(--grad-company)',
  People: 'var(--grad-people)',
  Financial: 'var(--grad-financial)',
};

export const statusTone: Record<GoalStatus, StatusTone> = {
  Draft: 'neutral',
  Submitted: 'submitted',
  'Under Review': 'review',
  Approved: 'approved',
  Returned: 'returned',
};

export const toneColour: Record<Tone, string> = {
  positive: 'var(--status-approved-fg)',
  negative: 'var(--status-returned-fg)',
  caution: 'var(--status-review-fg)',
  info: 'var(--blue)',
  muted: 'var(--text-muted)',
};

export const ratingColour: Record<Rating, string> = {
  1: 'var(--rating-1)',
  2: 'var(--rating-2)',
  3: 'var(--rating-3)',
  4: 'var(--rating-4)',
};

export const ratingLabels: Record<Rating, string> = {
  1: 'Does not meet',
  2: 'Meets',
  3: 'Exceeds',
  4: 'Exceptional',
};
