import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/Context/AuthContext';
import { pageMetaFor } from '@/Constants/pageMeta';
import { Avatar } from '@/Components/ui/Avatar';
import { Icon } from '@/Components/icons/Icon';
import { CommandPalette } from './CommandPalette';
import { RolePreviewBar } from './RolePreviewBar';
import { TabBar } from './TabBar';
import { useOnlineStatus } from './useOnlineStatus';
import styles from './MobileShell.module.css';

export function MobileShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { title } = pageMetaFor(location.pathname);

  return (
    <div className={styles.shell}>
      <RolePreviewBar placement="strip" />
      {!online && (
        <div className={styles.offline} role="status">
          You are offline. Changes are paused until the connection returns.
        </div>
      )}
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
          >
            <Icon name="search" size={19} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
          >
            <Icon name="bell" size={19} />
          </button>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => navigate('/settings')}
            aria-label="Profile"
          >
            {user && (
              <Avatar userId={user.id} name={user.name} avatarUrl={user.avatarUrl} size={34} />
            )}
          </button>
        </div>
      </header>
      <main className={`${styles.content} scroll-hidden`}>
        <Outlet />
      </main>
      <TabBar />
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
