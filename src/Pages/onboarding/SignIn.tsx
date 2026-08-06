import { useAuth } from '@/Context/AuthContext';
import { Icon } from '@/Components/icons/Icon';
import { LogoMark, OxygeneMark } from '@/Components/ui/Logo';
import styles from './SignIn.module.css';

export function SignIn() {
  const { signIn } = useAuth();

  return (
    <div className={styles.gate}>
      <div className={`${styles.brandPanel} oxy-wash grain`}>
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
            Set goals, get feedback and grow. Welcoming, structured and pressure-free.
          </p>
        </div>
        <div
          className={styles.illustration}
          style={{ backgroundImage: "url('/illustrations/sign-in.svg')" }}
        />
        <div className={styles.brandFootnote}>
          <OxygeneMark size={15} tone="var(--surface)" />
          <span>An Oxygene product</span>
        </div>
      </div>
      <div className={`${styles.formPanel} oxy-wash-soft`}>
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
