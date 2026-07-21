import { http, HttpResponse } from 'msw';
import { feedbackRequestBodySchema, feedbackResponseBodySchema } from '@/api/schemas/feedback';
import type { FeedbackRequest } from '@/types/domain';
import { db, nextId } from '../db';
import { currentUser, errorJson, latency } from './utils';

export const feedbackHandlers = [
  http.get('/api/feedback/requests', async ({ request }) => {
    await latency();
    const me = currentUser(request);
    const box = new URL(request.url).searchParams.get('box') ?? 'inbox';
    const rows =
      box === 'sent'
        ? db.feedbackRequests.filter((r) => r.requesterId === me.id)
        : db.feedbackRequests.filter((r) => r.peerId === me.id && r.status === 'pending');
    return HttpResponse.json(rows);
  }),

  http.post('/api/feedback/requests', async ({ request }) => {
    await latency();
    const body = feedbackRequestBodySchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_request', body.error.issues[0].message);
    const me = currentUser(request);
    const now = new Date().toISOString();
    const created: FeedbackRequest[] = body.data.peerIds.map((peerId) => ({
      id: nextId('fr'),
      requesterId: me.id,
      peerId,
      template: body.data.template,
      message: body.data.message,
      dueDate: body.data.dueDate,
      includesRating: body.data.includesRating,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }));
    db.feedbackRequests.unshift(...created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post('/api/feedback/requests/:requestId/response', async ({ request, params }) => {
    await latency();
    const feedbackRequest = db.feedbackRequests.find((r) => r.id === params.requestId);
    if (!feedbackRequest) return errorJson(404, 'request_not_found', 'No request with that id.');
    if (feedbackRequest.status === 'completed') {
      return errorJson(409, 'already_answered', 'This request was already answered.');
    }
    const body = feedbackResponseBodySchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_response', body.error.issues[0].message);
    const now = new Date().toISOString();
    const response = {
      id: nextId('fres'),
      requestId: feedbackRequest.id,
      ...body.data,
      createdAt: now,
      updatedAt: now,
    };
    db.feedbackResponses.push(response);
    feedbackRequest.status = 'completed';
    feedbackRequest.updatedAt = now;
    return HttpResponse.json(response, { status: 201 });
  }),

  http.get('/api/feedback/received', async ({ request }) => {
    await latency();
    const me = currentUser(request);
    const myRequestIds = new Set(
      db.feedbackRequests.filter((r) => r.requesterId === me.id).map((r) => r.id),
    );
    return HttpResponse.json(db.feedbackResponses.filter((r) => myRequestIds.has(r.requestId)));
  }),
];
