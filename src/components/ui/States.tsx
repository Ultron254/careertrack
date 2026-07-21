import type { ReactNode } from 'react';
import { ApiError } from '@/api/client';
import { Button } from './Button';
import styles from './States.module.css';

// Errors say what failed and what to do next, in plain words. Zod validation
// failures already carry a field level message from the client.
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError
      ? error.message
      : 'Something interrupted this request. Check your connection and try again.';
  return (
    <div className={styles.block}>
      <div className={styles.title}>This did not load</div>
      <p className={styles.body}>{message}</p>
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
    <div className={styles.block}>
      <div className={styles.title}>{title}</div>
      <p className={styles.body}>{body}</p>
      {action}
    </div>
  );
}
