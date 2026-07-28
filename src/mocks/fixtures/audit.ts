import type { AuditEvent } from '@/types/domain';
import { daysAgo, hoursAgo } from './time';

// Dummy audit trail seeding the admin activity views. Every admin or People
// Team action taken in the app appends real entries on top of these.
export const auditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    actorId: 'u-sam',
    actorName: 'Sam Ndlovu',
    action: 'config_updated',
    detail: 'Updated cycle reminder offsets to 14 / 7 / 3 / 1 days',
    at: hoursAgo(2),
  },
  {
    id: 'audit-2',
    actorId: 'u-sam',
    actorName: 'Sam Ndlovu',
    action: 'account_invited',
    detail: 'Invited ali.hassan@oxygene.africa as PR Executive',
    at: daysAgo(1),
  },
  {
    id: 'audit-3',
    actorId: 'u-sam',
    actorName: 'Sam Ndlovu',
    action: 'account_suspended',
    detail: 'Suspended Ruth Kamau pending offboarding',
    at: daysAgo(2),
  },
  {
    id: 'audit-4',
    actorId: 'u-wanjiru',
    actorName: 'Wanjiru Mwangi',
    action: 'config_updated',
    detail: 'Enabled the People category at 30% weight',
    at: daysAgo(7),
  },
  {
    id: 'audit-5',
    actorId: 'u-wanjiru',
    actorName: 'Wanjiru Mwangi',
    action: 'appraisal_locked',
    detail: "Locked Kevin Njoroge's 2026 appraisal after sign-off",
    at: daysAgo(9),
  },
  {
    id: 'audit-6',
    actorId: 'u-sam',
    actorName: 'Sam Ndlovu',
    action: 'password_reset_sent',
    detail: 'Sent a password reset link to brian.kimani@oxygene.africa',
    at: daysAgo(12),
  },
];
