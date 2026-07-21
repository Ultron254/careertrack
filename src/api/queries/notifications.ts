import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from '../client';
import { endpoints } from '../endpoints';
import { notificationsSchema } from '../schemas/notification';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => request(notificationsSchema, endpoints.notifications.list()),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      request(z.undefined(), endpoints.notifications.read(notificationId), { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request(z.undefined(), endpoints.notifications.readAll(), { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
