import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import { hrConfigSchema, type HrConfig } from '../schemas/hrConfig';

export function useHrConfig() {
  return useQuery({
    queryKey: ['hr-config'],
    queryFn: () => request(hrConfigSchema, endpoints.hrConfig()),
  });
}

export function useSaveHrConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: HrConfig) =>
      request(hrConfigSchema, endpoints.hrConfig(), { method: 'PUT', body: config }),
    onSuccess: (config) => queryClient.setQueryData(['hr-config'], config),
  });
}
