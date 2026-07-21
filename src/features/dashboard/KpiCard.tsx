import type { Kpi } from '@/api/schemas/dashboard';
import { Card } from '@/components/ui/Card';
import { accentColour, toneColour } from '@/components/ui/accent';
import styles from './KpiCard.module.css';

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card className={styles.card}>
      <div className={styles.label}>{kpi.label}</div>
      <div className={styles.valueRow}>
        <div className={styles.value} style={{ color: accentColour[kpi.accent] }}>
          {kpi.value}
        </div>
        {kpi.delta && (
          <span className={styles.delta} style={{ color: toneColour[kpi.deltaTone] }}>
            {kpi.delta}
          </span>
        )}
      </div>
      <div className={styles.sub}>{kpi.sub}</div>
    </Card>
  );
}
