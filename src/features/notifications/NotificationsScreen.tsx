import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/api/queries/notifications';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { SwipeRow } from '@/components/ui/SwipeRow';
import { useOnlineStatus } from '@/components/layout/useOnlineStatus';
import type { Notification } from '@/types/domain';
import { notificationLook } from './notificationLook';
import styles from './NotificationsScreen.module.css';

export function NotificationsScreen() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data: notifications, isPending, isError, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (isPending) return <ViewSkeleton />;
  if (isError || !notifications) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.readAt);
  const earlier = notifications.filter((n) => n.readAt);

  const renderRow = (n: Notification) => {
    const look = notificationLook[n.kind];
    const row = (
      <button
        type="button"
        className={styles.row}
        data-unread={!n.readAt}
        onClick={() => navigate(n.link)}
      >
        <span className={styles.icon} style={{ background: look.bg, color: look.fg }}>
          {look.emoji}
        </span>
        <span className={styles.body}>
          <span className={styles.rowTitle}>{n.title}</span>
          <span className={styles.rowText}>{n.body}</span>
          <span className={styles.time}>
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </span>
        </span>
        {!n.readAt && <span className={styles.dot} />}
      </button>
    );

    if (n.readAt) return <div key={n.id}>{row}</div>;

    return (
      <SwipeRow
        key={n.id}
        actions={[
          {
            label: 'Mark read',
            icon: 'check',
            onAction: () => markRead.mutate(n.id),
            disabled: !online,
          },
        ]}
      >
        {row}
      </SwipeRow>
    );
  };

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
        <button
          type="button"
          className={styles.markAll}
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || unread.length === 0}
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 && (
        <p className={styles.empty}>You are all caught up. New activity will appear here.</p>
      )}

      {unread.length > 0 && (
        <>
          <div className={styles.groupLabel}>New</div>
          <div className={styles.list}>{unread.map(renderRow)}</div>
        </>
      )}

      {earlier.length > 0 && (
        <>
          <div className={styles.groupLabel}>Earlier</div>
          <div className={styles.list}>{earlier.map(renderRow)}</div>
        </>
      )}
    </div>
  );
}
