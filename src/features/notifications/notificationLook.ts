import type { NotificationKind } from '@/types/domain';

// Each notification kind carries its own glyph and colour pair, matching the
// coloured tiles in the design's notifications list.
interface Look {
  emoji: string;
  bg: string;
  fg: string;
}

export const notificationLook: Record<NotificationKind, Look> = {
  goal_returned: { emoji: '\u21A9', bg: 'var(--status-returned-bg)', fg: 'var(--status-returned-fg)' },
  goal_approved: { emoji: '\u2713', bg: 'var(--status-approved-bg)', fg: 'var(--status-approved-fg)' },
  feedback_requested: { emoji: '\uD83D\uDCAC', bg: 'var(--status-submitted-bg)', fg: 'var(--status-submitted-fg)' },
  meeting_reminder: { emoji: '\uD83D\uDCC5', bg: 'var(--status-review-bg)', fg: 'var(--status-review-fg)' },
  system: { emoji: '\u2699', bg: 'var(--status-neutral-bg)', fg: 'var(--status-neutral-fg)' },
};
