import { describe, expect, it } from 'vitest';
import type { AdminAccount, User } from '@/Types/domain';
import { countByStatus, filterAccounts, formatLastActive, validateInvite } from './accountModel';

function makeAccount(overrides: {
  id: string;
  name?: string;
  email?: string;
  role?: User['role'];
  departmentId?: string | null;
  status?: AdminAccount['status'];
  lastActiveAt?: string | null;
}): AdminAccount {
  return {
    user: {
      id: overrides.id,
      name: overrides.name ?? 'Test Person',
      email: overrides.email ?? `${overrides.id}@oxygene.africa`,
      role: overrides.role ?? 'employee',
      jobTitle: 'Account Executive',
      departmentId: overrides.departmentId ?? 'd-client-service',
      managerId: null,
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00+03:00',
      updatedAt: '2026-01-01T00:00:00+03:00',
    },
    status: overrides.status ?? 'active',
    lastActiveAt: overrides.lastActiveAt ?? null,
  };
}

const accounts = [
  makeAccount({ id: 'u-1', name: 'Amara Koech', email: 'amara@oxygene.africa' }),
  makeAccount({ id: 'u-2', name: 'David Otieno', role: 'manager', departmentId: 'd-digital' }),
  makeAccount({ id: 'u-3', name: 'Ali Hassan', status: 'invited' }),
  makeAccount({ id: 'u-4', name: 'Ruth Kamau', status: 'suspended' }),
];

describe('validateInvite', () => {
  it('accepts a name and a well-formed email', () => {
    const errors = validateInvite('Aisha Mohamed', 'aisha@oxygene.africa');
    expect(errors.name).toBe('');
    expect(errors.email).toBe('');
  });

  it('rejects blank fields', () => {
    const errors = validateInvite('   ', '');
    expect(errors.name).not.toBe('');
    expect(errors.email).not.toBe('');
  });

  it('rejects malformed emails', () => {
    expect(validateInvite('A', 'not-an-email').email).not.toBe('');
    expect(validateInvite('A', 'a@b').email).not.toBe('');
  });
});

describe('filterAccounts', () => {
  const all = { search: '', role: 'all', status: 'all', departmentId: 'all' } as const;

  it('passes everything through with the default filters', () => {
    expect(filterAccounts(accounts, { ...all })).toHaveLength(4);
  });

  it('matches names and emails case-insensitively', () => {
    expect(filterAccounts(accounts, { ...all, search: 'AMARA' })).toHaveLength(1);
    expect(filterAccounts(accounts, { ...all, search: 'u-2@oxygene' })).toHaveLength(1);
  });

  it('filters by role, status and department', () => {
    expect(filterAccounts(accounts, { ...all, role: 'manager' })).toHaveLength(1);
    expect(filterAccounts(accounts, { ...all, status: 'invited' })).toHaveLength(1);
    expect(filterAccounts(accounts, { ...all, departmentId: 'd-digital' })).toHaveLength(1);
  });

  it('combines filters', () => {
    expect(filterAccounts(accounts, { ...all, status: 'active', search: 'ruth' })).toHaveLength(0);
  });
});

describe('countByStatus', () => {
  it('tallies the account states', () => {
    expect(countByStatus(accounts)).toEqual({ total: 4, active: 2, pending: 1, suspended: 1 });
  });
});

describe('formatLastActive', () => {
  it('shows Never for invited accounts that have not signed in', () => {
    expect(formatLastActive(makeAccount({ id: 'u-x', status: 'invited' }))).toBe('Never');
  });

  it('shows a dash for active accounts without a timestamp', () => {
    expect(formatLastActive(makeAccount({ id: 'u-y' }))).toBe('—');
  });

  it('formats a real timestamp as a relative time', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatLastActive(makeAccount({ id: 'u-z', lastActiveAt: twoHoursAgo }))).toContain(
      'hours ago',
    );
  });
});
