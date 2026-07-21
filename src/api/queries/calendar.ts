import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import {
  calendarEventSchema,
  calendarEventsSchema,
  type CalendarEventBody,
} from '../schemas/calendarEvent';

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar', from, to],
    queryFn: () => request(calendarEventsSchema, endpoints.calendar.events(from, to)),
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CalendarEventBody) =>
      request(calendarEventSchema, endpoints.calendar.create(), { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar'] }),
  });
}
