import { matchPath } from 'react-router-dom';

// Title and subtitle shown in the top bar and mobile header per route. Copy is
// taken from the design, with its en dashes rewritten to plain words.
const meta: { pattern: string; title: string; sub: string }[] = [
  { pattern: '/', title: 'Dashboard', sub: 'Your performance at a glance' },
  { pattern: '/goals/setup', title: 'Set your goals', sub: 'Fill each category, then submit once complete' },
  { pattern: '/goals', title: 'My Goals', sub: 'Set, track and manage your goals' },
  { pattern: '/reviews', title: 'Team reviews', sub: 'Review and respond to your team goals' },
  { pattern: '/people/:userId', title: 'Employee profile', sub: 'Review goals and record a rating' },
  { pattern: '/people', title: 'People', sub: 'Everyone at Oxygene, by department' },
  { pattern: '/feedback', title: 'Feedback', sub: 'Give and receive peer feedback' },
  { pattern: '/appraisals', title: 'Appraisals', sub: 'Self, manager and final ratings' },
  { pattern: '/reports', title: 'Reports & Analytics', sub: 'Visual data, tailored to your role' },
  { pattern: '/calendar', title: 'Calendar', sub: 'Cycle milestones and meetings' },
  { pattern: '/settings', title: 'Settings', sub: 'Profile, preferences and configuration' },
  { pattern: '/notifications', title: 'Notifications', sub: 'Everything that needs your attention' },
];

export function pageMetaFor(pathname: string): { title: string; sub: string } {
  for (const entry of meta) {
    if (matchPath({ path: entry.pattern, end: true }, pathname)) {
      return { title: entry.title, sub: entry.sub };
    }
  }
  return { title: 'CareerTrack', sub: '' };
}
