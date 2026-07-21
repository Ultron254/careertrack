import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import { appraisalSchema, type AppraisalDraft } from '../schemas/appraisal';
import { yearEvaluationSchema } from '../schemas/evaluation';

export function useAppraisal(cycleId: string | undefined, subjectId?: string) {
  return useQuery({
    queryKey: ['appraisal', cycleId, subjectId ?? 'me'],
    queryFn: () => request(appraisalSchema, endpoints.appraisals.get(cycleId!, subjectId)),
    enabled: !!cycleId,
  });
}

export function useSaveAppraisal(cycleId: string, subjectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: AppraisalDraft) =>
      request(appraisalSchema, endpoints.appraisals.save(cycleId, subjectId), {
        method: 'PUT',
        body: draft,
      }),
    onSuccess: (appraisal) =>
      queryClient.setQueryData(['appraisal', cycleId, subjectId ?? 'me'], appraisal),
  });
}

export function useSubmitAppraisal(cycleId: string, subjectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request(appraisalSchema, endpoints.appraisals.submit(cycleId, subjectId), {
        method: 'POST',
      }),
    onSuccess: (appraisal) =>
      queryClient.setQueryData(['appraisal', cycleId, subjectId ?? 'me'], appraisal),
  });
}

// Fetched on demand when someone opens the evaluation panel for a year.
export function useYearEvaluation(year: number, open: boolean) {
  return useQuery({
    queryKey: ['evaluation', year],
    queryFn: () => request(yearEvaluationSchema, endpoints.evaluations.year(year)),
    enabled: open,
    staleTime: Infinity,
  });
}
