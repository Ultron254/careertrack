import type { Role } from '@/types/domain';

// Navigation and access derive from the maps in this file and nowhere else.
// Adding a role means adding one entry to each map below.

export type ScreenKey =
  | 'dashboard'
  | 'goals'
  | 'reviews'
  | 'people'
  | 'accounts'
  | 'feedback'
  | 'appraisals'
  | 'reports'
  | 'calendar'
  | 'settings';

export interface Screen {
  key: ScreenKey;
  label: string;
  path: string;
  icon: 'dashboard' | 'goal' | 'team' | 'chat' | 'doc' | 'chart' | 'cal' | 'gear' | 'shield';
}

export const screens: Record<ScreenKey, Screen> = {
  dashboard: { key: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard' },
  goals: { key: 'goals', label: 'My Goals', path: '/goals', icon: 'goal' },
  reviews: { key: 'reviews', label: 'Reviews', path: '/reviews', icon: 'team' },
  people: { key: 'people', label: 'People', path: '/people', icon: 'team' },
  accounts: { key: 'accounts', label: 'Accounts', path: '/accounts', icon: 'shield' },
  feedback: { key: 'feedback', label: 'Feedback', path: '/feedback', icon: 'chat' },
  appraisals: { key: 'appraisals', label: 'Appraisals', path: '/appraisals', icon: 'doc' },
  reports: { key: 'reports', label: 'Reports', path: '/reports', icon: 'chart' },
  calendar: { key: 'calendar', label: 'Calendar', path: '/calendar', icon: 'cal' },
  settings: { key: 'settings', label: 'Settings', path: '/settings', icon: 'gear' },
};

// Sidebar order comes straight from the design and differs per role.
export const sidebarOrder: Record<Role, ScreenKey[]> = {
  employee: ['dashboard', 'goals', 'appraisals', 'feedback', 'calendar', 'reports', 'settings'],
  manager: [
    'dashboard',
    'goals',
    'reviews',
    'appraisals',
    'feedback',
    'calendar',
    'reports',
    'settings',
  ],
  people_team: [
    'dashboard',
    'goals',
    'people',
    'reports',
    'calendar',
    'appraisals',
    'feedback',
    'settings',
  ],
  admin: [
    'dashboard',
    'accounts',
    'people',
    'reports',
    'appraisals',
    'calendar',
    'feedback',
    'settings',
  ],
};

export interface MobileTab {
  label: string;
  path: string;
  icon: 'home' | 'goal' | 'team' | 'chat' | 'chart' | 'user';
}

export const mobileTabs: Record<Role, MobileTab[]> = {
  employee: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'My Goals', path: '/goals', icon: 'goal' },
    { label: 'Feedback', path: '/feedback', icon: 'chat' },
    { label: 'Profile', path: '/settings', icon: 'user' },
  ],
  manager: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Reviews', path: '/reviews', icon: 'team' },
    { label: 'Feedback', path: '/feedback', icon: 'chat' },
    { label: 'Profile', path: '/settings', icon: 'user' },
  ],
  people_team: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'People', path: '/people', icon: 'team' },
    { label: 'Reports', path: '/reports', icon: 'chart' },
    { label: 'Profile', path: '/settings', icon: 'user' },
  ],
  admin: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Accounts', path: '/accounts', icon: 'team' },
    { label: 'Reports', path: '/reports', icon: 'chart' },
    { label: 'Profile', path: '/settings', icon: 'user' },
  ],
};

// Route patterns each role may open. The router guard matches against these;
// anything else renders the 403 screen.
export const routeAccess: Record<Role, string[]> = {
  employee: [
    '/',
    '/goals',
    '/goals/setup',
    '/appraisals',
    '/feedback',
    '/calendar',
    '/reports',
    '/settings',
    '/notifications',
  ],
  manager: [
    '/',
    '/goals',
    '/goals/setup',
    '/reviews',
    '/appraisals',
    '/feedback',
    '/calendar',
    '/reports',
    '/settings',
    '/notifications',
  ],
  people_team: [
    '/',
    '/goals',
    '/goals/setup',
    '/people',
    '/people/:userId',
    '/reports',
    '/calendar',
    '/appraisals',
    '/feedback',
    '/settings',
    '/notifications',
  ],
  admin: [
    '/',
    '/accounts',
    '/people',
    '/people/:userId',
    '/settings',
    '/reports',
    '/appraisals',
    '/calendar',
    '/feedback',
    '/notifications',
  ],
};

export const roleLabels: Record<Role, string> = {
  employee: 'Employee',
  manager: 'Line Manager',
  people_team: 'People Team',
  admin: 'Super Admin',
};

// Entra ID sends application roles in the access token's roles claim:
//   { "roles": ["CareerTrack.Manager"], ... }
// The app registration defines the four values below. Unknown or missing
// claims fall back to employee, the least privileged role.
const claimValueToRole: Record<string, Role> = {
  'CareerTrack.Employee': 'employee',
  'CareerTrack.Manager': 'manager',
  'CareerTrack.PeopleTeam': 'people_team',
  'CareerTrack.Admin': 'admin',
};

export function roleFromClaims(claims: unknown): Role {
  const roles = (claims as { roles?: unknown })?.roles;
  if (Array.isArray(roles)) {
    for (const value of roles) {
      const mapped = claimValueToRole[value as string];
      if (mapped) return mapped;
    }
  }
  return 'employee';
}
