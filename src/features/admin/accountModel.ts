import type { StatusTone } from '@/api/schemas/dashboard';
import { formatDistanceToNow } from 'date-fns';
import type { AccountStatus, AdminAccount, Role } from '@/types/domain';

export const roleLabels: Record<Role, string> = {
  employee: 'Employee',
  manager: 'Line manager',
  people_team: 'People team',
  admin: 'Super admin',
};

export const roleOrder: Role[] = ['employee', 'manager', 'people_team', 'admin'];

export const statusLabels: Record<AccountStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
};

export const statusTone: Record<AccountStatus, StatusTone> = {
  active: 'approved',
  invited: 'submitted',
  suspended: 'returned',
};

export function formatLastActive(account: AdminAccount): string {
  if (!account.lastActiveAt) return account.status === 'invited' ? 'Never' : '—';
  return formatDistanceToNow(new Date(account.lastActiveAt), { addSuffix: true });
}

export interface InviteErrors {
  name: string;
  email: string;
}

export function validateInvite(name: string, email: string): InviteErrors {
  const trimmedEmail = email.trim();
  return {
    name: name.trim() ? '' : 'Enter the person\u2019s full name.',
    email: !trimmedEmail
      ? 'Enter a work email.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
        ? ''
        : 'That doesn\u2019t look like a valid email.',
  };
}

export interface AccountFilters {
  search: string;
  role: Role | 'all';
  status: AccountStatus | 'all';
  departmentId: string; // 'all' or a department id
}

export function filterAccounts(accounts: AdminAccount[], filters: AccountFilters): AdminAccount[] {
  const term = filters.search.trim().toLowerCase();
  return accounts.filter((account) => {
    if (filters.role !== 'all' && account.user.role !== filters.role) return false;
    if (filters.status !== 'all' && account.status !== filters.status) return false;
    if (filters.departmentId !== 'all' && account.user.departmentId !== filters.departmentId) {
      return false;
    }
    if (
      term &&
      !account.user.name.toLowerCase().includes(term) &&
      !account.user.email.toLowerCase().includes(term)
    ) {
      return false;
    }
    return true;
  });
}

export function countByStatus(accounts: AdminAccount[]) {
  return {
    total: accounts.length,
    active: accounts.filter((account) => account.status === 'active').length,
    pending: accounts.filter((account) => account.status === 'invited').length,
    suspended: accounts.filter((account) => account.status === 'suspended').length,
  };
}
