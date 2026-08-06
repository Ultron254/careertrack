import { useState } from 'react';
import { useAuth } from '@/Context/AuthContext';
import { usePage } from '@/Context/SharedPropsContext';
import { roleLabels } from '@/Constants/navigation';
import { Avatar } from '@/Components/ui/Avatar';
import { Icon } from '@/Components/icons/Icon';
import { NotificationsMenu } from '@/Pages/notifications/NotificationsMenu';
import { UserMenu } from './UserMenu';
import styles from './TopBar.module.css';

interface TopBarProps {
  title: string;
  sub: string;
  onToggleSidebar: () => void;
  onOpenPalette: () => void;
}

export function TopBar({ title, sub, onToggleSidebar, onOpenPalette }: TopBarProps) {
  const { user, role } = useAuth();
  const { notifications } = usePage().props.nav;
  const [open, setOpen] = useState<'notifications' | 'user' | null>(null);

  const hasUnread = notifications.some((n) => !n.readAt);
  const toggle = (menu: 'notifications' | 'user') =>
    setOpen((current) => (current === menu ? null : menu));

  return (
    <header className={styles.bar}>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onToggleSidebar}
        aria-label="Toggle menu"
      >
        <Icon name="menu" size={18} />
      </button>
      <div className={styles.heading}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.sub}>{sub}</div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.search} onClick={onOpenPalette} data-tour="search">
          <Icon name="search" size={16} />
          <span className={styles.searchLabel}>Search</span>
          <span className={styles.kbd}>{navigatorMeta()}K</span>
        </button>

        <div className={styles.popoverHost}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => toggle('notifications')}
            aria-label="Notifications"
            aria-expanded={open === 'notifications'}
            data-tour="notifications"
          >
            <Icon name="bell" size={19} />
            {hasUnread && <span className={styles.badge} />}
          </button>
          {open === 'notifications' && (
            <>
              <div className={styles.scrim} onClick={() => setOpen(null)} />
              <div className={styles.popover}>
                <NotificationsMenu notifications={notifications} onClose={() => setOpen(null)} />
              </div>
            </>
          )}
        </div>

        <div className={styles.popoverHost}>
          <button
            type="button"
            className={styles.profile}
            onClick={() => toggle('user')}
            aria-label="Account menu"
            aria-expanded={open === 'user'}
            data-tour="profile"
          >
            {user && (
              <Avatar userId={user.id} name={user.name} avatarUrl={user.avatarUrl} size={38} />
            )}
            <span className={styles.profileText}>
              <span className={styles.profileName}>{user?.name}</span>
              <span className={styles.profileRole}>{roleLabels[role]}</span>
            </span>
          </button>
          {open === 'user' && (
            <>
              <div className={styles.scrim} onClick={() => setOpen(null)} />
              <div className={styles.popover}>
                <UserMenu onClose={() => setOpen(null)} />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Shows the platform correct modifier hint in the search affordance.
function navigatorMeta() {
  if (typeof navigator === 'undefined') return 'Ctrl ';
  return /Mac|iPhone|iPad/.test(navigator.platform) ? '\u2318' : 'Ctrl ';
}
