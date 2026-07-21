import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useMarkAllNotificationsRead, useNotifications } from '@/api/queries/notifications';
import { Skeleton } from '@/components/ui/Skeleton';
import { notificationLook } from './notificationLook';
import styles from './NotificationsMenu.module.css';

interface NotificationsMenuProps {
  onClose: () => void;
}

// The desktop notifications dropdown. The mobile experience is a full screen
// route (NotificationsScreen); both read the same query.
export function NotificationsMenu({ onClose }: NotificationsMenuProps) {
  const navigate = useNavigate();
  const { data: notifications, isPending } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const open = (link: string) => {
    onClose();
    navigate(link);
  };

  return (
    <div className={styles.menu} role="dialog" aria-label="Notifications">
      <div className={styles.head}>
        <h2 className={styles.title}>Notifications</h2>
        <button
          type="button"
          className={styles.markAll}
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          Mark all read
        </button>
      </div>
      <div className={styles.list}>
        {isPending &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.row}>
              <Skeleton height={34} width={34} radius={11} />
              <div style={{ flex: 1 }}>
                <Skeleton height={13} style={{ marginBottom: 6 }} />
                <Skeleton height={11} width="40%" />
              </div>
            </div>
          ))}
        {notifications?.map((n) => {
          const look = notificationLook[n.kind];
          return (
            <button key={n.id} type="button" className={styles.row} onClick={() => open(n.link)}>
              <span className={styles.icon} style={{ background: look.bg, color: look.fg }}>
                {look.emoji}
              </span>
              <span className={styles.body}>
                <span className={styles.bodyText}>{n.body}</span>
                <span className={styles.time}>
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </span>
              {!n.readAt && <span className={styles.dot} />}
            </button>
          );
        })}
        {notifications?.length === 0 && (
          <p className={styles.empty}>You are all caught up. New activity will appear here.</p>
        )}
      </div>
      <button type="button" className={styles.footer} onClick={() => open('/settings')}>
        Notification settings
      </button>
    </div>
  );
}
