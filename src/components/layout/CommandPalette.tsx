import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/api/queries/org';
import { useAuth } from '@/auth/authProvider';
import { routeAccess, screens, sidebarOrder } from '@/auth/roles';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/iconPaths';
import { useFocusTrap } from '@/components/ui/useFocusTrap';
import styles from './CommandPalette.module.css';

interface Command {
  id: string;
  title: string;
  sub: string;
  kind: 'Screen' | 'Person' | 'Action';
  icon: IconName;
  accent: string;
  to: string;
}

const quickActions: { title: string; icon: IconName; to: string }[] = [
  { title: 'Set or edit goals', icon: 'goal', to: '/goals/setup' },
  { title: 'Request peer feedback', icon: 'chat', to: '/feedback' },
  { title: 'Start self appraisal', icon: 'doc', to: '/appraisals' },
  { title: 'Schedule a meeting', icon: 'cal', to: '/calendar' },
  { title: 'Export a report', icon: 'chart', to: '/reports' },
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { role } = useAuth();
  const { data: users } = useUsers();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const containerRef = useFocusTrap<HTMLDivElement>(true, onClose);

  const commands = useMemo<Command[]>(() => {
    const allowed = routeAccess[role];
    const screenCommands: Command[] = sidebarOrder[role].map((key) => ({
      id: `screen-${key}`,
      title: screens[key].label,
      sub: `Go to ${screens[key].label}`,
      kind: 'Screen',
      icon: screens[key].icon,
      accent: 'var(--orange)',
      to: screens[key].path,
    }));

    const actionCommands: Command[] = quickActions
      .filter((action) => allowed.some((path) => action.to.startsWith(path) && path !== '/'))
      .map((action) => ({
        id: `action-${action.to}`,
        title: action.title,
        sub: 'Action',
        kind: 'Action',
        icon: action.icon,
        accent: 'var(--teal)',
        to: action.to,
      }));

    const canOpenPeople = allowed.includes('/people/:userId');
    const peopleCommands: Command[] = canOpenPeople
      ? (users ?? []).map((u) => ({
          id: `person-${u.id}`,
          title: u.name,
          sub: u.jobTitle,
          kind: 'Person',
          icon: 'user',
          accent: 'var(--blue)',
          to: `/people/${u.id}`,
        }))
      : [];

    return [...screenCommands, ...actionCommands, ...peopleCommands];
  }, [role, users]);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? commands.filter((c) => (c.title + ' ' + c.sub).toLowerCase().includes(trimmed))
    : commands.slice(0, 8);

  const run = (to: string) => {
    onClose();
    navigate(to);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (results[0]) run(results[0].to);
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={containerRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <form className={styles.searchRow} onSubmit={onSubmit}>
          <Icon name="search" size={20} />
          <input
            autoFocus
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search screens, people, actions"
            aria-label="Search screens, people and actions"
          />
          <span className={styles.esc}>ESC</span>
        </form>
        <div className={styles.results}>
          {results.map((c) => (
            <button key={c.id} type="button" className={styles.result} onClick={() => run(c.to)}>
              <span className={styles.resultIcon} style={{ color: c.accent }}>
                {c.kind === 'Person' ? (
                  <Avatar userId={c.id} name={c.title} size={28} />
                ) : (
                  <Icon name={c.icon} size={18} />
                )}
              </span>
              <span className={styles.resultText}>
                <span className={styles.resultTitle}>{c.title}</span>
                <span className={styles.resultSub}>{c.sub}</span>
              </span>
              <span className={styles.resultKind}>{c.kind}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className={styles.empty}>No matches for &quot;{query}&quot;</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
