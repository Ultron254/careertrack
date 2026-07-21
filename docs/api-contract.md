# CareerTrack API contract

This is the contract the frontend builds against. Every path here appears in `src/api/endpoints.ts`, and every response shape is the Zod schema the client parses with, so this document cannot drift from the code. All paths carry the `/api` prefix and expect and return JSON. The client attaches a bearer token and normalises failures into one shape.

## Conventions

- **Auth**: every request carries `Authorization: Bearer <token>` except in mock mode.
- **Entity fields**: every stored entity includes `id` (string), `createdAt` and `updatedAt` (ISO 8601 date time).
- **Errors**: the client normalises failures into `{ status: number, code: string, message: string }`. Handlers return at least one deliberate error per resource so the UI error states are reachable.
- **Dates**: `isoDateTime` is a full ISO 8601 timestamp. `isoDate` is a `YYYY-MM-DD` calendar date.

## Enums

```
Role         = 'employee' | 'manager' | 'people_team' | 'admin'
GoalCategory = 'Client' | 'Company' | 'People' | 'Financial'
GoalStatus   = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Returned'
CycleState   = 'upcoming' | 'open' | 'closing' | 'closed'
Rating       = 1 | 2 | 3 | 4
ReviewStage  = 'self' | 'manager' | 'peer' | 'final'

CalendarEventType = 'milestone' | 'checkin' | 'review' | 'appraisal' | 'deadline'
NotificationKind  = 'goal_returned' | 'goal_approved' | 'feedback_requested' | 'meeting_reminder' | 'system'
FeedbackTemplate  = 'full' | 'quick' | 'project'
ReviewDecision    = 'approved' | 'returned'
ReminderOffset    = '14d' | '7d' | '3d' | '1d' | 'due'
EscalationRule    = 'notify_manager' | 'notify_people_team' | 'auto_extend' | 'flag_record'
AdHocCondition    = 'specific_employee' | 'department' | 'circumstance'
ReportScope       = 'me' | 'member' | 'team' | 'employee' | 'dept' | 'org'
```

## Identity and organisation

### GET /api/me
Current signed in user. Returns `User`.

### GET /api/users
All users. Returns `User[]`.

### GET /api/users/:userId
One user. Returns `User`.

### GET /api/departments
Returns `Department[]`.

### GET /api/directory
Departments grouped with each member's aggregate cycle status. Returns `DirectoryEntry[]`.

```
User        = Entity & { name, email, role: Role, jobTitle, departmentId,
                         managerId: string | null, avatarUrl: string | null }
Department  = Entity & { name, colour, managerId }
DirectoryEntry = { departmentId, managerId, members: { userId, cycleStatus: GoalStatus }[] }
```

## Cycles and goals

### GET /api/cycles
Returns `Cycle[]`.

```
Cycle = Entity & { year, state: CycleState, opensAt, closesAt,
                   categoryWeights: Record<GoalCategory, number>,
                   enabledReviewStages: ReviewStage[] }
```

### GET /api/cycles/:cycleId/goals
Query: `ownerId` (optional; defaults to the current user). Returns `Goal[]`.

```
Goal = Entity & { cycleId, ownerId, category: GoalCategory, title, description,
                  outcomes, weight (0 to 100), targetDate (isoDate), isStretch,
                  status: GoalStatus, progress (0 to 100), privateNote: string | null }
```

### POST /api/cycles/:cycleId/goals
Body `GoalDraft`. Returns the created `Goal`.

```
GoalDraft = { cycleId, category, title, description, outcomes, weight,
              targetDate, isStretch, privateNote: string | null }
```

### PATCH /api/goals/:goalId
Body `GoalUpdate` (all `GoalDraft` fields optional, plus optional `progress`). Returns the updated `Goal`.

### DELETE /api/goals/:goalId
Returns `204 No Content`.

### POST /api/cycles/:cycleId/goals/submit
Submits every draft goal in the cycle. Returns the updated `Goal[]`. The server rejects submission unless weights total 100 and every required category has a goal.

### GET /api/goals/:goalId/comments
Returns `GoalComment[]`.

### POST /api/goals/:goalId/comments
Body `{ body: string }`. Returns the created `GoalComment`.

```
GoalComment = Entity & { goalId, authorId, body, postedAt }
```

## Manager review

### GET /api/reviews/queue
The current manager's direct reports awaiting review. Returns `ReviewQueueItem[]`.

```
ReviewQueueItem = { userId, goalCount, status: GoalStatus, overdue: boolean }
```

### POST /api/goals/:goalId/decision
Body `{ decision: ReviewDecision, comment: string | null }`. Returns the created `ReviewDecision`. A returned goal requires a comment.

```
ReviewDecision = Entity & { goalId, reviewerId, decision, comment: string | null, decidedAt }
```

### POST /api/reviews/bulk
Body `{ subjectIds: string[] (min 1), decision: ReviewDecision, comment: string }`. Returns `{ affected: number }`.

## Peer feedback

### GET /api/feedback/requests
Query: `box = 'inbox' | 'sent'`. Returns `FeedbackRequest[]`.

```
FeedbackRequest = Entity & { requesterId, peerId, template: FeedbackTemplate,
                             message, dueDate: isoDate | null, includesRating,
                             status: 'pending' | 'completed' }
```

### POST /api/feedback/requests
Body `{ peerIds: string[] (min 1), template, message, dueDate: isoDate | null, includesRating }`. Returns the created `FeedbackRequest[]`, one per peer.

### POST /api/feedback/requests/:requestId/response
Body `{ strengths: string (min 1), growthAreas: string, rating: Rating | null }`. Returns the created `FeedbackResponse`.

### GET /api/feedback/received
Feedback responses addressed to the current user. Returns `FeedbackResponse[]`.

```
FeedbackResponse = Entity & { requestId, strengths, growthAreas, rating: Rating | null }
```

## Appraisals and evaluations

### GET /api/cycles/:cycleId/appraisal
Query: `subjectId` (optional; defaults to the current user). Returns `Appraisal`.

```
Appraisal = Entity & { cycleId, subjectId, stage: ReviewStage,
                       perGoalRatings: Record<goalId, Rating>,
                       perGoalComments: Record<goalId, string>,
                       overallRating: Rating | null, overallComment,
                       growthAreas: GrowthArea[], submittedAt: isoDateTime | null }
GrowthArea = { id, area, whyItMatters, competencies }
```

### PUT /api/cycles/:cycleId/appraisal
Query: `subjectId` (optional). Body `AppraisalDraft`. Returns the saved `Appraisal`.

```
AppraisalDraft = { perGoalRatings, perGoalComments, overallRating: Rating | null,
                   overallComment, growthAreas: GrowthArea[] }
```

### POST /api/cycles/:cycleId/appraisal/submit
Query: `subjectId` (optional). Submits the appraisal. Returns the updated `Appraisal`.

### GET /api/evaluations/:year
The year end evaluation summary for a cycle year. Returns `YearEvaluation` (narrative, score, and per goal breakdown used by the My Goals evaluation panel).

## Dashboard and reports

### GET /api/dashboard
Role shaped dashboard: banner, KPIs, status donut, trend, category bars, primary list, status sidebar, and promo. Returns `Dashboard`. Colours travel as accent names (`teal | blue | orange | gold | ink`), not hex.

### GET /api/reports
Query: `scope: ReportScope`, `subjectId` (optional). Returns `Report`: KPIs, category bars, status donut, trend series, a table, and an AI insights block.

### POST /api/reports/export
Body `{ format: 'pdf' | 'xlsx' | 'csv' | 'pptx', scope: ReportScope }`. Returns `{ status: 'queued' | 'ready', format, url: string | null }`. Only `pdf` and `xlsx` resolve today; other formats return `501 format_not_available`.

### GET /api/reports/schedule
Returns `{ frequency: 'daily' | 'weekly' | 'monthly', enabled: boolean }`.

### PUT /api/reports/schedule
Body `{ frequency, enabled }`. Returns the saved schedule. Rejects an invalid body with `422 invalid_schedule`.

## Calendar

### GET /api/calendar/events
Query: `from` and `to` (ISO date times). Returns `CalendarEvent[]` whose start falls in the range.

```
CalendarEvent = Entity & { title, type: CalendarEventType, startsAt, endsAt,
                           attendeeIds: string[], reminderEnabled }
```

### POST /api/calendar/events
Body `{ title, type, startsAt, endsAt, attendeeIds, reminderEnabled }`. Returns the created `CalendarEvent` with `201`. Rejects an invalid body with `422 invalid_event`.

## Notifications

### GET /api/notifications
Returns `Notification[]`.

```
Notification = Entity & { userId, kind: NotificationKind, title, body,
                          readAt: isoDateTime | null, link }
```

### POST /api/notifications/:id/read
Marks a single notification read. Returns `204 No Content`. Responds `404 not_found`
when the id is unknown.

### POST /api/notifications/read-all
Marks all of the current user's notifications read. Returns `204 No Content`.

## HR configuration

### GET /api/hr-config
Returns `HrConfig`.

```
HrConfig = {
  categories:  { category: GoalCategory, defaultWeightPct (0 to 100), enabled }[],
  reviewStages:{ stage: ReviewStage, enabled, locked }[],
  reminders:   { offset: ReminderOffset, enabled }[],
  escalations: { rule: EscalationRule, enabled }[],
  adHocGoals:  { enabled, conditions: { condition: AdHocCondition, enabled }[] },
  cyclePhases: { name, startsOn, endsOn }[]
}
```

### PUT /api/hr-config
Body `HrConfig`. Returns the saved config. Only `people_team` and `admin` may write it (`403 forbidden` otherwise). The self and manager review stages cannot be disabled (`422 stage_locked`), and an invalid body returns `422 invalid_config`.
