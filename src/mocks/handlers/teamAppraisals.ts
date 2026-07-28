import { http, HttpResponse } from 'msw';
import { signRequestSchema, teamAppraisalDraftSchema } from '@/api/schemas/teamAppraisal';
import type { CalibrationRow } from '@/api/schemas/teamAppraisal';
import type { Rating, TeamAppraisal } from '@/types/domain';
import { db, nextId } from '../db';
import { calibrationBaseline } from '../fixtures/calibration';
import { recordAudit } from './admin';
import { currentUser, errorJson, latency } from './utils';

function findOrCreate(cycleId: string, subjectId: string, managerId: string): TeamAppraisal {
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

// The subject's manager works the record; the People Team and admins may read
// and mediate. Everyone else is locked out.
function canAccess(request: Request, subjectId: string): boolean {
  const user = currentUser(request);
  if (user.role === 'people_team' || user.role === 'admin') return true;
  const subject = db.users.find((candidate) => candidate.id === subjectId);
  return subject?.managerId === user.id;
}

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
    .filter((final) => (final.status === 'locked' || final.status === 'resolved') && final.value !== null)
    .map((final) => final.value as Rating);
  return {
    ...row,
    self,
    manager: average(Object.values(record.managerRatings)) ?? row.manager,
    final: average(finals) ?? row.final,
    stage: record.stage,
  };
}

export const teamAppraisalHandlers = [
  http.get('/api/cycles/:cycleId/team-appraisals/:subjectId', async ({ request, params }) => {
    await latency();
    const subjectId = params.subjectId as string;
    if (!canAccess(request, subjectId)) {
      return errorJson(403, 'forbidden', "Only the line manager or People Team can open this appraisal.");
    }
    const subject = db.users.find((candidate) => candidate.id === subjectId);
    if (!subject) return errorJson(404, 'user_not_found', 'No user with that id.');
    return HttpResponse.json(
      findOrCreate(params.cycleId as string, subjectId, subject.managerId ?? currentUser(request).id),
    );
  }),

  http.put('/api/cycles/:cycleId/team-appraisals/:subjectId', async ({ request, params }) => {
    await latency();
    const subjectId = params.subjectId as string;
    if (!canAccess(request, subjectId)) {
      return errorJson(403, 'forbidden', "Only the line manager or People Team can change this appraisal.");
    }
    const body = teamAppraisalDraftSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_team_appraisal', body.error.issues[0].message);
    const subject = db.users.find((candidate) => candidate.id === subjectId);
    if (!subject) return errorJson(404, 'user_not_found', 'No user with that id.');
    const record = findOrCreate(
      params.cycleId as string,
      subjectId,
      subject.managerId ?? currentUser(request).id,
    );
    Object.assign(record, body.data, { updatedAt: new Date().toISOString() });
    // Winding the record back before the acknowledgement stage (the demo
    // reset does this) voids any signatures already collected.
    if (record.stage === 'manager' || record.stage === 'discussion') {
      record.signatures = { employee: null, manager: null, people_team: null };
    }
    return HttpResponse.json(record);
  }),

  http.post('/api/cycles/:cycleId/team-appraisals/:subjectId/sign', async ({ request, params }) => {
    await latency();
    const subjectId = params.subjectId as string;
    if (!canAccess(request, subjectId)) {
      return errorJson(403, 'forbidden', "Only the line manager or People Team can sign this appraisal.");
    }
    const body = signRequestSchema.safeParse(await request.json());
    if (!body.success) return errorJson(422, 'invalid_party', body.error.issues[0].message);
    const record = db.teamAppraisals.find(
      (candidate) => candidate.cycleId === (params.cycleId as string) && candidate.subjectId === subjectId,
    );
    if (!record) return errorJson(404, 'not_found', 'No appraisal to sign yet.');
    if (record.stage !== 'acknowledge') {
      return errorJson(409, 'wrong_stage', 'Signatures are collected at the acknowledgement stage.');
    }
    const { party } = body.data;
    if (party === 'people_team' && (!record.signatures.employee || !record.signatures.manager)) {
      return errorJson(409, 'not_ready', 'The People Team locks the record only after both parties sign.');
    }
    const now = new Date().toISOString();
    record.signatures[party] = record.signatures[party] ?? now;
    if (record.signatures.employee && record.signatures.manager && record.signatures.people_team) {
      record.stage = 'done';
      const subject = db.users.find((candidate) => candidate.id === subjectId);
      recordAudit(
        currentUser(request),
        'appraisal_locked',
        `Locked ${subject?.name ?? subjectId}'s appraisal after sign-off`,
      );
    }
    record.updatedAt = now;
    return HttpResponse.json(record);
  }),

  http.get('/api/cycles/:cycleId/calibration', async ({ request, params }) => {
    await latency();
    const user = currentUser(request);
    if (user.role !== 'people_team' && user.role !== 'admin') {
      return errorJson(403, 'forbidden', 'Calibration is a People Team view.');
    }
    const cycleId = params.cycleId as string;
    return HttpResponse.json({
      cycleId,
      teamName: 'Client Service',
      rows: calibrationBaseline.map((row) => mergeLiveRow(row, cycleId)),
    });
  }),
];
