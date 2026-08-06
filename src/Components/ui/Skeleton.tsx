import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  height: number | string;
  width?: number | string;
  radius?: number;
  style?: CSSProperties;
}

export function Skeleton({ height, width, radius, style }: SkeletonProps) {
  return (
    <div
      className={styles.skeleton}
      style={{ height, width, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

// The standard loading arrangement between view transitions: one banner
// shaped block and a grid of card shaped ones.
export function ViewSkeleton() {
  return (
    <div style={{ padding: '24px 28px' }}>
      <Skeleton height={96} radius={20} style={{ marginBottom: 16 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={150} />
        ))}
      </div>
    </div>
  );
}
