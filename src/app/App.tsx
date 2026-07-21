import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuth } from '@/auth/authProvider';
import { OnboardingCarousel, SignIn, Splash } from '@/features/onboarding';
import { AppProviders } from './providers';
import { router } from './router';

const ONBOARDED_KEY = 'careertrack.onboarded';
const AUTOTOUR_KEY = 'careertrack.autotour';

function AppGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) === '1',
  );

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
