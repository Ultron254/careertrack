import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { useAuth } from '@/Context/AuthContext';
import { AppProviders } from '@/Context/AppProviders';
import { router } from '@/Lib/routes';
import { OnboardingCarousel, SignIn, Splash } from '@/Pages/onboarding';
import '@/Styles/tailwind.css';
import '@/Styles/global.css';

// Entry point. Inside Laravel this file becomes resources/js/app.tsx and the
// gate below dissolves: Inertia renders the page the server chose, and
// authentication redirects happen in middleware before React ever mounts.

const ONBOARDED_KEY = 'careertrack.onboarded';
const AUTOTOUR_KEY = 'careertrack.autotour';

function AppGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === '1');

  if (isLoading) return <Splash />;
  if (!isAuthenticated) return <SignIn />;

  if (!onboarded) {
    return (
      <OnboardingCarousel
        onDone={() => {
          localStorage.setItem(ONBOARDED_KEY, '1');
          // The shell reads this once to auto start the guided tour.
          sessionStorage.setItem(AUTOTOUR_KEY, '1');
          setOnboarded(true);
        }}
      />
    );
  }

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <AppProviders>
      <AppGate />
    </AppProviders>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
