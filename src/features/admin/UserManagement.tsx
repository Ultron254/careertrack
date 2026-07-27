import { useMemo, useRef, useState } from 'react';
import { useUsers, useDepartments } from '@/api/queries/org';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/icons/Icon';
import { useToast } from '@/components/ui/Toast';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import type { StatusTone } from '@/api/schemas/dashboard';
import type { Role, User } from '@/types/domain';
import styles from './UserManagement.module.css';

type AccountStatus = 'Active' | 'Invited' | 'Suspended';

const roleLabels: Record<Role, string> = {
  employee: 'Employee',
  manager: 'Line manager',
  people_team: 'People team',
  admin: 'Super admin',
};

const roleOrder: Role[] = ['employee', 'manager', 'people_team', 'admin'];

const statusTone: Record<AccountStatus, StatusTone> = {
  Active: 'approved',
  Invited: 'submitted',
  Suspended: 'returned',
};

// An account row is the directory User plus the operational fields the identity
// provider owns (status, last sign-in). Those are stubbed until the admin API is
// wired; see deriveStatus / deriveLastActive below.
interface Account {
  user: User;
  status: AccountStatus;
  lastActive: string;
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

// Dummy provisioning state. Most people are active; a couple sit as pending
// invites or suspended so the filters and row actions have something to show.
// Replace with real values from the identity provider (Entra ID) sign-in logs.
function deriveStatus(user: User): AccountStatus {
  if (user.id === 'u-ali') return 'Invited';
  if (user.id === 'u-ruth') return 'Suspended';
  return 'Active';
}

const lastActiveOptions = [
  'Just now',
  '12 min ago',
  '1 hour ago',
  '3 hours ago',
  'Yesterday',
  '2 days ago',
  'Last week',
];

function deriveLastActive(user: User, status: AccountStatus): string {
  if (status === 'Invited') return 'Never';
  return lastActiveOptions[hashId(user.id) % lastActiveOptions.length];
}

export function UserManagement() {
  const usersQuery = useUsers();
  const departmentsQuery = useDepartments();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Local overrides layered on top of the fixture data. Every mutation on this
  // screen is optimistic and lives only in memory — the real endpoints will
  // replace these once the admin API exists.
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Role>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AccountStatus>>({});
  const [invited, setInvited] = useState<Account[]>([]);

  const departments = departmentsQuery.data ?? [];
  const departmentName = (id: string | null) =>
    departments.find((department) => department.id === id)?.name ?? 'Unassigned';

  const accounts = useMemo<Account[]>(() => {
    const base = (usersQuery.data ?? []).map((user) => {
      const status = statusOverrides[user.id] ?? deriveStatus(user);
      return {
        user: roleOverrides[user.id] ? { ...user, role: roleOverrides[user.id] } : user,
        status,
        lastActive: deriveLastActive(user, status),
      };
    });
    return [...invited, ...base];
  }, [usersQuery.data, roleOverrides, statusOverrides, invited]);

  const counts = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.status === 'Active').length;
    const pending = accounts.filter((a) => a.status === 'Invited').length;
    const suspended = accounts.filter((a) => a.status === 'Suspended').length;
    return { total, active, pending, suspended };
  }, [accounts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter((account) => {
      if (roleFilter !== 'all' && account.user.role !== roleFilter) return false;
      if (statusFilter !== 'all' && account.status !== statusFilter) return false;
      if (deptFilter !== 'all' && account.user.departmentId !== deptFilter) return false;
      if (
        term &&
        !account.user.name.toLowerCase().includes(term) &&
        !account.user.email.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [accounts, search, roleFilter, statusFilter, deptFilter]);

  if (usersQuery.isPending || departmentsQuery.isPending) return <ViewSkeleton />;
  if (usersQuery.isError) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={usersQuery.error} onRetry={usersQuery.refetch} />
      </div>
    );
  }

  const changeRole = (userId: string, role: Role) => {
    setRoleOverrides((prev) => ({ ...prev, [userId]: role }));
    setMenuFor(null);
    toast(`Role updated to ${roleLabels[role]}`);
  };

  const toggleSuspend = (account: Account) => {
    const next: AccountStatus = account.status === 'Suspended' ? 'Active' : 'Suspended';
    setStatusOverrides((prev) => ({ ...prev, [account.user.id]: next }));
    setMenuFor(null);
    toast(next === 'Suspended' ? `${account.user.name} suspended` : `${account.user.name} reactivated`);
  };

  const resendInvite = (account: Account) => {
    setMenuFor(null);
    toast(`Invite re-sent to ${account.user.email}`);
  };

  const resetPassword = (account: Account) => {
    setMenuFor(null);
    toast(`Password reset link sent to ${account.user.email}`);
  };

  const handleInvite = (account: Account) => {
    setInvited((prev) => [account, ...prev]);
    setInviteOpen(false);
    toast(`Invite sent to ${account.user.email}`);
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
          onClick={() => setStatusFilter('Active')}
        >
          <span className={styles.statValue} data-tone="active">
            {counts.active}
          </span>
          <span className={styles.statLabel}>Active</span>
        </button>
        <button
          type="button"
          className={`card ${styles.stat}`}
          onClick={() => setStatusFilter('Invited')}
        >
          <span className={styles.statValue} data-tone="invited">
            {counts.pending}
          </span>
          <span className={styles.statLabel}>Pending invites</span>
        </button>
        <button
          type="button"
          className={`card ${styles.stat}`}
          onClick={() => setStatusFilter('Suspended')}
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
            <option value="Active">Active</option>
            <option value="Invited">Invited</option>
            <option value="Suspended">Suspended</option>
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
                const manager = (usersQuery.data ?? []).find(
                  (candidate) => candidate.id === account.user.managerId,
                );
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
                      <StatusBadge status={account.status} tone={statusTone[account.status]} />
                    </td>
                    <td className={styles.muted}>{account.lastActive}</td>
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
                                onClick={() => changeRole(account.user.id, role)}
                              >
                                {roleLabels[role]}
                                {account.user.role === role && <Icon name="check" size={14} />}
                              </button>
                            ))}
                            <div className={styles.menuDivider} />
                            {account.status === 'Invited' && (
                              <button
                                type="button"
                                role="menuitem"
                                className={styles.menuItem}
                                onClick={() => resendInvite(account)}
                              >
                                Resend invite
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.menuItem}
                              onClick={() => resetPassword(account)}
                            >
                              Send password reset
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.menuItem}
                              data-danger={account.status !== 'Suspended'}
                              onClick={() => toggleSuspend(account)}
                            >
                              {account.status === 'Suspended' ? 'Reactivate account' : 'Suspend account'}
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
        managers={(usersQuery.data ?? []).filter(
          (user) => user.role === 'manager' || user.role === 'people_team',
        )}
        onInvite={handleInvite}
      />
    </div>
  );
}

function InviteModal({
  open,
  onClose,
  departments,
  managers,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  departments: { id: string; name: string }[];
  managers: User[];
  onInvite: (account: Account) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const nameError = name.trim() ? '' : 'Enter the person\u2019s full name.';
  const emailError = !email.trim()
    ? 'Enter a work email.'
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? ''
      : 'That doesn\u2019t look like a valid email.';
  const canSubmit = !nameError && !emailError;

  const reset = () => {
    setName('');
    setEmail('');
    setRole('employee');
    setDepartmentId('');
    setManagerId('');
    setTouched(false);
  };

  const submit = () => {
    if (!canSubmit) {
      setTouched(true);
      return;
    }
    const now = new Date().toISOString();
    // A staged account row for the invited person. The backend will mint the
    // real user id and Entra ID account; this stand-in id keeps React keys stable.
    onInvite({
      user: {
        id: `invite-${email.trim().toLowerCase()}`,
        name: name.trim(),
        email: email.trim(),
        role,
        jobTitle: 'Pending first sign-in',
        departmentId: departmentId || null,
        managerId: managerId || null,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      },
      status: 'Invited',
      lastActive: 'Never',
    });
    reset();
  };

  return (
    <Modal open={open} onClose={onClose} label="Invite a new user" width={520}>
      <div className={styles.modalHead}>
        <h2 className={styles.modalTitle}>Invite a user</h2>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>
      <p className={styles.modalSub}>
        We&rsquo;ll email an Entra ID invitation. They set a password and land on onboarding.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Full name</span>
          <input
            ref={firstFieldRef}
            className={styles.input}
            data-invalid={touched && Boolean(nameError)}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Aisha Mohamed"
            aria-invalid={touched && Boolean(nameError)}
          />
          {touched && nameError && <span className={styles.fieldError}>{nameError}</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Work email</span>
          <input
            className={styles.input}
            type="email"
            data-invalid={touched && Boolean(emailError)}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@oxygene.africa"
            aria-invalid={touched && Boolean(emailError)}
          />
          {touched && emailError && <span className={styles.fieldError}>{emailError}</span>}
        </label>

        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Role</span>
            <select
              className={styles.input}
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              {roleOrder.map((value) => (
                <option key={value} value={value}>
                  {roleLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Department</span>
            <select
              className={styles.input}
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Line manager</span>
          <select
            className={styles.input}
            value={managerId}
            onChange={(event) => setManagerId(event.target.value)}
          >
            <option value="">None</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} &middot; {manager.jobTitle}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.modalActions}>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.primary} data-disabled={touched && !canSubmit}>
            Send invite
          </button>
        </div>
      </form>
    </Modal>
  );
}
