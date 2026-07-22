import { LogoMark, OxygeneMark } from '@/components/ui/Logo';
import styles from './Splash.module.css';

// Shown briefly on mobile while auth resolves, before onboarding or the app.
export function Splash() {
  return (
    <div className={`${styles.splash} oxy-plate-warm oxy-wash grain`}>
      <div className={styles.center}>
        <div className={styles.mark}>
          <LogoMark size={40} />
        </div>
        <div className={styles.name}>CareerTrack</div>
        <div className={styles.tagline}>Performance, the Oxygene way.</div>
      </div>
      <div className={styles.brandFooter}>
        <OxygeneMark size={15} tone="var(--surface)" />
        <span>
          An <strong>Oxygene</strong> product
        </span>
      </div>
    </div>
  );
}
