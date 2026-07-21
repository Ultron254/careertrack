import clsx from 'clsx';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/authProvider';
import { mobileTabs } from '@/auth/roles';
import { Icon } from '@/components/icons/Icon';
import styles from './TabBar.module.css';

export function TabBar() {
  const { role } = useAuth();
  const tabs = mobileTabs[role];

  return (
    <nav className={styles.bar} aria-label="Primary">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path + tab.label}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) => clsx(styles.tab, isActive && styles.tabActive)}
        >
          <Icon name={tab.icon} size={22} />
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
