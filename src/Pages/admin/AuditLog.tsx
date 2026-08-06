import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { AuditEvent } from '@/Types/domain';
import styles from './AuditLog.module.css';

type AuditAction = AuditEvent['action'];

const actionLabels: Record<AuditAction, string> = {
  account_invited: 'Invite sent',
  role_changed: 'Role changed',
  account_suspended: 'Suspended',
  account_reactivated: 'Reactivated',
  invite_resent: 'Invite re-sent',
  password_reset_sent: 'Password reset',
  config_updated: 'Configuration',
  appraisal_locked: 'Appraisal locked',
};

// Groups the fine-grained actions into the coloured dot families in the CSS.
const actionKind: Record<AuditAction, 'account' | 'security' | 'config' | 'appraisal'> = {
  account_invited: 'account',
  role_changed: 'account',
  invite_resent: 'account',
  account_suspended: 'security',
  account_reactivated: 'security',
  password_reset_sent: 'security',
  config_updated: 'config',
  appraisal_locked: 'appraisal',
};

export interface AuditLogProps {
  events: AuditEvent[];
}

export function AuditLog({ events }: AuditLogProps) {
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');

  const filtered =
    actionFilter === 'all' ? events : events.filter((event) => event.action === actionFilter);

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Audit log</h1>
          <p className={styles.subtitle}>
            Every provisioning, configuration and sign-off action, newest first. Entries are
            immutable and kept for compliance.
          </p>
        </div>
        <select
          className={styles.filter}
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value as AuditAction | 'all')}
          aria-label="Filter by action"
        >
          <option value="all">All actions</option>
          {(Object.keys(actionLabels) as AuditAction[]).map((action) => (
            <option key={action} value={action}>
              {actionLabels[action]}
            </option>
          ))}
        </select>
      </div>

      <div className={`card ${styles.listCard}`}>
        {filtered.map((event) => (
          <div key={event.id} className={styles.row}>
            <span className={styles.dot} data-kind={actionKind[event.action]} />
            <div className={styles.body}>
              <div className={styles.detail}>{event.detail}</div>
              <div className={styles.meta}>
                {event.actorName} · {formatDistanceToNow(new Date(event.at), { addSuffix: true })}
              </div>
            </div>
            <span className={styles.action}>{actionLabels[event.action]}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>No entries for this action yet.</div>
        )}
      </div>
    </div>
  );
}
