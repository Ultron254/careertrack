import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/icons/Icon';
import styles from './StatusScreen.module.css';

export function ForbiddenScreen() {
  const navigate = useNavigate();
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
      <Button onClick={() => navigate('/')}>Back to dashboard</Button>
    </div>
  );
}
