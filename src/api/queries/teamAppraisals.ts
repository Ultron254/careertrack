import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import {
  calibrationSchema,
  teamAppraisalSchema,
  type SignaturePartyInput,
  type TeamAppraisalDraft,
} from '../schemas/teamAppraisal';

export function useTeamAppraisal(cycleId: string | undefined, subjectId: string) {
  return useQuery({
    queryKey: ['teamAppraisal', cycleId, subjectId],
    queryFn: () => request(teamAppraisalSchema, endpoints.teamAppraisals.get(cycleId!, subjectId)),
    enabled: !!cycleId,
  });
}

export function useSaveTeamAppraisal(cycleId: string, subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: TeamAppraisalDraft) =>
      request(teamAppraisalSchema, endpoints.teamAppraisals.save(cycleId, subjectId), {
        method: 'PUT',
        body: draft,
      }),
    onSuccess: (record) => {
      queryClient.setQueryData(['teamAppraisal', cycleId, subjectId], record);
      void queryClient.invalidateQueries({ queryKey: ['calibration', cycleId] });
    },
  });
}

export function useSignTeamAppraisal(cycleId: string, subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (party: SignaturePartyInput) =>
      request(teamAppraisalSchema, endpoints.teamAppraisals.sign(cycleId, subjectId), {
        method: 'POST',
        body: { party },
      }),
    onSuccess: (record) => {
      queryClient.setQueryData(['teamAppraisal', cycleId, subjectId], record);
      void queryClient.invalidateQueries({ queryKey: ['calibration', cycleId] });
    },
  });
}

export function useCalibration(cycleId: string | undefined) {
  return useQuery({
    queryKey: ['calibration', cycleId],
    queryFn: () => request(calibrationSchema, endpoints.calibration(cycleId!)),
    enabled: !!cycleId,
  });
}
