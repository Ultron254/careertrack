import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import { dashboardSchema } from '../schemas/dashboard';
import {
  exportResultSchema,
  reportSchema,
  reportScheduleSchema,
  type ReportSchedule,
  type ReportScope,
} from '../schemas/report';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => request(dashboardSchema, endpoints.dashboard()),
  });
}

export function useReport(scope: ReportScope, subjectId?: string) {
  return useQuery({
    queryKey: ['report', scope, subjectId ?? 'all'],
    queryFn: () => request(reportSchema, endpoints.reports.get(scope, subjectId)),
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: (body: { format: 'pdf' | 'xlsx' | 'csv' | 'pptx'; scope: ReportScope }) =>
      request(exportResultSchema, endpoints.reports.export(), { method: 'POST', body }),
  });
}

export function useReportSchedule() {
  return useQuery({
    queryKey: ['report-schedule'],
    queryFn: () => request(reportScheduleSchema, endpoints.reports.schedule()),
  });
}

export function useSaveReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReportSchedule) =>
      request(reportScheduleSchema, endpoints.reports.schedule(), { method: 'PUT', body }),
    onSuccess: (schedule) => queryClient.setQueryData(['report-schedule'], schedule),
  });
}
