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
import { router } from '@/Lib/router';
import { useToast } from '@/Components/ui/Toast';
import type { CalendarEvent } from '@/Types/domain';
import type { Accent } from '@/Types/dashboard';

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

export function useCalendar(allEvents: CalendarEvent[]) {
  const toast = useToast();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [view, setView] = useState<'month' | 'week'>('month');
  const [scheduling, setScheduling] = useState(false);

  const rangeStart = startOfMonth(month);
  const rangeEnd = endOfMonth(month);
  const fromIso = rangeStart.toISOString();
  const toIso = rangeEnd.toISOString();

  // The page holds the whole calendar; the grid only shows the month in view.
  const events = useMemo(
    () => allEvents.filter((event) => event.startsAt >= fromIso && event.startsAt <= toIso),
    [allEvents, fromIso, toIso],
  );

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
    // rangeStart/rangeEnd derive from month; events is the month's slice.
  }, [rangeStart, rangeEnd, events]);

  // In week view we show just the seven-day row that holds today (or the first
  // week of the month when today falls outside it).
  const visibleDays: DayCell[] = useMemo(() => {
    if (view === 'month') return days;
    const weeks: DayCell[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    const weekWithToday = weeks.find((week) => week.some((cell) => cell.isToday));
    return weekWithToday ?? weeks[0] ?? [];
  }, [days, view]);

  const milestones = events
    .filter((event) => event.type === 'milestone' || event.type === 'deadline')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const now = Date.now();
  const upcoming = [...events]
    .filter((event) => parseISO(event.startsAt).getTime() >= now - 86_400_000)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);

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
      setScheduling(true);
      void router.post(
        '/calendar/events',
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
          onError: (errors) => {
            toast(Object.values(errors)[0] ?? 'That meeting did not schedule.', 'error');
            resolve(false);
          },
          onFinish: () => setScheduling(false),
        },
      );
    });

  return {
    monthLabel: format(month, 'MMMM yyyy'),
    prevMonth: () => setMonth((m) => subMonths(m, 1)),
    nextMonth: () => setMonth((m) => addMonths(m, 1)),
    view,
    setView,
    days: visibleDays,
    milestones,
    upcoming,
    schedule,
    scheduling,
  };
}
