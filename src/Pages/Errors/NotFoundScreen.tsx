import { Button } from '@/Components/ui/Button';
import { Icon } from '@/Components/icons/Icon';
import { router } from '@/Lib/router';
import styles from './StatusScreen.module.css';

export function NotFoundScreen() {
  return (
    <div className={styles.wrap}>
      <span className={styles.glyph}>
        <Icon name="search" size={30} />
      </span>
      <div className={styles.code}>404</div>
      <h2 className={styles.title}>We could not find that page</h2>
      <p className={styles.body}>
        The link may be old or the page may have moved. Head back to your dashboard to carry on.
      </p>
      <Button onClick={() => router.visit('/')}>Back to dashboard</Button>
    </div>
  );
}
