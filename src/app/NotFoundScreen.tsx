import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/icons/Icon';
import styles from './StatusScreen.module.css';

export function NotFoundScreen() {
  const navigate = useNavigate();
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
      <Button onClick={() => navigate('/')}>Back to dashboard</Button>
    </div>
  );
}
