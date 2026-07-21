import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../client';
import { endpoints } from '../endpoints';
import {
  feedbackRequestsSchema,
  feedbackResponseSchema,
  feedbackResponsesSchema,
  type FeedbackRequestBody,
  type FeedbackResponseBody,
} from '../schemas/feedback';

export function useFeedbackRequests(box: 'inbox' | 'sent') {
  return useQuery({
    queryKey: ['feedback-requests', box],
    queryFn: () => request(feedbackRequestsSchema, endpoints.feedback.requests(box)),
  });
}

export function useFeedbackReceived() {
  return useQuery({
    queryKey: ['feedback-received'],
    queryFn: () => request(feedbackResponsesSchema, endpoints.feedback.received()),
  });
}

export function useSendFeedbackRequests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FeedbackRequestBody) =>
      request(feedbackRequestsSchema, endpoints.feedback.createRequests(), {
        method: 'POST',
        body,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback-requests'] }),
  });
}

export function useRespondToFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, ...body }: FeedbackResponseBody & { requestId: string }) =>
      request(feedbackResponseSchema, endpoints.feedback.respond(requestId), {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-requests'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-received'] });
    },
  });
}
