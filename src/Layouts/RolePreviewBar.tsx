import clsx from 'clsx';
import { useRolePreview } from '@/Context/AuthContext';
import { roleLabels } from '@/Constants/navigation';
import type { Role } from '@/Types/domain';
import styles from './RolePreviewBar.module.css';

// Development affordance only. In production the role comes from the Entra ID
// token, so this control is gated behind VITE_ENABLE_ROLE_PREVIEW (false in
// .env.production). When the backend is wired and the preview is no longer
// needed, delete this file and the two places that render it (Sidebar and
// MobileShell). Nothing else depends on it.

const previewRoles: { role: Role; short: string }[] = [
  { role: 'employee', short: 'Emp' },
  { role: 'manager', short: 'Mgr' },
  { role: 'people_team', short: 'PT' },
  { role: 'admin', short: 'Admin' },
];

interface RolePreviewBarProps {
  placement: 'sidebar' | 'strip';
}

export function RolePreviewBar({ placement }: RolePreviewBarProps) {
  const preview = useRolePreview();
  const enabled = import.meta.env.VITE_ENABLE_ROLE_PREVIEW === 'true';

  if (!enabled || !preview) return null;

  const pills = (
    <div className={styles.pills}>
      {previewRoles.map(({ role, short }) => (
        <button
          key={role}
          type="button"
          className={clsx(styles.pill, preview.role === role && styles.pillActive)}
          onClick={() => preview.setRole(role)}
          title={roleLabels[role]}
        >
          {placement === 'sidebar' ? short : roleLabels[role]}
        </button>
      ))}
    </div>
  );

  if (placement === 'strip') {
    return (
      <div className={styles.strip}>
        <span className={styles.stripLabel}>Demo, view as</span>
        {pills}
      </div>
    );
  }

  return (
    <>
      <div className={styles.heading}>Demo, view as</div>
      {pills}
    </>
  );
}
