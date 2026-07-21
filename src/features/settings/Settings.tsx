import { useState } from 'react';
import { useAuth } from '@/auth/authProvider';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/icons/Icon';
import { ProfileTab } from './ProfileTab';
import { HrConfig } from './HrConfig';
import styles from './Settings.module.css';

type Tab = 'profile' | 'config' | 'notifications';

const notificationPrefs = [
  { id: 'goal-review', label: 'Goal review updates', desc: 'When a manager approves or returns your goals.' },
  { id: 'feedback', label: 'Feedback requests', desc: 'When a colleague asks you for feedback.' },
  { id: 'reminders', label: 'Cycle reminders', desc: 'Deadline reminders before each phase closes.' },
  { id: 'mentions', label: 'Comments and mentions', desc: 'When someone replies on one of your goals.' },
  { id: 'digest', label: 'Weekly digest', desc: 'A Monday summary of what needs your attention.' },
];

export function Settings() {
  const { user, role } = useAuth();
  const canConfigure = role === 'people_team' || role === 'admin';
  const [tab, setTab] = useState<Tab>('profile');
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationPrefs.map((p) => [p.id, p.id !== 'digest'])),
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
        <div className={`card ${styles.card}`} style={{ maxWidth: 640 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, marginBottom: 4 }}>
            Notification preferences
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Choose what reaches you in app and by email.
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
          {role === 'admin' && (
            <div className={styles.note} style={{ marginTop: 18 }}>
              <Icon name="lock" size={18} />
              <span>
                Administrators manage accounts and configuration only. They cannot view goals,
                comments or ratings.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
