export type { AccountStatus, AdminAccount, AuditEvent } from './domain';

// Response for the resend-invite / reset-password actions.
export interface Delivery {
  sentTo: string;
}
