import { Skeleton } from '@/components/ui/Skeleton';
import styles from './Dashboard.module.css';

export function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      <Skeleton height={116} radius={24} style={{ marginBottom: 18 }} />
      <div className={styles.kpis}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={104} radius={20} />
        ))}
      </div>
      <div className={styles.charts}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={190} radius={20} />
        ))}
      </div>
      <div className={styles.bottom}>
        <Skeleton height={320} radius={20} />
        <Skeleton height={320} radius={20} />
      </div>
    </div>
  );
}
