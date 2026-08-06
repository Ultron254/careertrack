import type { AccountStatus, IsoDateTime } from '@/Types/domain';
import { daysAgo, hoursAgo } from './time';

// Provisioning metadata the identity provider owns, keyed by user id. Anyone
// not listed here is an active account. In production this comes from the
// Entra ID sign-in logs, not from CareerTrack's own database.
export const accountStatusById: Record<string, AccountStatus> = {
  'u-ali': 'invited',
  'u-ruth': 'suspended',
};

// Dummy last-sign-in times, staggered so the accounts table has texture.
// Relative to the real clock so the demo never ages into "3 years ago".
// Invited people have never signed in, so they carry no timestamp at all.
export const lastActiveById: Record<string, IsoDateTime> = {
  'u-amara': hoursAgo(1),
  'u-sana': hoursAgo(2),
  'u-grace': hoursAgo(16),
  'u-david': hoursAgo(1),
  'u-tom': daysAgo(2),
  'u-faith': hoursAgo(3),
  'u-brian': daysAgo(3),
  'u-lydia': daysAgo(1),
  'u-kevin': hoursAgo(1),
  'u-nadia': daysAgo(4),
  'u-peter': hoursAgo(18),
  'u-ruth': daysAgo(13),
  'u-wanjiru': hoursAgo(2),
  'u-leila': daysAgo(2),
  'u-james': hoursAgo(1),
  'u-sam': hoursAgo(1),
};
