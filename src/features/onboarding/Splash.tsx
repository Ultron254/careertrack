import { LogoMark } from '@/components/ui/Logo';
import styles from './Splash.module.css';

// Shown briefly on mobile while auth resolves, before onboarding or the app.
export function Splash() {
  return (
    <div className={`${styles.splash} grain`}>
      <div className={styles.mark}>
        <LogoMark size={40} />
      </div>
      <div className={styles.name}>CareerTrack</div>
      <div className={styles.tagline}>Grow, together.</div>
    </div>
  );
}
