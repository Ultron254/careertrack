import type { Role, User } from '@/Types/domain';
import { db } from './store';

// Development stand-in for the authenticated session. The four personas
// mirror the seeded users (same ids), and the chosen role is kept in
// sessionStorage so a refresh stays signed in as the same person. Laravel's
// session guard replaces all of this — pages only ever see auth.user via
// shared props, never these helpers.

export const AUTH_FLAG = 'careertrack.mock.signedIn';
export const ROLE_KEY = 'careertrack.mock.role';

const personaIds: Record<Role, string> = {
  employee: 'u-amara',
  manager: 'u-david',
  people_team: 'u-wanjiru',
  admin: 'u-sam',
};

export const storedRole = (): Role => {
  const value = sessionStorage.getItem(ROLE_KEY) as Role | null;
  return value && value in personaIds ? value : 'employee';
};

export const isSignedIn = () => sessionStorage.getItem(AUTH_FLAG) === '1';

// Resolved against the live store, not a static copy, so profile edits made
// in Settings show up wherever the session user appears.
export function personaFor(role: Role): User {
  const user = db.users.find((u) => u.id === personaIds[role]);
  if (!user) throw new Error(`Seed data is missing the ${role} persona`);
  return user;
}

export const currentUser = (): User | null => (isSignedIn() ? personaFor(storedRole()) : null);
