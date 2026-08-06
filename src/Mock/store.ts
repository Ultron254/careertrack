import type { ReportSchedule } from '@/Types/report';
import type {
  AccountStatus,
  Appraisal,
  AuditEvent,
  CalendarEvent,
  FeedbackRequest,
  FeedbackResponse,
  Goal,
  GoalComment,
  IsoDateTime,
  Notification,
  ReviewDecision,
  TeamAppraisal,
  User,
} from '@/Types/domain';
import { accountStatusById, lastActiveById } from './fixtures/accounts';
import { appraisals } from './fixtures/appraisals';
import { auditEvents } from './fixtures/audit';
import { calendarEvents } from './fixtures/calendar';
import { feedbackRequests, feedbackResponses } from './fixtures/feedback';
import { goals } from './fixtures/goals';
import { hrConfig } from './fixtures/hrConfig';
import { notifications } from './fixtures/notifications';
import { goalComments, reviewDecisions } from './fixtures/reviews';
import { users } from './fixtures/users';

// In-memory stand-in for the database Laravel will own. Writes persist for
// the browser session and a reload starts fresh, which is exactly right for
// a demo. Action handlers mutate these collections the way Eloquent models
// would, then call commit() so every mounted page re-reads its props — the
// client-side equivalent of Inertia re-rendering after a redirect back.

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function seed() {
  return {
    users: clone(users) as User[],
    accountStatus: clone(accountStatusById) as Record<string, AccountStatus>,
    lastActive: clone(lastActiveById) as Record<string, IsoDateTime>,
    goals: clone(goals) as Goal[],
    goalComments: clone(goalComments) as GoalComment[],
    reviewDecisions: clone(reviewDecisions) as ReviewDecision[],
    feedbackRequests: clone(feedbackRequests) as FeedbackRequest[],
    feedbackResponses: clone(feedbackResponses) as FeedbackResponse[],
    appraisals: clone(appraisals) as Appraisal[],
    teamAppraisals: [] as TeamAppraisal[],
    auditLog: clone(auditEvents) as AuditEvent[],
    calendarEvents: clone(calendarEvents) as CalendarEvent[],
    notifications: clone(notifications) as Notification[],
    hrConfig: clone(hrConfig),
    reportSchedule: { frequency: 'weekly', enabled: false } as ReportSchedule,
  };
}

export let db = seed();

export function resetDb() {
  db = seed();
  commit();
}

let counter = 0;
export const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${counter++}`;

// -- Change notification ----------------------------------------------------
// A single monotonic version stands in for "the server has new data". Pages
// subscribe via useSyncExternalStore, so a commit re-runs every mounted prop
// resolver — mirroring how an Inertia visit delivers a fresh props payload.

let version = 0;
const listeners = new Set<() => void>();

export const storeVersion = () => version;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function commit() {
  version++;
  for (const listener of listeners) listener();
}
