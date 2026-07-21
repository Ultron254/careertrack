import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useCalendarEvents, useCreateCalendarEvent } from '@/api/queries/calendar';
import { useUsers } from '@/api/queries/org';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import type { CalendarEvent } from '@/types/domain';
import type { Accent } from '@/api/schemas/dashboard';

export type MeetingType = 'checkin' | 'review' | 'appraisal';

export const eventAccent: Record<CalendarEvent['type'], Accent> = {
  milestone: 'teal',
  checkin: 'blue',
  review: 'gold',
  appraisal: 'gold',
  deadline: 'orange',
};

export interface DayCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export function useCalendar() {
  const toast = useToast();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const rangeStart = startOfMonth(month);
  const rangeEnd = endOfMonth(month);
  const eventsQuery = useCalendarEvents(rangeStart.toISOString(), rangeEnd.toISOString());
  const usersQuery = useUsers();
  const createEvent = useCreateCalendarEvent();

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  const days: DayCell[] = useMemo(() => {
    const firstWeekday = rangeStart.getDay();
    const monthDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    const leading: DayCell[] = Array.from({ length: firstWeekday }, (_, i) => ({
      date: new Date(rangeStart.getFullYear(), rangeStart.getMonth(), i - firstWeekday + 1),
      inMonth: false,
      isToday: false,
      events: [],
    }));
    const cells = monthDays.map((date) => ({
      date,
      inMonth: true,
      isToday: isToday(date),
      events: events.filter((event) => isSameDay(parseISO(event.startsAt), date)),
    }));
    return [...leading, ...cells];
    // rangeStart/rangeEnd derive from month; events is the query result.
  }, [rangeStart, rangeEnd, events]);

  const milestones = events
    .filter((event) => event.type === 'milestone' || event.type === 'deadline')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const now = Date.now();
  const upcoming = [...events]
    .filter((event) => parseISO(event.startsAt).getTime() >= now - 86_400_000)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);

  const attendees = usersQuery.data ?? [];

  const schedule = (input: {
    title: string;
    type: MeetingType;
    date: string;
    time: string;
    attendeeIds: string[];
    reminderEnabled: boolean;
  }) =>
    new Promise<boolean>((resolve) => {
      const startsAt = new Date(`${input.date}T${input.time || '09:00'}`);
      const endsAt = new Date(startsAt.getTime() + 45 * 60_000);
      createEvent.mutate(
        {
          title: input.title,
          type: input.type,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          attendeeIds: input.attendeeIds,
          reminderEnabled: input.reminderEnabled,
        },
        {
          onSuccess: () => resolve(true),
          onError: (error) => {
            toast(error instanceof ApiError ? error.message : 'That meeting did not schedule.', 'error');
            resolve(false);
          },
        },
      );
    });

  return {
    monthLabel: format(month, 'MMMM yyyy'),
    prevMonth: () => setMonth((m) => subMonths(m, 1)),
    nextMonth: () => setMonth((m) => addMonths(m, 1)),
    days,
    milestones,
    upcoming,
    attendees,
    isPending: eventsQuery.isPending,
    isError: eventsQuery.isError,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,
    schedule,
    scheduling: createEvent.isPending,
  };
}
