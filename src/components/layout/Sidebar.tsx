import clsx from 'clsx';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/authProvider';
import { screens, sidebarOrder } from '@/auth/roles';
import { Icon } from '@/components/icons/Icon';
import { LogoMark } from '@/components/ui/Logo';
import { RolePreviewBar } from './RolePreviewBar';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  pendingReviews: number;
}

export function Sidebar({ collapsed, pendingReviews }: SidebarProps) {
  const { role } = useAuth();
  const items = sidebarOrder[role].map((key) => screens[key]);
  const labelStyle = { opacity: collapsed ? 0 : 1 };

  return (
    <nav className={styles.sidebar} style={{ width: collapsed ? 64 : 236 }} aria-label="Main">
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <LogoMark size={20} />
        </span>
        <span className={styles.brandName} style={labelStyle}>
          CareerTrack
        </span>
      </div>
      <div className={clsx(styles.nav, 'scroll')}>
        {items.map((screen) => (
          <NavLink
            key={screen.key}
            to={screen.path}
            end={screen.path === '/'}
            title={screen.label}
            data-tour={screen.key}
            className={({ isActive }) => clsx(styles.item, isActive && styles.itemActive)}
          >
            <span className={styles.itemIcon}>
              <Icon name={screen.icon} size={20} />
            </span>
            <span className={styles.itemLabel} style={labelStyle}>
              {screen.label}
            </span>
            {screen.key === 'reviews' && pendingReviews > 0 && (
              <span className={styles.badge} style={labelStyle}>
                {pendingReviews}
              </span>
            )}
          </NavLink>
        ))}
      </div>
      <div className={styles.footer} style={labelStyle}>
        <RolePreviewBar placement="sidebar" />
      </div>
    </nav>
  );
}
