import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/Context/AuthContext';
import { usePage } from '@/Context/SharedPropsContext';
import { pageMetaFor } from '@/Constants/pageMeta';
import { EmployeeGuide } from '@/Pages/onboarding/EmployeeGuide';
import { GuidedTour } from '@/Pages/onboarding/GuidedTour';
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
  const [guideOpen, setGuideOpen] = useState(false);

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

  const pendingReviews = usePage().props.nav.pendingReviews;
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

      {/* For employees the help button opens the guide, which in turn can hand
          off to the guided tour. Other roles go straight to the tour. */}
      <button
        type="button"
        className={styles.tourButton}
        title={role === 'employee' ? 'Open the employee guide' : 'Take a tour'}
        aria-label={role === 'employee' ? 'Open the employee guide' : 'Take a tour'}
        onClick={() => (role === 'employee' ? setGuideOpen(true) : setTourRunning(true))}
      >
        ?
      </button>
      {guideOpen && (
        <EmployeeGuide
          onClose={() => setGuideOpen(false)}
          onStartTour={() => {
            setGuideOpen(false);
            setTourRunning(true);
          }}
        />
      )}
      {tourRunning && (
        <GuidedTour
          onExpandSidebar={() => setCollapsed(false)}
          onFinish={() => setTourRunning(false)}
        />
      )}
    </div>
  );
}
