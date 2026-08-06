// The shared domain model. The backend builds against these shapes — every
// page prop and form payload in src/Types is composed from what lives here.

export type Role = 'employee' | 'manager' | 'people_team' | 'admin';

export type GoalCategory = 'Client' | 'Company' | 'People' | 'Financial';

export type GoalStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Returned';

export type CycleState = 'upcoming' | 'open' | 'closing' | 'closed';

// The whole product rates 1 to 4. Never render a five star control.
export type Rating = 1 | 2 | 3 | 4;

export type ReviewStage = 'self' | 'manager' | 'peer' | 'final';

// Timestamps are ISO 8601 strings with offset; date-only fields are YYYY-MM-DD.
export type IsoDateTime = string;
export type IsoDate = string;

interface Entity {
  id: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface User extends Entity {
  name: string;
  email: string;
  role: Role;
  jobTitle: string;
  departmentId: string | null;
  managerId: string | null;
  // Populated by the backend from Microsoft Graph photos; null renders initials.
  avatarUrl: string | null;
}

export interface Department extends Entity {
  name: string;
  colour: string;
  managerId: string;
}

export interface Cycle extends Entity {
  year: number;
  state: CycleState;
  opensAt: IsoDateTime;
  closesAt: IsoDateTime;
  // Default weight per category; individual goals may deviate but a
  // submission must still total 100 across all goals.
  categoryWeights: Record<GoalCategory, number>;
  enabledReviewStages: ReviewStage[];
}

export interface Goal extends Entity {
  cycleId: string;
  ownerId: string;
  category: GoalCategory;
  title: string;
  description: string;
  // The measurable results agreed with the manager, free text.
  outcomes: string;
  // Percentage of the owner's cycle, 0 to 100.
  weight: number;
  targetDate: IsoDate;
  isStretch: boolean;
  status: GoalStatus;
  // Check-in progress, 0 to 100 in steps of 25.
  progress: number;
  // Visible only to the goal owner, never to managers or HR.
  privateNote: string | null;
}

export interface GoalComment extends Entity {
  goalId: string;
  authorId: string;
  body: string;
  postedAt: IsoDateTime;
}

export interface ReviewDecision extends Entity {
  goalId: string;
  reviewerId: string;
  decision: 'approved' | 'returned';
  // Required when returning, optional when approving.
  comment: string | null;
  decidedAt: IsoDateTime;
}

export type FeedbackTemplate = 'full' | 'quick' | 'project';

export interface FeedbackRequest extends Entity {
  requesterId: string;
  peerId: string;
  template: FeedbackTemplate;
  message: string;
  dueDate: IsoDate | null;
  includesRating: boolean;
  status: 'pending' | 'completed';
}

export interface FeedbackResponse extends Entity {
  requestId: string;
  strengths: string;
  growthAreas: string;
  // Present only when the request asked for a rating.
  rating: Rating | null;
}

export interface GrowthArea {
  id: string;
  area: string;
  whyItMatters: string;
  competencies: string;
}

export interface Appraisal extends Entity {
  cycleId: string;
  subjectId: string;
  stage: ReviewStage;
  // Keyed by goal id.
  perGoalRatings: Record<string, Rating>;
  perGoalComments: Record<string, string>;
  overallRating: Rating | null;
  overallComment: string;
  growthAreas: GrowthArea[];
  // Null while the appraisal is still a draft.
  submittedAt: IsoDateTime | null;
}

export type CalendarEventType = 'milestone' | 'checkin' | 'review' | 'appraisal' | 'deadline';

export interface CalendarEvent extends Entity {
  title: string;
  type: CalendarEventType;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  attendeeIds: string[];
  reminderEnabled: boolean;
}

export type NotificationKind =
  'goal_returned' | 'goal_approved' | 'feedback_requested' | 'meeting_reminder' | 'system';

export interface Notification extends Entity {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  // Null while unread.
  readAt: IsoDateTime | null;
  // In-app path the notification opens, e.g. /goals.
  link: string;
}

// --- Administration ---------------------------------------------------------

// Provisioning state owned by the identity provider. `invited` accounts have
// never signed in; `suspended` accounts keep their history but cannot sign in.
export type AccountStatus = 'active' | 'invited' | 'suspended';

export interface AdminAccount {
  user: User;
  status: AccountStatus;
  // Null when the person has never signed in.
  lastActiveAt: IsoDateTime | null;
}

// One entry in the administrative audit trail. Admin and People Team actions
// append here; the log itself is immutable.
export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  action:
    | 'account_invited'
    | 'role_changed'
    | 'account_suspended'
    | 'account_reactivated'
    | 'invite_resent'
    | 'password_reset_sent'
    | 'config_updated'
    | 'appraisal_locked';
  detail: string;
  at: IsoDateTime;
}

// --- Team appraisals ----------------------------------------------------------

// A manager walks each report through these stages after the self-appraisal.
export type TeamAppraisalStage = 'manager' | 'discussion' | 'acknowledge' | 'done';

export type FinalRatingStatus = 'open' | 'proposed' | 'locked' | 'flagged' | 'resolved';

export interface FinalRating {
  value: Rating | null;
  status: FinalRatingStatus;
}

export type SignatureParty = 'employee' | 'manager' | 'people_team';

// The manager-side record of a report's appraisal: the manager's ratings and
// evidence, the agreed finals from the alignment discussion, and the three
// sign-offs that lock the record.
export interface TeamAppraisal extends Entity {
  cycleId: string;
  subjectId: string;
  managerId: string;
  stage: TeamAppraisalStage;
  // Keyed by goal id.
  managerRatings: Record<string, Rating>;
  evidence: Record<string, string>;
  overallComment: string;
  finals: Record<string, FinalRating>;
  // Timestamp of each signature; null until that party signs.
  signatures: Record<SignatureParty, IsoDateTime | null>;
}
