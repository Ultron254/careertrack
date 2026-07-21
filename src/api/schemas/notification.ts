import { z } from 'zod';
import type { Notification } from '@/types/domain';
import { entityFields, isoDateTime } from './common';

export const notificationKindSchema = z.enum([
  'goal_returned',
  'goal_approved',
  'feedback_requested',
  'meeting_reminder',
]);

export const notificationSchema = z.object({
  ...entityFields,
  userId: z.string(),
  kind: notificationKindSchema,
  title: z.string(),
  body: z.string(),
  readAt: isoDateTime.nullable(),
  link: z.string(),
}) satisfies z.ZodType<Notification>;

export const notificationsSchema = z.array(notificationSchema);
