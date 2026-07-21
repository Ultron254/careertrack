import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import {
  bulkReviewResultSchema,
  reviewDecisionSchema,
  reviewQueueSchema,
  type BulkReviewBody,
  type ReviewDecisionBody,
} from '../schemas/review';

export function useReviewQueue() {
  return useQuery({
    queryKey: ['review-queue'],
    queryFn: () => request(reviewQueueSchema, endpoints.reviews.queue()),
  });
}

export function useDecideGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, ...body }: ReviewDecisionBody & { goalId: string }) =>
      request(reviewDecisionSchema, endpoints.reviews.decide(goalId), {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
  });
}

export function useBulkReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkReviewBody) =>
      request(bulkReviewResultSchema, endpoints.reviews.bulk(), { method: 'POST', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
  });
}
