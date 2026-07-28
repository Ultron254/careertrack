import { http, HttpResponse } from 'msw';
import { accountUpdateSchema, inviteInputSchema } from '@/api/schemas/admin';
import type { AdminAccount, AuditEvent, User } from '@/types/domain';
import { db, nextId } from '../db';
import { currentUser, errorJson, latency } from './utils';

const roleLabel: Record<User['role'], string> = {
  employee: 'Employee',
  manager: 'Line manager',
  people_team: 'People team',
  admin: 'Super admin',
};

function toAccount(user: User): AdminAccount {
  return {
    user,
    status: db.accountStatus[user.id] ?? 'active',
    lastActiveAt: db.lastActive[user.id] ?? null,
  };
}

export function recordAudit(
  actor: User,
  action: AuditEvent['action'],
  detail: string,
): void {
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
const guard = (request: Request) => {
  const user = currentUser(request);
  if (user.role !== 'admin') {
    return { user, error: errorJson(403, 'forbidden', 'Only an admin can manage accounts.') };
  }
  return { user, error: null };
};

export const adminHandlers = [
  http.get('/api/admin/accounts', async ({ request }) => {
    await latency();
    const { error } = guard(request);
    if (error) return error;
    return HttpResponse.json(db.users.map(toAccount));
  }),

  http.post('/api/admin/accounts/invite', async ({ request }) => {
    await latency();
    const { user: actor, error } = guard(request);
    if (error) return error;
    const body = inviteInputSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_invite', body.error.issues[0].message);
    const email = body.data.email.trim().toLowerCase();
    if (db.users.some((user) => user.email.toLowerCase() === email)) {
      return errorJson(409, 'email_taken', 'An account with that email already exists.');
    }
    const now = new Date().toISOString();
    const invited: User = {
      id: nextId('u'),
      name: body.data.name.trim(),
      email,
      role: body.data.role,
      jobTitle: 'Pending first sign-in',
      departmentId: body.data.departmentId,
      managerId: body.data.managerId,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(invited);
    db.accountStatus[invited.id] = 'invited';
    recordAudit(actor, 'account_invited', `Invited ${email} as ${roleLabel[invited.role]}`);
    return HttpResponse.json(toAccount(invited), { status: 201 });
  }),

  http.patch('/api/admin/accounts/:userId', async ({ request, params }) => {
    await latency();
    const { user: actor, error } = guard(request);
    if (error) return error;
    const user = db.users.find((candidate) => candidate.id === (params.userId as string));
    if (!user) return errorJson(404, 'user_not_found', 'No account with that id.');
    const body = accountUpdateSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_update', body.error.issues[0].message);

    if (body.data.role && body.data.role !== user.role) {
      user.role = body.data.role;
      user.updatedAt = new Date().toISOString();
      recordAudit(actor, 'role_changed', `Changed ${user.name}'s role to ${roleLabel[user.role]}`);
    }
    if (body.data.status && body.data.status !== (db.accountStatus[user.id] ?? 'active')) {
      db.accountStatus[user.id] = body.data.status;
      recordAudit(
        actor,
        body.data.status === 'suspended' ? 'account_suspended' : 'account_reactivated',
        body.data.status === 'suspended'
          ? `Suspended ${user.name}'s account`
          : `Reactivated ${user.name}'s account`,
      );
    }
    return HttpResponse.json(toAccount(user));
  }),

  http.post('/api/admin/accounts/:userId/resend-invite', async ({ request, params }) => {
    await latency();
    const { user: actor, error } = guard(request);
    if (error) return error;
    const user = db.users.find((candidate) => candidate.id === (params.userId as string));
    if (!user) return errorJson(404, 'user_not_found', 'No account with that id.');
    if ((db.accountStatus[user.id] ?? 'active') !== 'invited') {
      return errorJson(409, 'not_invited', 'Only pending invites can be re-sent.');
    }
    recordAudit(actor, 'invite_resent', `Re-sent the invitation to ${user.email}`);
    return HttpResponse.json({ sentTo: user.email });
  }),

  http.post('/api/admin/accounts/:userId/reset-password', async ({ request, params }) => {
    await latency();
    const { user: actor, error } = guard(request);
    if (error) return error;
    const user = db.users.find((candidate) => candidate.id === (params.userId as string));
    if (!user) return errorJson(404, 'user_not_found', 'No account with that id.');
    recordAudit(actor, 'password_reset_sent', `Sent a password reset link to ${user.email}`);
    return HttpResponse.json({ sentTo: user.email });
  }),

  http.get('/api/admin/audit', async ({ request }) => {
    await latency();
    const user = currentUser(request);
    if (user.role !== 'admin' && user.role !== 'people_team') {
      return errorJson(403, 'forbidden', 'Only admins and the People Team can read the audit log.');
    }
    return HttpResponse.json(db.auditLog);
  }),
];
