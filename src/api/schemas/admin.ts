import { z } from 'zod';
import type { AdminAccount, AuditEvent } from '@/types/domain';
import { isoDateTime, roleSchema } from './common';
import { userSchema } from './user';

export const accountStatusSchema = z.enum(['active', 'invited', 'suspended']);

export const adminAccountSchema = z.object({
  user: userSchema,
  status: accountStatusSchema,
  lastActiveAt: isoDateTime.nullable(),
}) satisfies z.ZodType<AdminAccount>;

export const adminAccountsSchema = z.array(adminAccountSchema);

// Payload for POST /api/admin/accounts/invite. The backend mints the user id
// and sends the Entra ID invitation email.
export const inviteInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  departmentId: z.string().nullable(),
  managerId: z.string().nullable(),
});
export type InviteInput = z.infer<typeof inviteInputSchema>;

// Payload for PATCH /api/admin/accounts/:userId. Both fields optional; send
// only what changed.
export const accountUpdateSchema = z.object({
  role: roleSchema.optional(),
  status: accountStatusSchema.optional(),
});
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;

// Response for the resend-invite / reset-password actions.
export const deliverySchema = z.object({ sentTo: z.string().email() });
export type Delivery = z.infer<typeof deliverySchema>;

export const auditActionSchema = z.enum([
  'account_invited',
  'role_changed',
  'account_suspended',
  'account_reactivated',
  'invite_resent',
  'password_reset_sent',
  'config_updated',
  'appraisal_locked',
]);

export const auditEventSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: auditActionSchema,
  detail: z.string(),
  at: isoDateTime,
}) satisfies z.ZodType<AuditEvent>;

export const auditEventsSchema = z.array(auditEventSchema);
