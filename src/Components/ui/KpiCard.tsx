import type { Kpi } from '@/Types/dashboard';
import { Card } from './Card';
import { accentColour, toneColour } from './accent';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  kpi: Kpi;
  onClick?: () => void;
  hint?: string;
}

export function KpiCard({ kpi, onClick, hint }: KpiCardProps) {
  const interactive = !!onClick;
  const tooltip = hint ?? `${kpi.label}: ${kpi.value} (${kpi.sub})`;
  return (
    <Card
      as={interactive ? 'button' : 'div'}
      className={styles.card}
      data-clickable={interactive || undefined}
      onClick={onClick}
      title={tooltip}
    >
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
      {interactive && (
        <span className={styles.cue} aria-hidden>
          View →
        </span>
      )}
    </Card>
  );
}
