import { matchPath } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Role } from '@/types/domain';
import { roleFromClaims, routeAccess, screens, sidebarOrder } from './roles';

const roles: Role[] = ['employee', 'manager', 'people_team', 'admin'];

// Mirrors the check in AccessGuard so the test proves the guard's behaviour.
function canReach(role: Role, path: string) {
  return routeAccess[role].some((pattern) => matchPath({ path: pattern, end: true }, path));
}

describe('role navigation map', () => {
  it('lists a reachable route for every sidebar entry', () => {
    for (const role of roles) {
      for (const key of sidebarOrder[role]) {
        expect(canReach(role, screens[key].path)).toBe(true);
      }
    }
  });

  it('denies reviews to an employee and people to a manager', () => {
    expect(canReach('employee', '/reviews')).toBe(false);
    expect(canReach('manager', '/people')).toBe(false);
  });

  it('grants an admin the people profile route', () => {
    expect(canReach('admin', '/people/u-amara')).toBe(true);
  });
});

describe('claim mapping', () => {
  it('maps known Entra app roles to internal roles', () => {
    expect(roleFromClaims({ roles: ['CareerTrack.Manager'] })).toBe('manager');
    expect(roleFromClaims({ roles: ['CareerTrack.PeopleTeam'] })).toBe('people_team');
    expect(roleFromClaims({ roles: ['CareerTrack.Admin'] })).toBe('admin');
  });

  it('falls back to employee for unknown or missing claims', () => {
    expect(roleFromClaims({ roles: ['CareerTrack.Unknown'] })).toBe('employee');
    expect(roleFromClaims(undefined)).toBe('employee');
    expect(roleFromClaims({})).toBe('employee');
  });
});
