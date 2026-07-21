import type { ReportSchedule } from '@/api/schemas/report';
import type {
  Appraisal,
  CalendarEvent,
  FeedbackRequest,
  FeedbackResponse,
  Goal,
  GoalComment,
  Notification,
  ReviewDecision,
} from '@/types/domain';
import { appraisals } from './fixtures/appraisals';
import { calendarEvents } from './fixtures/calendar';
import { feedbackRequests, feedbackResponses } from './fixtures/feedback';
import { goals } from './fixtures/goals';
import { hrConfig } from './fixtures/hrConfig';
import { notifications } from './fixtures/notifications';
import { goalComments, reviewDecisions } from './fixtures/reviews';

// Mutable copy of the fixtures so writes persist for the browser session.
// A reload starts fresh, which is exactly right for a demo.

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function seed() {
  return {
    goals: clone(goals) as Goal[],
    goalComments: clone(goalComments) as GoalComment[],
    reviewDecisions: clone(reviewDecisions) as ReviewDecision[],
    feedbackRequests: clone(feedbackRequests) as FeedbackRequest[],
    feedbackResponses: clone(feedbackResponses) as FeedbackResponse[],
    appraisals: clone(appraisals) as Appraisal[],
    calendarEvents: clone(calendarEvents) as CalendarEvent[],
    notifications: clone(notifications) as Notification[],
    hrConfig: clone(hrConfig),
    reportSchedule: { frequency: 'weekly', enabled: false } as ReportSchedule,
  };
}

export let db = seed();

export function resetDb() {
  db = seed();
}

let counter = 0;
export const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${counter++}`;
