import { z } from 'zod';
import type { CalendarEvent } from '@/types/domain';
import { entityFields, isoDateTime } from './common';

export const calendarEventTypeSchema = z.enum([
  'milestone',
  'checkin',
  'review',
  'appraisal',
  'deadline',
]);

export const calendarEventSchema = z.object({
  ...entityFields,
  title: z.string(),
  type: calendarEventTypeSchema,
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  attendeeIds: z.array(z.string()),
  reminderEnabled: z.boolean(),
}) satisfies z.ZodType<CalendarEvent>;

export const calendarEventsSchema = z.array(calendarEventSchema);

export const calendarEventBodySchema = calendarEventSchema.pick({
  title: true,
  type: true,
  startsAt: true,
  endsAt: true,
  attendeeIds: true,
  reminderEnabled: true,
});
export type CalendarEventBody = z.infer<typeof calendarEventBodySchema>;
