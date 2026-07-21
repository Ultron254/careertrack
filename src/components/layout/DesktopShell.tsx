import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useReviewQueue } from '@/api/queries/reviews';
import { useAuth } from '@/auth/authProvider';
import { pageMetaFor } from '@/app/pageMeta';
import { GuidedTour } from '@/features/onboarding/GuidedTour';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useMediaQuery } from './useMediaQuery';
import styles from './DesktopShell.module.css';

export function DesktopShell() {
  const location = useLocation();
  const { role } = useAuth();
  // Between 900 and 1200 the sidebar starts collapsed to protect content width.
  const compact = useMediaQuery('(max-width: 1200px)');
  const [collapsed, setCollapsed] = useState(compact);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);

  useEffect(() => setCollapsed(compact), [compact]);

  // Onboarding hands off to the tour once, through a session flag.
  useEffect(() => {
    if (sessionStorage.getItem('careertrack.autotour') === '1') {
      sessionStorage.removeItem('careertrack.autotour');
      const timer = window.setTimeout(() => setTourRunning(true), 400);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const reviewQueue = useReviewQueue();
  const pendingReviews = role === 'manager' ? (reviewQueue.data?.length ?? 0) : 0;
  const { title, sub } = pageMetaFor(location.pathname);

  return (
    <div className={styles.frame}>
      <Sidebar collapsed={collapsed} pendingReviews={pendingReviews} />
      <div className={styles.main}>
        <TopBar
          title={title}
          sub={sub}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <div className={`${styles.content} scroll`}>
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </div>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      <button
        type="button"
        className={styles.tourButton}
        title="Take a tour"
        onClick={() => setTourRunning(true)}
      >
        ?
      </button>
      {tourRunning && (
        <GuidedTour
          onExpandSidebar={() => setCollapsed(false)}
          onFinish={() => setTourRunning(false)}
        />
      )}
    </div>
  );
}
