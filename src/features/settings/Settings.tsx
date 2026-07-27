import { useState } from 'react';
import { useAuth } from '@/auth/authProvider';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/icons/Icon';
import { ProfileTab } from './ProfileTab';
import { HrConfig } from './HrConfig';
import styles from './Settings.module.css';

type Tab = 'profile' | 'config' | 'notifications';

interface NotificationPref {
  id: string;
  label: string;
  desc: string;
  on: boolean;
}

// Everyday roles hear about their own goals, feedback and meetings.
const basePrefs: NotificationPref[] = [
  { id: 'goal-status', label: 'Goal returned or approved', desc: 'When a manager approves or returns your goals.', on: true },
  { id: 'peer-feedback', label: 'Peer feedback requests', desc: 'When a colleague asks you for feedback.', on: true },
  { id: 'review-meetings', label: 'Upcoming review meetings', desc: 'Reminders before a scheduled review.', on: true },
  { id: 'deadline', label: 'Cycle deadline reminders', desc: 'Before each phase of the cycle closes.', on: true },
  { id: 'digest', label: 'Weekly digest email', desc: 'A Monday summary of what needs your attention.', on: false },
];

// People Team and admins are tuned to skip routine noise and surface exceptions.
const hrPrefs: NotificationPref[] = [
  { id: 'goal-status', label: 'Goal returned or approved', desc: 'Individual goal decisions across the org.', on: false },
  { id: 'escalations', label: 'Escalations & overdue submissions', desc: 'When submissions slip past their SLA.', on: true },
  { id: 'org-digest', label: 'Weekly org digest', desc: 'Cycle progress across every department.', on: true },
  { id: 'individual-alerts', label: 'Individual submission alerts', desc: 'Every single goal submission as it lands.', on: false },
  { id: 'system-audit', label: 'System & audit alerts', desc: 'Access exceptions and configuration changes.', on: true },
];

export function Settings() {
  const { user, role } = useAuth();
  const canConfigure = role === 'people_team' || role === 'admin';
  const [tab, setTab] = useState<Tab>('profile');
  const notificationPrefs = canConfigure ? hrPrefs : basePrefs;
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationPrefs.map((pref) => [pref.id, pref.on])),
  );

  if (!user) return <ViewSkeleton />;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    ...(canConfigure ? [{ id: 'config' as Tab, label: 'HR configuration' }] : []),
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.tabs}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.tab}
            data-on={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab user={user} />}
      {tab === 'config' && canConfigure && <HrConfig />}
      {tab === 'notifications' && (
        <div style={{ maxWidth: 640 }}>
          {canConfigure && (
            <div className={styles.note} style={{ marginBottom: 16 }}>
              <Icon name="lock" size={18} />
              <span>
                Administrators manage accounts and configuration only. They <strong>cannot</strong>{' '}
                view your goals, comments or ratings. Any exception is logged and requires two
                approvers.
              </span>
            </div>
          )}
          <div className={`card ${styles.card}`}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, marginBottom: 4 }}>
              Notification preferences
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Choose what reaches you in-app and by email. HR roles are tuned to skip routine noise
              by default.
            </div>
            {notificationPrefs.map((pref) => (
              <div
                key={pref.id}
                className={styles.rowCard}
                style={{ padding: '14px 0', margin: 0, borderBottom: '1px solid var(--border)' }}
              >
                <div className={styles.rowBody}>
                  <div className={styles.rowName}>{pref.label}</div>
                  <div className={styles.rowDesc}>{pref.desc}</div>
                </div>
                <button
                  type="button"
                  className={styles.switch}
                  data-on={prefs[pref.id]}
                  onClick={() => setPrefs((prev) => ({ ...prev, [pref.id]: !prev[pref.id] }))}
                  aria-label={`Toggle ${pref.label}`}
                >
                  <span className={styles.switchKnob} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
