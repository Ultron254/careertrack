import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { router } from '@/Lib/router';
import type { Notification } from '@/Types/domain';
import { notificationLook } from './notificationLook';
import styles from './NotificationsMenu.module.css';

export interface NotificationsMenuProps {
  notifications: Notification[];
  onClose: () => void;
}

// The desktop notifications dropdown. The mobile experience is a full screen
// route (NotificationsScreen); the shell hands both the same rows.
export function NotificationsMenu({ notifications, onClose }: NotificationsMenuProps) {
  const [markingAll, setMarkingAll] = useState(false);

  const markAllRead = () => {
    setMarkingAll(true);
    void router.post('/notifications/read-all', {}, { onFinish: () => setMarkingAll(false) });
  };

  const open = (link: string) => {
    onClose();
    router.visit(link);
  };

  return (
    <div className={styles.menu} role="dialog" aria-label="Notifications">
      <div className={styles.head}>
        <h2 className={styles.title}>Notifications</h2>
        <button
          type="button"
          className={styles.markAll}
          onClick={markAllRead}
          disabled={markingAll}
        >
          Mark all read
        </button>
      </div>
      <div className={styles.list}>
        {notifications.map((n) => {
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
        {notifications.length === 0 && (
          <p className={styles.empty}>You are all caught up. New activity will appear here.</p>
        )}
      </div>
      <button type="button" className={styles.footer} onClick={() => open('/settings')}>
        Notification settings
      </button>
    </div>
  );
}
