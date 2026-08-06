import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/Context/AuthContext';
import { roleLabels } from '@/Constants/navigation';
import { Avatar } from '@/Components/ui/Avatar';
import { Icon } from '@/Components/icons/Icon';
import type { IconName } from '@/Components/icons/iconPaths';
import styles from './UserMenu.module.css';

interface UserMenuProps {
  onClose: () => void;
}

export function UserMenu({ onClose }: UserMenuProps) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const item = (icon: IconName, label: string, onClick: () => void, danger = false) => (
    <button type="button" className={styles.item} data-danger={danger} onClick={onClick}>
      <span className={styles.itemIcon}>
        <Icon name={icon} size={17} />
      </span>
      {label}
    </button>
  );

  return (
    <div className={styles.menu} role="menu" aria-label="Account">
      <div className={styles.header}>
        <Avatar userId={user.id} name={user.name} avatarUrl={user.avatarUrl} size={42} />
        <div className={styles.identity}>
          <div className={styles.name}>{user.name}</div>
          <div className={styles.role}>{roleLabels[role]}</div>
        </div>
      </div>
      <div className={styles.group}>
        {item('user', 'My profile', () => go('/settings'))}
        {item('gear', 'Settings', () => go('/settings'))}
        {item('help', 'Help and support', onClose)}
        <div className={styles.divider} />
        {item('logout', 'Log out', () => void signOut(), true)}
      </div>
    </div>
  );
}
