import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from '../client';
import { endpoints } from '../endpoints';
import { cyclesSchema } from '../schemas/cycle';
import {
  goalCommentSchema,
  goalCommentsSchema,
  goalSchema,
  goalsSchema,
  type GoalDraft,
  type GoalUpdate,
} from '../schemas/goal';

export function useCycles() {
  return useQuery({
    queryKey: ['cycles'],
    queryFn: () => request(cyclesSchema, endpoints.cycles.list()),
    staleTime: 5 * 60_000,
  });
}

export function useGoals(cycleId: string | undefined, ownerId?: string) {
  return useQuery({
    queryKey: ['goals', cycleId, ownerId ?? 'me'],
    queryFn: () => request(goalsSchema, endpoints.goals.list(cycleId!, ownerId)),
    enabled: !!cycleId,
  });
}

export function useCreateGoal(cycleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: GoalDraft) =>
      request(goalSchema, endpoints.goals.create(cycleId), { method: 'POST', body: draft }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, changes }: { goalId: string; changes: GoalUpdate }) =>
      request(goalSchema, endpoints.goals.update(goalId), { method: 'PATCH', body: changes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) =>
      request(z.undefined(), endpoints.goals.remove(goalId), { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useSubmitGoals(cycleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request(goalsSchema, endpoints.goals.submitAll(cycleId), { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useGoalComments(goalId: string | null) {
  return useQuery({
    queryKey: ['goal-comments', goalId],
    queryFn: () => request(goalCommentsSchema, endpoints.goals.comments(goalId!)),
    enabled: !!goalId,
  });
}

export function useAddGoalComment(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      request(goalCommentSchema, endpoints.goals.comments(goalId), {
        method: 'POST',
        body: { body },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goal-comments', goalId] }),
  });
}
