import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { CalendarProps } from '@/Pages/calendar/Calendar';
import type { CalendarEvent, CalendarEventType } from '@/Types/domain';
import { db, nextId } from './store';

// Mock counterpart of CalendarController@index: every event plus the people
// who can be invited. The calendar is small enough to send whole; the page
// narrows to the month in view.
export const calendarProps: PageResolver<CalendarProps> = () => ({
  events: db.calendarEvents,
  attendees: db.users,
});

const eventTypes: CalendarEventType[] = ['milestone', 'checkin', 'review', 'appraisal', 'deadline'];

// Booking a meeting. The guards mirror what the store request will enforce
// server-side; the client normally sends a well-formed event, so these only
// trip on genuinely broken input.
registerAction('post', '/calendar/events', ({ body }) => {
  const errors: Record<string, string> = {};
  if (typeof body.title !== 'string') errors.title = 'A meeting needs a title.';
  if (!eventTypes.includes(body.type as CalendarEventType)) {
    errors.type = 'Choose a valid meeting type.';
  }
  if (typeof body.startsAt !== 'string' || Number.isNaN(Date.parse(body.startsAt))) {
    errors.startsAt = 'The start time must be a valid date.';
  }
  if (typeof body.endsAt !== 'string' || Number.isNaN(Date.parse(body.endsAt))) {
    errors.endsAt = 'The end time must be a valid date.';
  }
  if (!Array.isArray(body.attendeeIds)) errors.attendeeIds = 'Attendees must be a list.';
  if (typeof body.reminderEnabled !== 'boolean') {
    errors.reminderEnabled = 'The reminder must be on or off.';
  }
  if (Object.keys(errors).length > 0) return { errors };

  const now = new Date().toISOString();
  const event: CalendarEvent = {
    id: nextId('ev'),
    title: body.title as string,
    type: body.type as CalendarEventType,
    startsAt: body.startsAt as string,
    endsAt: body.endsAt as string,
    attendeeIds: body.attendeeIds as string[],
    reminderEnabled: body.reminderEnabled as boolean,
    createdAt: now,
    updatedAt: now,
  };
  db.calendarEvents.push(event);
});
