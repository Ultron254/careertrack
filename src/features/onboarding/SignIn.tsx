import { useAuth } from '@/auth/authProvider';
import { Icon } from '@/components/icons/Icon';
import { LogoMark, OxygeneMark } from '@/components/ui/Logo';
import styles from './SignIn.module.css';

export function SignIn() {
  const { signIn } = useAuth();

  return (
    <div className={styles.gate}>
      <div className={`${styles.brandPanel} grain`}>
        <div className={styles.brandRow}>
          <span className={styles.brandMark}>
            <LogoMark size={18} monochrome />
          </span>
          <span className={styles.brandWordmark}>
            CareerTrack
            <small>by Oxygene</small>
          </span>
        </div>
        <div className={styles.pitch}>
          <h2 className={styles.pitchTitle}>Career conversations, all in one place.</h2>
          <p className={styles.pitchBody}>
            Oxygene's home for goals, feedback and growth. Welcoming, structured and pressure free.
          </p>
        </div>
        <div
          className={styles.illustration}
          style={{ backgroundImage: "url('/illustrations/growth.svg')" }}
        />
        <div className={styles.brandFootnote}>
          <OxygeneMark size={15} tone="var(--surface)" />
          <span>An Oxygene product</span>
        </div>
      </div>
      <div className={styles.formPanel}>
        <div className={styles.form}>
          <h1 className={styles.welcome}>Welcome back</h1>
          <p className={styles.lede}>Sign in with your Oxygene work account to continue.</p>
          <button type="button" className={styles.msButton} onClick={() => void signIn()}>
            <svg width="19" height="19" viewBox="0 0 23 23" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="10" height="10" fill="#F25022" />
              <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
              <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
              <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </button>
          <div className={styles.divider}>
            <span className={styles.line} />
            <span className={styles.dividerLabel}>internal access only</span>
            <span className={styles.line} />
          </div>
          <div className={styles.note}>
            <Icon name="lock" size={16} />
            <span>
              Access is restricted to company members. Use your <strong>@oxygene.africa</strong>{' '}
              account. No passwords stored.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
