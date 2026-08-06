import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { AuditLogProps } from '@/Pages/admin/AuditLog';
import type { UserManagementProps } from '@/Pages/admin/UserManagement';
import { roleLabels } from '@/Pages/admin/accountModel';
import type { AdminAccount, AuditEvent, Role, User } from '@/Types/domain';
import { departments } from './fixtures/departments';
import { db, nextId } from './store';

const roles: Role[] = ['employee', 'manager', 'people_team', 'admin'];

function toAccount(user: User): AdminAccount {
  return {
    user,
    status: db.accountStatus[user.id] ?? 'active',
    lastActiveAt: db.lastActive[user.id] ?? null,
  };
}

// Every administrative write leaves a trail; the log is append-only and
// newest first, the way the compliance screen reads it.
export function recordAudit(actor: User, action: AuditEvent['action'], detail: string): void {
  db.auditLog.unshift({
    id: nextId('audit'),
    actorId: actor.id,
    actorName: actor.name,
    action,
    detail,
    at: new Date().toISOString(),
  });
}

// Account provisioning is an admin-only surface; the People Team manages the
// performance cycle but not identities.
const forbidden = (user: User) =>
  user.role !== 'admin' ? { errors: { account: 'Only an admin can manage accounts.' } } : null;

// Mock counterpart of AccountController@index: the whole directory with
// provisioning status and last activity attached to each person.
export const userManagementProps: PageResolver<UserManagementProps> = () => ({
  accounts: db.users.map(toAccount),
  departments,
});

// Mock counterpart of AuditController@index: the immutable trail, newest first.
export const auditLogProps: PageResolver<AuditLogProps> = () => ({
  events: db.auditLog,
});

const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Inviting someone. The id is minted here and the invitation email goes out
// through Entra ID; until first sign-in the account sits in 'invited'.
registerAction('post', '/admin/accounts/invite', ({ user: actor, body }) => {
  const guard = forbidden(actor);
  if (guard) return guard;
  const errors: Record<string, string> = {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) errors.name = 'Enter the person\u2019s full name.';
  if (!isEmail(body.email)) errors.email = 'That doesn\u2019t look like a valid email.';
  if (!roles.includes(body.role as Role)) errors.role = 'Choose a role.';
  if (Object.keys(errors).length > 0) return { errors };

  const email = (body.email as string).trim().toLowerCase();
  if (db.users.some((user) => user.email.toLowerCase() === email)) {
    return { errors: { email: 'An account with that email already exists.' } };
  }
  const now = new Date().toISOString();
  const invited: User = {
    id: nextId('u'),
    name,
    email,
    role: body.role as Role,
    jobTitle: 'Pending first sign-in',
    departmentId: (body.departmentId as string | null) ?? null,
    managerId: (body.managerId as string | null) ?? null,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(invited);
  db.accountStatus[invited.id] = 'invited';
  recordAudit(actor, 'account_invited', `Invited ${email} as ${roleLabels[invited.role]}`);
});

// Changing an account. Role and status arrive independently and each change
// writes its own audit entry, so the trail reads one action per line.
registerAction('patch', '/admin/accounts/:userId', ({ user: actor, params, body }) => {
  const guard = forbidden(actor);
  if (guard) return guard;
  const user = db.users.find((candidate) => candidate.id === params.userId);
  if (!user) return { errors: { account: 'No account with that id.' } };

  if ('role' in body) {
    if (!roles.includes(body.role as Role)) return { errors: { role: 'Choose a role.' } };
    if (body.role !== user.role) {
      user.role = body.role as Role;
      user.updatedAt = new Date().toISOString();
      recordAudit(actor, 'role_changed', `Changed ${user.name}'s role to ${roleLabels[user.role]}`);
    }
  }
  if ('status' in body) {
    if (body.status !== 'active' && body.status !== 'invited' && body.status !== 'suspended') {
      return { errors: { status: 'Choose a status.' } };
    }
    if (body.status !== (db.accountStatus[user.id] ?? 'active')) {
      db.accountStatus[user.id] = body.status;
      recordAudit(
        actor,
        body.status === 'suspended' ? 'account_suspended' : 'account_reactivated',
        body.status === 'suspended'
          ? `Suspended ${user.name}'s account`
          : `Reactivated ${user.name}'s account`,
      );
    }
  }
});

// Nudging a pending invite. Nothing changes on the account itself; the send
// is the event worth recording.
registerAction('post', '/admin/accounts/:userId/resend-invite', ({ user: actor, params }) => {
  const guard = forbidden(actor);
  if (guard) return guard;
  const user = db.users.find((candidate) => candidate.id === params.userId);
  if (!user) return { errors: { account: 'No account with that id.' } };
  if ((db.accountStatus[user.id] ?? 'active') !== 'invited') {
    return { errors: { account: 'Only pending invites can be re-sent.' } };
  }
  recordAudit(actor, 'invite_resent', `Re-sent the invitation to ${user.email}`);
});

// Sending a password reset link. Again a pure audit-trail write here; the
// identity provider owns the actual credential flow.
registerAction('post', '/admin/accounts/:userId/reset-password', ({ user: actor, params }) => {
  const guard = forbidden(actor);
  if (guard) return guard;
  const user = db.users.find((candidate) => candidate.id === params.userId);
  if (!user) return { errors: { account: 'No account with that id.' } };
  recordAudit(actor, 'password_reset_sent', `Sent a password reset link to ${user.email}`);
});
