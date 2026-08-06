import clsx from 'clsx';
import { OxygeneMark } from './Logo';
import styles from './BrandWatermark.module.css';

interface BrandWatermarkProps {
  className?: string;
  /** Light surfaces use ink; dark banners use white. */
  tone?: 'light' | 'dark';
}

// A quiet Oxygene lockup for hero corners. Purely decorative — the real brand
// signal is the doodle wash behind it.
export function BrandWatermark({ className, tone = 'dark' }: BrandWatermarkProps) {
  const colour = tone === 'dark' ? 'var(--surface)' : 'var(--ink)';
  return (
    <span className={clsx(styles.mark, className)} data-tone={tone} aria-hidden="true">
      <OxygeneMark size={16} tone={colour} />
      <span className={styles.word}>Oxygene</span>
    </span>
  );
}
