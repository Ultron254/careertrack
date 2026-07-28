import { useMemo, useState } from 'react';
import {
  useAccounts,
  useResendInvite,
  useResetPassword,
  useUpdateAccount,
} from '@/api/queries/admin';
import { useDepartments } from '@/api/queries/org';
import { ApiError } from '@/api/client';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/icons/Icon';
import { useToast } from '@/components/ui/Toast';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import type { AccountStatus, AdminAccount, Role } from '@/types/domain';
import {
  countByStatus,
  filterAccounts,
  formatLastActive,
  roleLabels,
  roleOrder,
  statusLabels,
  statusTone,
} from './accountModel';
import { InviteModal } from './InviteModal';
import styles from './UserManagement.module.css';

export function UserManagement() {
  const accountsQuery = useAccounts();
  const departmentsQuery = useDepartments();
  const updateAccount = useUpdateAccount();
  const resendInvite = useResendInvite();
  const resetPassword = useResetPassword();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const departments = departmentsQuery.data ?? [];
  const departmentName = (id: string | null) =>
    departments.find((department) => department.id === id)?.name ?? 'Unassigned';

  const counts = useMemo(() => countByStatus(accounts), [accounts]);
  const filtered = useMemo(
    () =>
      filterAccounts(accounts, {
        search,
        role: roleFilter,
        status: statusFilter,
        departmentId: deptFilter,
      }),
    [accounts, search, roleFilter, statusFilter, deptFilter],
  );

  if (accountsQuery.isPending || departmentsQuery.isPending) return <ViewSkeleton />;
  if (accountsQuery.isError) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={accountsQuery.error} onRetry={accountsQuery.refetch} />
      </div>
    );
  }

  const failToast = (error: unknown) =>
    toast(error instanceof ApiError ? error.message : 'That did not go through. Try again.');

  const changeRole = (account: AdminAccount, role: Role) => {
    setMenuFor(null);
    if (account.user.role === role) return;
    updateAccount.mutate(
      { userId: account.user.id, update: { role } },
      {
        onSuccess: () => toast(`Role updated to ${roleLabels[role]}`),
        onError: failToast,
      },
    );
  };

  const toggleSuspend = (account: AdminAccount) => {
    setMenuFor(null);
    const next: AccountStatus = account.status === 'suspended' ? 'active' : 'suspended';
    updateAccount.mutate(
      { userId: account.user.id, update: { status: next } },
      {
        onSuccess: () =>
          toast(
            next === 'suspended'
              ? `${account.user.name} suspended`
              : `${account.user.name} reactivated`,
          ),
        onError: failToast,
      },
    );
  };

  const handleResendInvite = (account: AdminAccount) => {
    setMenuFor(null);
    resendInvite.mutate(account.user.id, {
      onSuccess: (delivery) => toast(`Invite re-sent to ${delivery.sentTo}`),
      onError: failToast,
    });
  };

  const handleResetPassword = (account: AdminAccount) => {
    setMenuFor(null);
    resetPassword.mutate(account.user.id, {
      onSuccess: (delivery) => toast(`Password reset link sent to ${delivery.sentTo}`),
      onError: failToast,
    });
  };

  return (
    <div className={`view ${styles.page}`} onClick={() => setMenuFor(null)}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Accounts &amp; access</h1>
          <p className={styles.subtitle}>
            Provision people, assign roles and keep the directory tidy. Changes sync to Microsoft
            Entra ID.
          </p>
        </div>
        <button type="button" className={styles.primary} onClick={() => setInviteOpen(true)}>
          <Icon name="plus" size={16} />
          Invite user
        </button>
      </div>

      <div className={styles.stats}>
        <button type="button" className={`card ${styles.stat}`} onClick={() => setStatusFilter('all')}>
          <span className={styles.statValue}>{counts.total}</span>
          <span className={styles.statLabel}>Total accounts</span>
        </button>
        <button
          type="button"
          className={`card ${styles.stat}`}
          onClick={() => setStatusFilter('active')}
        >
          <span className={styles.statValue} data-tone="active">
            {counts.active}
          </span>
          <span className={styles.statLabel}>Active</span>
        </button>
        <button
          type="button"
          className={`card ${styles.stat}`}
          onClick={() => setStatusFilter('invited')}
        >
          <span className={styles.statValue} data-tone="invited">
            {counts.pending}
          </span>
          <span className={styles.statLabel}>Pending invites</span>
        </button>
        <button
          type="button"
          className={`card ${styles.stat}`}
          onClick={() => setStatusFilter('suspended')}
        >
          <span className={styles.statValue} data-tone="suspended">
            {counts.suspended}
          </span>
          <span className={styles.statLabel}>Suspended</span>
        </button>
      </div>

      <div className={`card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Search name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={styles.searchInput}
            />
          </div>
          <select
            className={styles.select}
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | 'all')}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {roleOrder.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={deptFilter}
            onChange={(event) => setDeptFilter(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as AccountStatus | 'all')}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Person</th>
                <th>Role</th>
                <th>Department</th>
                <th>Line manager</th>
                <th>Status</th>
                <th>Last active</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => {
                const manager = accounts.find(
                  (candidate) => candidate.user.id === account.user.managerId,
                )?.user;
                return (
                  <tr key={account.user.id}>
                    <td>
                      <div className={styles.person}>
                        <Avatar
                          userId={account.user.id}
                          name={account.user.name}
                          avatarUrl={account.user.avatarUrl}
                          size={36}
                        />
                        <div className={styles.personText}>
                          <span className={styles.personName}>{account.user.name}</span>
                          <span className={styles.personEmail}>{account.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.roleTag} data-role={account.user.role}>
                        {roleLabels[account.user.role]}
                      </span>
                    </td>
                    <td className={styles.muted}>{departmentName(account.user.departmentId)}</td>
                    <td className={styles.muted}>{manager ? manager.name : '—'}</td>
                    <td>
                      <StatusBadge
                        status={statusLabels[account.status]}
                        tone={statusTone[account.status]}
                      />
                    </td>
                    <td className={styles.muted}>{formatLastActive(account)}</td>
                    <td className={styles.actionCell}>
                      <div className={styles.menuWrap}>
                        <button
                          type="button"
                          className={styles.menuButton}
                          aria-label={`Actions for ${account.user.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuFor((current) =>
                              current === account.user.id ? null : account.user.id,
                            );
                          }}
                        >
                          <span className={styles.dots} />
                        </button>
                        {menuFor === account.user.id && (
                          <div
                            className={styles.menu}
                            onClick={(event) => event.stopPropagation()}
                            role="menu"
                          >
                            <div className={styles.menuHead}>Change role</div>
                            {roleOrder.map((role) => (
                              <button
                                key={role}
                                type="button"
                                role="menuitemradio"
                                aria-checked={account.user.role === role}
                                className={styles.menuItem}
                                data-on={account.user.role === role}
                                onClick={() => changeRole(account, role)}
                              >
                                {roleLabels[role]}
                                {account.user.role === role && <Icon name="check" size={14} />}
                              </button>
                            ))}
                            <div className={styles.menuDivider} />
                            {account.status === 'invited' && (
                              <button
                                type="button"
                                role="menuitem"
                                className={styles.menuItem}
                                onClick={() => handleResendInvite(account)}
                              >
                                Resend invite
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.menuItem}
                              onClick={() => handleResetPassword(account)}
                            >
                              Send password reset
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.menuItem}
                              data-danger={account.status !== 'suspended'}
                              onClick={() => toggleSuspend(account)}
                            >
                              {account.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className={styles.empty}>No accounts match these filters.</div>
          )}
        </div>

        <div className={styles.tableFoot}>
          Showing {filtered.length} of {accounts.length} accounts
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        departments={departments}
        managers={accounts
          .map((account) => account.user)
          .filter((user) => user.role === 'manager' || user.role === 'people_team')}
      />
    </div>
  );
}
