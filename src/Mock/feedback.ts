import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { PeerFeedbackProps } from '@/Pages/feedback/PeerFeedback';
import type { FeedbackRequest, FeedbackTemplate, Rating } from '@/Types/domain';
import { db, nextId } from './store';

// Mock counterpart of FeedbackController@index: the three boxes the page
// shows. Inbox is what I still owe others, sent is everything I asked for,
// and received joins responses back to my own requests.
export const feedbackProps: PageResolver<PeerFeedbackProps> = ({ user }) => {
  const sent = db.feedbackRequests.filter((r) => r.requesterId === user.id);
  const myRequestIds = new Set(sent.map((r) => r.id));
  return {
    inbox: db.feedbackRequests.filter((r) => r.peerId === user.id && r.status === 'pending'),
    sent,
    received: db.feedbackResponses.filter((r) => myRequestIds.has(r.requestId)),
    users: db.users,
  };
};

const templates: FeedbackTemplate[] = ['full', 'quick', 'project'];
const ratings = [1, 2, 3, 4];

// Fanning one composer submission out into a pending request per colleague.
// Newest requests sit at the top of the sent list.
registerAction('post', '/feedback/requests', ({ user, body }) => {
  const errors: Record<string, string> = {};
  const peerIds = Array.isArray(body.peerIds) ? (body.peerIds as string[]) : [];
  if (peerIds.length === 0) errors.peerIds = 'Pick at least one colleague.';
  if (!templates.includes(body.template as FeedbackTemplate)) {
    errors.template = 'Choose a template.';
  }
  if (typeof body.message !== 'string') errors.message = 'The message must be text.';
  if (
    body.dueDate !== null &&
    !(typeof body.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate))
  ) {
    errors.dueDate = 'The due date must be a real date.';
  }
  if (typeof body.includesRating !== 'boolean') {
    errors.includesRating = 'Say whether a rating is wanted.';
  }
  if (Object.keys(errors).length > 0) return { errors };

  const now = new Date().toISOString();
  const created: FeedbackRequest[] = peerIds.map((peerId) => ({
    id: nextId('fr'),
    requesterId: user.id,
    peerId,
    template: body.template as FeedbackTemplate,
    message: body.message as string,
    dueDate: body.dueDate as string | null,
    includesRating: body.includesRating as boolean,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }));
  db.feedbackRequests.unshift(...created);
});

// Answering a request completes it — a request only ever gets one response,
// so a second attempt is refused rather than silently overwriting.
registerAction('post', '/feedback/requests/:requestId/response', ({ params, body }) => {
  const request = db.feedbackRequests.find((r) => r.id === params.requestId);
  if (!request) return { errors: { request: 'No request with that id.' } };
  if (request.status === 'completed') {
    return { errors: { request: 'This request was already answered.' } };
  }
  const errors: Record<string, string> = {};
  if (typeof body.strengths !== 'string' || body.strengths.length === 0) {
    errors.strengths = 'Share at least one strength.';
  }
  if (typeof body.growthAreas !== 'string') errors.growthAreas = 'Growth areas must be text.';
  if (body.rating !== null && !ratings.includes(body.rating as number)) {
    errors.rating = 'The rating must be between 1 and 4.';
  }
  if (Object.keys(errors).length > 0) return { errors };

  const now = new Date().toISOString();
  db.feedbackResponses.push({
    id: nextId('fres'),
    requestId: request.id,
    strengths: body.strengths as string,
    growthAreas: body.growthAreas as string,
    rating: body.rating as Rating | null,
    createdAt: now,
    updatedAt: now,
  });
  request.status = 'completed';
  request.updatedAt = now;
});
