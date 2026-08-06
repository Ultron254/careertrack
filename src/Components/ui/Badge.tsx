import clsx from 'clsx';
import type { StatusTone } from '@/Types/dashboard';
import type { GoalCategory, GoalStatus } from '@/Types/domain';
import { categoryColour, categoryTint, statusTone } from './accent';
import styles from './Badge.module.css';

interface StatusBadgeProps {
  status: GoalStatus | string;
  tone?: StatusTone;
  dot?: boolean;
}

// Renders the coloured status pill used across every list in the product.
// Known GoalStatus values pick their tone automatically.
export function StatusBadge({ status, tone, dot = true }: StatusBadgeProps) {
  const resolved = tone ?? statusTone[status as GoalStatus] ?? 'neutral';
  return (
    <span className={clsx(styles.badge, styles[resolved])}>
      {dot && <span className={styles.dot} />}
      {status}
    </span>
  );
}

export function CategoryChip({ category }: { category: GoalCategory }) {
  return (
    <span
      className={styles.chip}
      style={{ background: categoryTint[category], color: categoryColour[category] }}
    >
      <span className={styles.chipDot} />
      {category}
    </span>
  );
}
