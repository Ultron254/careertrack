import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './States.module.css';

// Errors say what failed and what to do next, in plain words.
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.block}>
      <div className={styles.title}>This did not load</div>
      <p className={styles.body}>
        {message ?? 'Something interrupted this request. Check your connection and try again.'}
      </p>
      {onRetry && (
        <Button variant="surface" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={`oxy-wash-soft ${styles.block}`}>
      <div className={styles.title}>{title}</div>
      <p className={styles.body}>{body}</p>
      {action}
    </div>
  );
}
