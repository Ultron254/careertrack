import { useCallback, useLayoutEffect, useState } from 'react';
import { useAuth } from '@/Context/AuthContext';
import { Icon } from '@/Components/icons/Icon';
import type { IconName } from '@/Components/icons/iconPaths';
import type { Role } from '@/Types/domain';
import styles from './GuidedTour.module.css';

interface TourStep {
  target: string;
  icon: IconName;
  title: string;
  body: string;
}

// Steps differ per role, taken from the design. Each target maps to a
// data-tour attribute rendered by the shell chrome.
const tourByRole: Record<Role, TourStep[]> = {
  employee: [
    {
      target: 'dashboard',
      icon: 'dashboard',
      title: 'Your dashboard',
      body: 'Your at a glance home for KPIs, charts and what needs attention this cycle.',
    },
    {
      target: 'goals',
      icon: 'goal',
      title: 'Set your goals',
      body: 'A step by step form across all four categories. Save drafts, add private notes, submit when complete.',
    },
    {
      target: 'feedback',
      icon: 'chat',
      title: 'Peer feedback',
      body: 'Request input from any colleague and give it back. It enriches your appraisal.',
    },
    {
      target: 'reports',
      icon: 'chart',
      title: 'Reports and analytics',
      body: 'Visual data tailored to your role. Save views and schedule exports as PDF or Excel.',
    },
    {
      target: 'search',
      icon: 'search',
      title: 'Quick search',
      body: 'Jump to any screen, person or action instantly from anywhere. Press Cmd or Ctrl plus K.',
    },
    {
      target: 'notifications',
      icon: 'bell',
      title: 'Stay in the loop',
      body: 'In app and email nudges for reviews, feedback and cycle deadlines.',
    },
  ],
  manager: [
    {
      target: 'dashboard',
      icon: 'dashboard',
      title: 'Your dashboard',
      body: 'Track pending reviews, team ratings and appraisal progress in one place.',
    },
    {
      target: 'reviews',
      icon: 'team',
      title: 'Review your team',
      body: 'Approve or return submissions with comments, and use bulk actions to clear your queue fast.',
    },
    {
      target: 'feedback',
      icon: 'chat',
      title: 'Peer feedback',
      body: 'Request input from any colleague and give it back. It enriches every appraisal.',
    },
    {
      target: 'reports',
      icon: 'chart',
      title: 'Reports and analytics',
      body: 'Visual data tailored to your role. Save views and schedule exports as PDF or Excel.',
    },
    {
      target: 'search',
      icon: 'search',
      title: 'Quick search',
      body: 'Jump to any screen, person or action instantly. Press Cmd or Ctrl plus K.',
    },
    {
      target: 'notifications',
      icon: 'bell',
      title: 'Stay in the loop',
      body: 'In app and email nudges for reviews, feedback and cycle deadlines.',
    },
  ],
  people_team: [
    {
      target: 'dashboard',
      icon: 'dashboard',
      title: 'Your dashboard',
      body: 'Org wide submission rates, review SLAs and the return loop, all live.',
    },
    {
      target: 'people',
      icon: 'team',
      title: 'People directory',
      body: 'Everyone by department, with cycle status and a path into each profile.',
    },
    {
      target: 'settings',
      icon: 'gear',
      title: 'Configure the cycle',
      body: 'Tailor categories, weightings, reminders and escalation rules for the whole org.',
    },
    {
      target: 'reports',
      icon: 'chart',
      title: 'Reports and analytics',
      body: 'Org level analysis with saved views and scheduled exports.',
    },
    {
      target: 'search',
      icon: 'search',
      title: 'Quick search',
      body: 'Jump to any screen, person or action instantly. Press Cmd or Ctrl plus K.',
    },
    {
      target: 'notifications',
      icon: 'bell',
      title: 'Stay in the loop',
      body: 'Escalations, overdue submissions and cycle milestones reach you here.',
    },
  ],
  admin: [
    {
      target: 'dashboard',
      icon: 'dashboard',
      title: 'Your dashboard',
      body: 'System health, users and org structure at a glance.',
    },
    {
      target: 'settings',
      icon: 'gear',
      title: 'System configuration',
      body: 'Manage categories, the cycle, reminders and escalation rules.',
    },
    {
      target: 'reports',
      icon: 'chart',
      title: 'Reports and analytics',
      body: 'Usage and adoption data across the organisation.',
    },
    {
      target: 'search',
      icon: 'search',
      title: 'Quick search',
      body: 'Jump to any screen, person or action instantly. Press Cmd or Ctrl plus K.',
    },
    {
      target: 'notifications',
      icon: 'bell',
      title: 'Stay in the loop',
      body: 'System and audit alerts arrive here.',
    },
  ],
};

interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface GuidedTourProps {
  onExpandSidebar: () => void;
  onFinish: () => void;
}

export function GuidedTour({ onExpandSidebar, onFinish }: GuidedTourProps) {
  const { role } = useAuth();
  const steps = tourByRole[role];
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[index];

  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    });
  }, [step.target]);

  useLayoutEffect(() => {
    onExpandSidebar();
    // Wait a frame so the sidebar has finished expanding before measuring.
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [measure, onExpandSidebar]);

  const next = () => {
    if (index >= steps.length - 1) onFinish();
    else setIndex((value) => value + 1);
  };

  if (!rect) {
    // Target not on screen; skip rather than trap the user.
    return null;
  }

  const inSidebar = rect.left < 250;
  const tip = {
    top: inSidebar ? Math.max(12, rect.top - 6) : rect.bottom + 14,
    left: inSidebar
      ? rect.right + 18
      : Math.max(12, Math.min(rect.right - 300, window.innerWidth - 316)),
  };

  return (
    <div className={styles.layer}>
      <div
        className={styles.spotlight}
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
      />
      <div
        className={styles.tip}
        style={{ top: tip.top, left: tip.left }}
        role="dialog"
        aria-label={step.title}
      >
        <div className={styles.tipHead}>
          <span className={styles.tipIcon}>
            <Icon name={step.icon} size={16} />
          </span>
          <span className={styles.tipTitle}>{step.title}</span>
        </div>
        <p className={styles.tipBody}>{step.body}</p>
        <div className={styles.tipFoot}>
          <span className={styles.counter}>
            {index + 1} of {steps.length}
          </span>
          <button type="button" className={styles.skip} onClick={onFinish}>
            Skip
          </button>
          <button type="button" className={styles.next} onClick={next}>
            {index === steps.length - 1 ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
