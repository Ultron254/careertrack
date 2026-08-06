import { registerAction } from '@/Lib/router';
import type { PageResolver } from '@/Lib/page';
import type { AppraisalProps, TeamReviewData } from '@/Pages/appraisals/Appraisal';
import type {
  Appraisal,
  FinalRating,
  GrowthArea,
  Rating,
  SignatureParty,
  TeamAppraisal,
  TeamAppraisalStage,
  User,
} from '@/Types/domain';
import type { Calibration, CalibrationRow } from '@/Types/teamAppraisal';
import { recordAudit } from './admin';
// Peer appraisal requests reuse the feedback actions, so make sure they are
// registered whenever this page is served.
import './feedback';
import { calibrationBaseline } from './fixtures/calibration';
import { cycles } from './fixtures/cycles';
import { departments } from './fixtures/departments';
import { db, nextId } from './store';

// Self-appraisal writes. An appraisal row springs into existence the first
// time anyone touches it for a cycle, the way the controller would
// firstOrCreate against the appraisals table.

export function findOrCreateAppraisal(cycleId: string, subjectId: string): Appraisal {
  let appraisal = db.appraisals.find((a) => a.cycleId === cycleId && a.subjectId === subjectId);
  if (!appraisal) {
    const now = new Date().toISOString();
    appraisal = {
      id: nextId('ap'),
      cycleId,
      subjectId,
      stage: 'self',
      perGoalRatings: {},
      perGoalComments: {},
      overallRating: null,
      overallComment: '',
      growthAreas: [],
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    db.appraisals.push(appraisal);
  }
  return appraisal;
}

const isRating = (value: unknown): value is Rating =>
  value === 1 || value === 2 || value === 3 || value === 4;

const isGrowthArea = (value: unknown): value is GrowthArea =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as GrowthArea).id === 'string' &&
  typeof (value as GrowthArea).area === 'string' &&
  typeof (value as GrowthArea).whyItMatters === 'string' &&
  typeof (value as GrowthArea).competencies === 'string';

// The whole draft arrives on every save, so every field is checked.
function draftErrors(body: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  const ratings = body.perGoalRatings;
  if (typeof ratings !== 'object' || ratings === null || !Object.values(ratings).every(isRating)) {
    errors.perGoalRatings = 'Each goal rating must be between 1 and 4.';
  }
  const comments = body.perGoalComments;
  if (
    typeof comments !== 'object' ||
    comments === null ||
    !Object.values(comments).every((c) => typeof c === 'string')
  ) {
    errors.perGoalComments = 'Goal comments must be text.';
  }
  if (body.overallRating !== null && !isRating(body.overallRating)) {
    errors.overallRating = 'The overall rating must be between 1 and 4.';
  }
  if (typeof body.overallComment !== 'string') {
    errors.overallComment = 'The overall comment must be text.';
  }
  if (!Array.isArray(body.growthAreas) || !body.growthAreas.every(isGrowthArea)) {
    errors.growthAreas = 'Growth areas are not in the expected shape.';
  }
  return errors;
}

// Whose appraisal a write targets: a reviewer names the subject, otherwise
// it is the signed-in person's own record.
const subjectFor = (body: Record<string, unknown>, userId: string) =>
  typeof body.subjectId === 'string' ? body.subjectId : userId;

// Saving an appraisal draft. Submission freezes the record for calibration,
// so a late save is refused rather than silently overwriting.
registerAction('put', '/cycles/:cycleId/appraisal', ({ user, params, body }) => {
  const errors = draftErrors(body);
  if (Object.keys(errors).length > 0) return { errors };
  const appraisal = findOrCreateAppraisal(params.cycleId, subjectFor(body, user.id));
  if (appraisal.submittedAt) {
    return { errors: { appraisal: 'A submitted appraisal can no longer change.' } };
  }
  appraisal.perGoalRatings = body.perGoalRatings as Record<string, Rating>;
  appraisal.perGoalComments = body.perGoalComments as Record<string, string>;
  appraisal.overallRating = body.overallRating as Rating | null;
  appraisal.overallComment = body.overallComment as string;
  appraisal.growthAreas = body.growthAreas as GrowthArea[];
  appraisal.updatedAt = new Date().toISOString();
});

// Submitting an appraisal. The overall rating is the one field that must be
// in place; the timestamp is what locks the record.
registerAction('post', '/cycles/:cycleId/appraisal/submit', ({ user, params, body }) => {
  const appraisal = findOrCreateAppraisal(params.cycleId, subjectFor(body, user.id));
  if (appraisal.overallRating === null) {
    return { errors: { overallRating: 'Set an overall rating before submitting.' } };
  }
  const now = new Date().toISOString();
  appraisal.submittedAt = now;
  appraisal.updatedAt = now;
});

// -- Team appraisal ----------------------------------------------------------
// The record the employee, line manager and People Team all work during the
// rating, discussion and sign-off stages. It springs into existence the first
// time either side opens it for a cycle.

function findOrCreateTeamAppraisal(
  cycleId: string,
  subjectId: string,
  managerId: string,
): TeamAppraisal {
  let record = db.teamAppraisals.find(
    (candidate) => candidate.cycleId === cycleId && candidate.subjectId === subjectId,
  );
  if (!record) {
    const now = new Date().toISOString();
    record = {
      id: nextId('ta'),
      cycleId,
      subjectId,
      managerId,
      stage: 'manager',
      managerRatings: {},
      evidence: {},
      overallComment: '',
      finals: {},
      signatures: { employee: null, manager: null, people_team: null },
      createdAt: now,
      updatedAt: now,
    };
    db.teamAppraisals.push(record);
  }
  return record;
}

// The subject and their manager both work the record — the employee drives
// the discussion and sign-off from their side of the cycle. The People Team
// and admins may read and mediate. Everyone else is locked out.
function canAccessTeamAppraisal(user: User, subjectId: string): boolean {
  if (user.id === subjectId) return true;
  if (user.role === 'people_team' || user.role === 'admin') return true;
  const subject = db.users.find((candidate) => candidate.id === subjectId);
  return subject?.managerId === user.id;
}

const teamStages: TeamAppraisalStage[] = ['manager', 'discussion', 'acknowledge', 'done'];
const finalStatuses: FinalRating['status'][] = [
  'open',
  'proposed',
  'locked',
  'flagged',
  'resolved',
];

const isFinalRating = (value: unknown): value is FinalRating =>
  typeof value === 'object' &&
  value !== null &&
  ((value as FinalRating).value === null || isRating((value as FinalRating).value)) &&
  finalStatuses.includes((value as FinalRating).status);

function teamDraftErrors(body: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!teamStages.includes(body.stage as TeamAppraisalStage)) {
    errors.stage = 'That is not a stage this record can be in.';
  }
  const ratings = body.managerRatings;
  if (typeof ratings !== 'object' || ratings === null || !Object.values(ratings).every(isRating)) {
    errors.managerRatings = 'Each manager rating must be between 1 and 4.';
  }
  const evidence = body.evidence;
  if (
    typeof evidence !== 'object' ||
    evidence === null ||
    !Object.values(evidence).every((entry) => typeof entry === 'string')
  ) {
    errors.evidence = 'Evidence notes must be text.';
  }
  if (typeof body.overallComment !== 'string') {
    errors.overallComment = 'The overall comment must be text.';
  }
  const finals = body.finals;
  if (
    typeof finals !== 'object' ||
    finals === null ||
    !Object.values(finals).every(isFinalRating)
  ) {
    errors.finals = 'Final ratings are not in the expected shape.';
  }
  return errors;
}

registerAction('put', '/cycles/:cycleId/team-appraisals/:subjectId', ({ user, params, body }) => {
  if (!canAccessTeamAppraisal(user, params.subjectId)) {
    return {
      errors: { record: 'Only the line manager or People Team can change this appraisal.' },
    };
  }
  const errors = teamDraftErrors(body);
  if (Object.keys(errors).length > 0) return { errors };
  const subject = db.users.find((candidate) => candidate.id === params.subjectId);
  if (!subject) return { errors: { record: 'No user with that id.' } };
  const record = findOrCreateTeamAppraisal(
    params.cycleId,
    params.subjectId,
    subject.managerId ?? user.id,
  );
  record.stage = body.stage as TeamAppraisalStage;
  record.managerRatings = body.managerRatings as Record<string, Rating>;
  record.evidence = body.evidence as Record<string, string>;
  record.overallComment = body.overallComment as string;
  record.finals = body.finals as Record<string, FinalRating>;
  record.updatedAt = new Date().toISOString();
  // Winding the record back before the acknowledgement stage (the demo
  // reset does this) voids any signatures already collected.
  if (record.stage === 'manager' || record.stage === 'discussion') {
    record.signatures = { employee: null, manager: null, people_team: null };
  }
});

registerAction(
  'post',
  '/cycles/:cycleId/team-appraisals/:subjectId/sign',
  ({ user, params, body }) => {
    if (!canAccessTeamAppraisal(user, params.subjectId)) {
      return {
        errors: { record: 'Only the line manager or People Team can sign this appraisal.' },
      };
    }
    const party = body.party as SignatureParty;
    if (party !== 'employee' && party !== 'manager' && party !== 'people_team') {
      return { errors: { party: 'That is not a signing party.' } };
    }
    const record = db.teamAppraisals.find(
      (candidate) =>
        candidate.cycleId === params.cycleId && candidate.subjectId === params.subjectId,
    );
    if (!record) return { errors: { record: 'No appraisal to sign yet.' } };
    if (record.stage !== 'acknowledge') {
      return { errors: { record: 'Signatures are collected at the acknowledgement stage.' } };
    }
    if (party === 'people_team' && (!record.signatures.employee || !record.signatures.manager)) {
      return {
        errors: { record: 'The People Team locks the record only after both parties sign.' },
      };
    }
    const now = new Date().toISOString();
    record.signatures = { ...record.signatures, [party]: record.signatures[party] ?? now };
    if (record.signatures.employee && record.signatures.manager && record.signatures.people_team) {
      record.stage = 'done';
      const subject = db.users.find((candidate) => candidate.id === params.subjectId);
      recordAudit(
        user,
        'appraisal_locked',
        `Locked ${subject?.name ?? params.subjectId}'s appraisal after sign-off`,
      );
    }
    record.updatedAt = now;
  },
);

// -- Calibration -------------------------------------------------------------

const average = (values: number[]): number | null =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

// Merge the live team-appraisal record into a baseline calibration row so the
// People Team sees real progress the moment a manager starts rating.
function mergeLiveRow(row: CalibrationRow, cycleId: string): CalibrationRow {
  const record = db.teamAppraisals.find(
    (candidate) => candidate.cycleId === cycleId && candidate.subjectId === row.userId,
  );
  const selfAppraisal = db.appraisals.find(
    (candidate) => candidate.cycleId === cycleId && candidate.subjectId === row.userId,
  );
  const self =
    selfAppraisal?.submittedAt && selfAppraisal.overallRating !== null
      ? selfAppraisal.overallRating
      : row.self;
  if (!record) return { ...row, self };
  const finals = Object.values(record.finals)
    .filter(
      (final) => (final.status === 'locked' || final.status === 'resolved') && final.value !== null,
    )
    .map((final) => final.value as Rating);
  return {
    ...row,
    self,
    manager: average(Object.values(record.managerRatings)) ?? row.manager,
    final: average(finals) ?? row.final,
    stage: record.stage,
  };
}

function buildCalibration(cycleId: string): Calibration {
  return {
    cycleId,
    teamName: 'Client Service',
    rows: calibrationBaseline.map((row) => mergeLiveRow(row, cycleId)),
  };
}

// -- Page props --------------------------------------------------------------
// Mock counterpart of AppraisalController@show. One route serves three
// audiences, so the props carry the slice each sub-experience needs; the
// records handed out are the live rows the actions above mutate, which is
// how a signature or a stage change shows up everywhere on the next render.

const goalsFor = (cycleId: string | undefined, ownerId: string) =>
  db.goals.filter((goal) => goal.cycleId === cycleId && goal.ownerId === ownerId);

export const appraisalProps: PageResolver<AppraisalProps> = ({ user }) => {
  const activeCycle = cycles.find((c) => c.state === 'open' || c.state === 'closing') ?? cycles[0];
  const sent = db.feedbackRequests.filter((request) => request.requesterId === user.id);
  const myRequestIds = new Set(sent.map((request) => request.id));

  const self = {
    cycle: activeCycle ?? null,
    goals: goalsFor(activeCycle?.id, user.id),
    appraisal:
      db.appraisals.find(
        (candidate) => candidate.cycleId === activeCycle?.id && candidate.subjectId === user.id,
      ) ?? null,
    record: activeCycle
      ? findOrCreateTeamAppraisal(activeCycle.id, user.id, user.managerId ?? user.id)
      : null,
    users: db.users,
    departments,
    received: db.feedbackResponses.filter((response) => myRequestIds.has(response.requestId)),
    sentRequests: sent,
  };

  let team: TeamReviewData[] | null = null;
  if (user.role === 'manager' && activeCycle) {
    team = db.users
      .filter((candidate) => candidate.managerId === user.id)
      .map((report) => ({
        report,
        goals: goalsFor(activeCycle.id, report.id),
        record: findOrCreateTeamAppraisal(activeCycle.id, report.id, user.id),
      }));
  }

  let calibration: AppraisalProps['calibration'] = null;
  if ((user.role === 'people_team' || user.role === 'admin') && activeCycle) {
    const built = buildCalibration(activeCycle.id);
    const liveRow = built.rows.find((row) => row.live);
    const subject = liveRow ? db.users.find((candidate) => candidate.id === liveRow.userId) : null;
    calibration = liveRow
      ? {
          teamName: built.teamName,
          rows: built.rows,
          record: findOrCreateTeamAppraisal(
            activeCycle.id,
            liveRow.userId,
            subject?.managerId ?? user.id,
          ),
          goals: goalsFor(activeCycle.id, liveRow.userId),
          year: activeCycle.year,
        }
      : null;
  }

  return { self, team, calibration };
};
