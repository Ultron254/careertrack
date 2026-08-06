import { Button } from '@/Components/ui/Button';
import { Icon } from '@/Components/icons/Icon';
import { router } from '@/Lib/router';
import styles from './StatusScreen.module.css';

export function ForbiddenScreen() {
  return (
    <div className={styles.wrap}>
      <span className={styles.glyph}>
        <Icon name="lock" size={30} />
      </span>
      <div className={styles.code}>403</div>
      <h2 className={styles.title}>This area is out of scope for your role</h2>
      <p className={styles.body}>
        Your role does not include this screen. If you need access, ask the People Team to review
        your permissions.
      </p>
      <Button onClick={() => router.visit('/')}>Back to dashboard</Button>
    </div>
  );
}
