import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/auth/authProvider';
import { useCycles, useGoals } from '@/api/queries/goals';
import { useUsers } from '@/api/queries/org';
import {
  useCalibration,
  useSaveTeamAppraisal,
  useSignTeamAppraisal,
  useTeamAppraisal,
} from '@/api/queries/teamAppraisals';
import type { CalibrationRow, SignaturePartyInput } from '@/api/schemas/teamAppraisal';
import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { BrandWatermark } from '@/components/ui/BrandWatermark';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import {
  categoryColour,
  categoryOrder,
  categoryTint,
  ratingColour,
  ratingLabels,
} from '@/components/ui/accent';
import type { FinalRating, Goal, GoalCategory, Rating, TeamAppraisal, User } from '@/types/domain';
import { distributionOf } from './calibrationModel';
import { type SignerParty } from './EmployeeStages';
import {
  demoManagerRating,
  finalOf,
  firstNameOf,
  fromServerStage,
  goalContext,
  resolveMidpoint,
  signedWhen,
  stageFlow,
  stageTone,
  toServerStage,
  type Stage,
} from './reviewModel';
import styles from './AppraisalCalibration.module.css';
import emp from './Appraisal.module.css';
import shared from './ManagerAppraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

type BadgeKind = 'neutral' | 'discussion' | 'acknowledge' | 'locked';

const stageBadge: Record<CalibrationRow['stage'], { label: string; kind: BadgeKind }> = {
  self: { label: 'Self-appraisal', kind: 'neutral' },
  manager: { label: 'Line manager', kind: 'neutral' },
  discussion: { label: 'Discussion', kind: 'discussion' },
  acknowledge: { label: 'Acknowledge', kind: 'acknowledge' },
  done: { label: 'Locked', kind: 'locked' },
};

// The live row's badge follows the local demo stage rather than the merged
// server row, so the table always agrees with the panel below it.
const rowStageOf: Record<Stage, CalibrationRow['stage']> = {
  Self: 'self',
  Manager: 'manager',
  Discussion: 'discussion',
  Acknowledge: 'acknowledge',
  Done: 'done',
};

const fmt = (value: number | null) => (value === null ? '—' : value.toFixed(1));

const isSettled = (state: FinalRating) => state.status === 'locked' || state.status === 'resolved';

function StageBadge({ label, kind }: { label: string; kind: BadgeKind }) {
  return (
    <span className={styles.stageBadge} data-kind={kind}>
      {kind === 'discussion' && <span className={styles.flag} aria-hidden="true" />}
      {label}
    </span>
  );
}

function CategoryChip({ category }: { category: GoalCategory }) {
  return (
    <span
      className={emp.sectionChip}
      style={{ background: categoryTint[category], color: categoryColour[category] }}
    >
      <span className={emp.sectionChipDot} style={{ background: categoryColour[category] }} />
      {category}
    </span>
  );
}

// Loads the cohort, the live subject's goals and their team-appraisal record,
// then hands over to the stateful body keyed by record so a cycle or subject
// change rebuilds the working state.
export function AppraisalCalibration() {
  const { user: me } = useAuth();
  const cyclesQuery = useCycles();

  const cycles = cyclesQuery.data ?? [];
  const activeCycle =
    cycles.find((cycle) => cycle.state === 'open' || cycle.state === 'closing') ??
    [...cycles].sort((a, b) => b.year - a.year)[0];
  const year = activeCycle?.year ?? new Date().getFullYear();

  const calibrationQuery = useCalibration(activeCycle?.id);
  const liveId = calibrationQuery.data?.rows.find((row) => row.live)?.userId;
  const goalsQuery = useGoals(liveId ? activeCycle?.id : undefined, liveId);
  const recordQuery = useTeamAppraisal(liveId ? activeCycle?.id : undefined, liveId ?? '');
  const usersQuery = useUsers();

  const goals = useMemo(() => {
    const list = goalsQuery.data ?? [];
    return [...list]
      .filter((goal) => goal.cycleId === activeCycle?.id)
      .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
  }, [goalsQuery.data, activeCycle?.id]);

  const failed = [cyclesQuery, calibrationQuery, goalsQuery, recordQuery].find(
    (query) => query.isError,
  );
  if (failed) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={failed.error} onRetry={failed.refetch} />
      </div>
    );
  }
  // The demo data always seeds one live appraisal, so the body can assume a
  // record; hold the skeleton until it arrives.
  const record = recordQuery.data;
  const calibration = calibrationQuery.data;
  if (cyclesQuery.isPending || !liveId || goalsQuery.isPending || !record || !calibration) {
    return <ViewSkeleton />;
  }

  return (
    <CalibrationBody
      key={record.id}
      me={me}
      record={record}
      rows={calibration.rows}
      teamName={calibration.teamName}
      goals={goals}
      cycleId={record.cycleId}
      year={year}
      users={usersQuery.data ?? []}
    />
  );
}

function CalibrationBody({
  me,
  record,
  rows,
  teamName,
  goals,
  cycleId,
  year,
  users,
}: {
  me: User | null;
  record: TeamAppraisal;
  rows: CalibrationRow[];
  teamName: string;
  goals: Goal[];
  cycleId: string;
  year: number;
  users: User[];
}) {
  const save = useSaveTeamAppraisal(cycleId, record.subjectId);
  const sign = useSignTeamAppraisal(cycleId, record.subjectId);

  // Working copy of the live record. Every meaningful action is pushed back
  // through PUT so the other personas see the mediation land in real time.
  const [stage, setStage] = useState<Stage>(fromServerStage(record.stage));
  const [managerRatings, setManagerRatings] = useState(record.managerRatings);
  const [finals, setFinals] = useState(record.finals);
  const [signatures, setSignatures] = useState(record.signatures);
  // Ratings picked on a mediation card but not yet locked in.
  const [resolution, setResolution] = useState<Record<string, Rating>>({});
  const [expanded, setExpanded] = useState(true);

  // Mirrors so the demo timers always read live values rather than the state
  // captured when they were scheduled.
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const ratingsRef = useRef(managerRatings);
  ratingsRef.current = managerRatings;
  const finalsRef = useRef(finals);
  finalsRef.current = finals;
  const signaturesRef = useRef(signatures);
  signaturesRef.current = signatures;
  // The People Team never edits evidence or the manager's overall comment;
  // carry the stored values through untouched.
  const evidenceRef = useRef(record.evidence);
  const commentRef = useRef(record.overallComment);

  // Timed demo responses standing in for the employee and line manager
  // working the record from their own seats.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  };
  const advancePlanned = useRef(false);

  const subject = users.find((user) => user.id === record.subjectId) ?? null;
  const manager = users.find((user) => user.id === record.managerId) ?? null;
  const peopleTeam = users.find((user) => user.role === 'people_team') ?? null;
  const first = subject ? firstNameOf(subject.name) : 'the employee';
  const managerFirst = manager ? firstNameOf(manager.name) : 'The line manager';

  const selfOf = (goalId: string) => goalContext(goalId).selfRating;
  const flaggedGoals = goals.filter((goal) => finalOf(finals, goal.id).status === 'flagged');
  const allSettled = goals.length > 0 && goals.every((goal) => isSettled(finalOf(finals, goal.id)));

  const average = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const liveSelf = stage === 'Self' ? null : average(goals.map((goal) => selfOf(goal.id)));
  const liveManager = average(Object.values(managerRatings));
  const liveFinal = allSettled
    ? average(
        goals
          .map((goal) => finalOf(finals, goal.id).value)
          .filter((value): value is Rating => value !== null),
      )
    : null;

  // The live row reflects the demo state directly instead of waiting on the
  // calibration query to refetch after every PUT.
  const displayRows = rows.map((row) =>
    row.live
      ? { ...row, self: liveSelf, manager: liveManager, final: liveFinal, stage: rowStageOf[stage] }
      : row,
  );
  const { bands, average: teamAverage } = distributionOf(displayRows);
  const peak = Math.max(1, ...bands.map((entry) => entry.count));
  const liveRow = displayRows.find((row) => row.live);

  const persist = (patch: {
    stage?: Stage;
    managerRatings?: Record<string, Rating>;
    finals?: Record<string, FinalRating>;
  }) => {
    save.mutate(
      {
        stage: toServerStage(patch.stage ?? stageRef.current),
        managerRatings: patch.managerRatings ?? ratingsRef.current,
        evidence: evidenceRef.current,
        overallComment: commentRef.current,
        finals: patch.finals ?? finalsRef.current,
      },
      { onSuccess: (saved) => setSignatures(saved.signatures) },
    );
  };

  const signAs = (party: SignaturePartyInput, then?: () => void) => {
    sign.mutate(party, {
      onSuccess: (signed) => {
        setSignatures(signed.signatures);
        if (signed.stage === 'done') setStage('Done');
        then?.();
      },
    });
  };

  const ensureRatings = (): Record<string, Rating> => {
    if (Object.keys(ratingsRef.current).length) return ratingsRef.current;
    const seeded: Record<string, Rating> = {};
    for (const goal of goals) seeded[goal.id] = demoManagerRating(goal.id, selfOf(goal.id));
    setManagerRatings(seeded);
    return seeded;
  };

  // A believable mid-discussion snapshot for the demo jump: one goal already
  // agreed, the middle ones flagged to you, and the last still being debated
  // (it flags a little later — see the timer below).
  const seedDiscussion = (ratings: Record<string, Rating>): Record<string, FinalRating> => {
    const seeded: Record<string, FinalRating> = {};
    goals.forEach((goal, index) => {
      const proposal = resolveMidpoint(null, selfOf(goal.id), ratings[goal.id]);
      seeded[goal.id] =
        index === 0
          ? { value: proposal, status: 'locked' }
          : index === goals.length - 1
            ? { value: proposal, status: 'proposed' }
            : { value: proposal, status: 'flagged' };
    });
    setFinals(seeded);
    return seeded;
  };

  const settleAll = (ratings: Record<string, Rating>): Record<string, FinalRating> => {
    const seeded = { ...finalsRef.current };
    for (const goal of goals) {
      const state = finalOf(seeded, goal.id);
      if (!isSettled(state)) {
        seeded[goal.id] = {
          value: state.value ?? resolveMidpoint(null, selfOf(goal.id), ratings[goal.id]),
          status: 'locked',
        };
      }
    }
    setFinals(seeded);
    return seeded;
  };

  const goToStage = (next: Stage) => {
    advancePlanned.current = false;
    if (next === 'Discussion') {
      const ratings = ensureRatings();
      const hasFinals = goals.some((goal) => finalOf(finalsRef.current, goal.id).status !== 'open');
      const seededFinals = hasFinals ? finalsRef.current : seedDiscussion(ratings);
      setStage(next);
      persist({ stage: next, managerRatings: ratings, finals: seededFinals });
      return;
    }
    if (next === 'Acknowledge') {
      const ratings = ensureRatings();
      const settled = settleAll(ratings);
      setStage(next);
      persist({ stage: next, managerRatings: ratings, finals: settled });
      return;
    }
    if (next === 'Done') {
      const ratings = ensureRatings();
      const settled = settleAll(ratings);
      setStage('Done');
      // The record still signs through the acknowledge machine: park it
      // there, then collect all three signatures (People Team last locks it).
      save.mutate(
        {
          stage: 'acknowledge',
          managerRatings: ratings,
          evidence: evidenceRef.current,
          overallComment: commentRef.current,
          finals: settled,
        },
        {
          onSuccess: () => signAs('employee', () => signAs('manager', () => signAs('people_team'))),
        },
      );
      return;
    }
    setStage(next);
    persist({ stage: next });
  };

  const reset = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    advancePlanned.current = false;
    setStage('Self');
    setManagerRatings({});
    setFinals({});
    setResolution({});
    persist({ stage: 'Self', managerRatings: {}, finals: {} });
  };

  const pickResolution = (goalId: string, rating: Rating) =>
    setResolution((prev) => ({ ...prev, [goalId]: rating }));

  // Your binding call on a flagged goal: the chosen number locks as the final.
  const setAndLock = (goalId: string) => {
    const value = resolution[goalId];
    if (!value) return;
    const next: Record<string, FinalRating> = {
      ...finalsRef.current,
      [goalId]: { value, status: 'resolved' },
    };
    setFinals(next);
    persist({ finals: next });
    setResolution((prev) => {
      const rest = { ...prev };
      delete rest[goalId];
      return rest;
    });
  };

  // While you mediate, the pair keep talking — a goal they cannot land on
  // their own flags to you as well.
  useEffect(() => {
    if (stage !== 'Discussion') return;
    later(8000, () => {
      if (stageRef.current !== 'Discussion') return;
      const next = { ...finalsRef.current };
      let changed = false;
      for (const goal of goals) {
        const state = finalOf(next, goal.id);
        if (state.status === 'proposed') {
          next[goal.id] = { value: state.value, status: 'flagged' };
          changed = true;
        }
      }
      if (changed) {
        setFinals(next);
        persist({ finals: next });
      }
    });
    // The timer reads live state through the refs; re-running on every finals
    // change would schedule duplicate flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // With every goal settled, the employee and manager move the record on to
  // signatures from their side of the cycle.
  useEffect(() => {
    if (stage !== 'Discussion' || !allSettled || advancePlanned.current) return;
    advancePlanned.current = true;
    later(2600, () => {
      if (stageRef.current !== 'Discussion') return;
      setStage('Acknowledge');
      persist({ stage: 'Acknowledge' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, allSettled]);

  // The other two parties sign from their own seats shortly after the
  // acknowledgement opens; the People Team signature is yours to give.
  useEffect(() => {
    if (stage !== 'Acknowledge') return;
    if (!signaturesRef.current.employee) {
      later(1600, () => {
        if (stageRef.current !== 'Acknowledge') return;
        if (!signaturesRef.current.employee) signAs('employee');
      });
    }
    if (!signaturesRef.current.manager) {
      later(3200, () => {
        if (stageRef.current !== 'Acknowledge') return;
        if (!signaturesRef.current.manager) signAs('manager');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const parties: SignerParty[] = [
    {
      key: 'employee',
      person: subject,
      fallbackName: liveRow?.name ?? 'Employee',
      role: 'Employee',
    },
    { key: 'manager', person: manager, fallbackName: 'Line manager', role: 'Line Manager' },
    {
      key: 'people_team',
      person: peopleTeam,
      fallbackName: 'People Team',
      role: 'People Team · locks record',
    },
  ];
  const readyToLock = Boolean(signatures.employee && signatures.manager);

  const liveSub =
    stage === 'Self'
      ? `Waiting on ${first}'s self-appraisal`
      : stage === 'Manager'
        ? `${managerFirst} is adding line-manager ratings`
        : stage === 'Discussion'
          ? flaggedGoals.length
            ? 'Disagreement flagged — awaiting your mediation'
            : allSettled
              ? 'All goals agreed — moving to signatures'
              : `${first} and ${managerFirst} are aligning goal by goal`
          : stage === 'Acknowledge'
            ? 'Collecting three-way signatures'
            : 'Signed and locked';

  return (
    <div className={`view ${styles.page}`}>
      <div className={`card ${shared.demoCard}`}>
        <span className={shared.demoLabel}>Demo · cycle stage</span>
        <div className={shared.demoTabs}>
          {stageFlow.map((s) => {
            const on = s === stage;
            return (
              <button
                key={s}
                type="button"
                className={`${shared.demoTab} ${on ? shared.demoTabOn : ''}`}
                style={on ? { background: stageTone[s] } : undefined}
                onClick={() => goToStage(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button type="button" className={shared.demoReset} onClick={reset}>
          Reset
        </button>
      </div>

      <div className={`oxy-plate oxy-wash grain ${styles.banner}`}>
        <div className={styles.bannerScrim} />
        {me && (
          <div className={styles.bannerFace}>
            <Avatar userId={me.id} name={me.name} avatarUrl={me.avatarUrl} size={64} />
          </div>
        )}
        <div className={styles.bannerBody}>
          <div className={styles.bannerKicker}>{year} appraisal cycle · People Team</div>
          <h1 className={styles.bannerTitle}>Calibration &amp; oversight</h1>
          <p className={styles.bannerSub}>
            Monitor progress across the team, calibrate ratings for fairness, mediate disagreements
            and lock completed appraisals.
          </p>
        </div>
        <BrandWatermark />
      </div>

      <div className={`card ${styles.chartCard}`}>
        <div className={styles.chartHead}>
          <div className={styles.chartTitleRow}>
            <span className={styles.cardTitle}>Rating calibration · {teamName}</span>
            <span className={styles.chartHint}>Compare ratings across the team for fairness</span>
          </div>
          <div className={styles.teamAverage}>
            Team average <strong>{teamAverage === null ? '—' : teamAverage.toFixed(1)}</strong>
          </div>
        </div>
        <div className={styles.chart}>
          {bands.map((entry) => (
            <div key={entry.rating} className={styles.chartCol}>
              <span className={styles.chartCount}>{entry.count}</span>
              <div
                className={styles.chartBar}
                style={{
                  height: `${Math.max(6, (entry.count / peak) * 150)}px`,
                  background: ratingColour[entry.rating],
                }}
              />
              <span className={styles.chartLabel}>{ratingLabels[entry.rating]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`card ${styles.tableCard}`}>
        <div className={styles.cardTitle}>Team appraisals</div>
        <div className={styles.tableSub}>
          {displayRows.length} people · click Open to work {first}&rsquo;s live appraisal
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th className={styles.numCol}>Self</th>
                <th className={styles.numCol}>Mgr</th>
                <th className={styles.numCol}>Final</th>
                <th>Stage</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const badge = stageBadge[row.stage];
                return (
                  <tr key={row.userId} data-live={row.live}>
                    <td>
                      <div className={styles.person}>
                        <Avatar userId={row.userId} name={row.name} avatarUrl={null} size={34} />
                        <div className={styles.personText}>
                          <span className={styles.personName}>{row.name}</span>
                          <span className={styles.personMeta}>{row.jobTitle}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.numCol}>{fmt(row.self)}</td>
                    <td className={styles.numCol}>{fmt(row.manager)}</td>
                    <td className={`${styles.numCol} ${styles.finalCell}`}>{fmt(row.final)}</td>
                    <td>
                      <StageBadge label={badge.label} kind={badge.kind} />
                    </td>
                    <td className={styles.actionCell}>
                      {row.live && (
                        <button
                          type="button"
                          className={styles.openButton}
                          onClick={() => setExpanded((open) => !open)}
                        >
                          {expanded ? 'Hide' : 'Open'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {expanded && liveRow && (
        <div className={`card ${styles.liveCard}`}>
          <div className={`grain ${styles.liveHead}`}>
            <Avatar
              userId={liveRow.userId}
              name={liveRow.name}
              avatarUrl={subject?.avatarUrl ?? null}
              size={42}
            />
            <div className={styles.liveHeadBody}>
              <div className={styles.liveTitle}>{liveRow.name} · live appraisal</div>
              <div className={styles.liveSub}>{liveSub}</div>
            </div>
            <span className={styles.livePill}>{stageBadge[rowStageOf[stage]].label}</span>
          </div>

          <div className={styles.liveBody}>
            <div className={emp.subList}>
              {goals.map((goal) => {
                const state = finalOf(finals, goal.id);
                const self = selfOf(goal.id);
                const managerRating = managerRatings[goal.id];
                return (
                  <div
                    key={goal.id}
                    className={emp.subRow}
                    style={{ borderLeftColor: categoryColour[goal.category] }}
                  >
                    <div className={emp.subMain}>
                      <CategoryChip category={goal.category} />
                      <div className={emp.subTitle}>{goal.title}</div>
                    </div>
                    <div className={emp.subStat}>
                      <span className={emp.subStatLabel}>Self</span>
                      {stage === 'Self' ? (
                        <span className={`${emp.subStatValue} ${emp.subStatPending}`}>–</span>
                      ) : (
                        <span className={emp.subStatValue} style={{ color: ratingColour[self] }}>
                          {self}
                        </span>
                      )}
                    </div>
                    <div className={emp.subStat}>
                      <span className={emp.subStatLabel}>Mgr</span>
                      {managerRating ? (
                        <span
                          className={emp.subStatValue}
                          style={{ color: ratingColour[managerRating] }}
                        >
                          {managerRating}
                        </span>
                      ) : (
                        <span className={`${emp.subStatValue} ${emp.subStatPending}`}>–</span>
                      )}
                    </div>
                    <div className={emp.subStat}>
                      <span className={emp.subStatLabel}>Final</span>
                      {isSettled(state) && state.value !== null ? (
                        <span
                          className={emp.subStatValue}
                          style={{ color: ratingColour[state.value] }}
                        >
                          {state.value}
                        </span>
                      ) : state.value !== null ? (
                        // A number still in dispute (proposed or flagged)
                        // shows in gold until it locks.
                        <span className={emp.subStatValue} style={{ color: 'var(--gold)' }}>
                          {state.value}
                        </span>
                      ) : (
                        <span className={`${emp.subStatValue} ${emp.subStatPending}`}>–</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {stage === 'Self' && (
              <p className={styles.liveNote}>
                {first} is still writing their self-appraisal — nothing to calibrate yet.
              </p>
            )}

            {stage === 'Manager' && (
              <p className={styles.liveNote}>
                {managerFirst} is rating {first} goal by goal. Disagreements land here if their
                discussion stalls.
              </p>
            )}

            {stage === 'Discussion' && flaggedGoals.length > 0 && (
              <>
                <div className={`${shared.notice} ${shared.noticeFlag}`}>
                  <span>
                    {'\u{1F6A9}'} The employee and line manager could not agree. As People Team, set
                    the binding final rating for each flagged goal.
                  </span>
                </div>
                {flaggedGoals.map((goal) => {
                  const self = selfOf(goal.id);
                  const managerRating = managerRatings[goal.id] ?? self;
                  const picked = resolution[goal.id];
                  return (
                    <div key={goal.id} className={styles.medCard}>
                      <div className={styles.medHead}>
                        <CategoryChip category={goal.category} />
                        <span className={styles.medTitle}>{goal.title}</span>
                      </div>
                      <div className={styles.medRow}>
                        <div className={styles.medStat}>
                          <span className={styles.medLabel}>Self</span>
                          <span className={styles.medNum} style={{ color: ratingColour[self] }}>
                            {self}
                          </span>
                        </div>
                        <div className={styles.medStat}>
                          <span className={styles.medLabel}>Manager</span>
                          <span
                            className={styles.medNum}
                            style={{ color: ratingColour[managerRating] }}
                          >
                            {managerRating}
                          </span>
                        </div>
                        <div className={styles.medPick}>
                          <span className={styles.medLabel}>People Team resolution</span>
                          <div className={shared.finalScale}>
                            {scale.map((n) => {
                              const on = picked === n;
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  className={shared.finalButton}
                                  onClick={() => pickResolution(goal.id, n)}
                                  style={
                                    on
                                      ? {
                                          background: ratingColour[n],
                                          color: 'var(--surface)',
                                          borderColor: ratingColour[n],
                                        }
                                      : undefined
                                  }
                                  aria-pressed={on}
                                >
                                  {n}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`${shared.signButton} ${styles.medLock}`}
                          disabled={!picked || save.isPending}
                          onClick={() => setAndLock(goal.id)}
                        >
                          Set &amp; lock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {stage === 'Discussion' && flaggedGoals.length === 0 && !allSettled && (
              <p className={styles.liveNote}>
                {first} and {managerFirst} are aligning goal by goal — nothing needs your mediation
                right now.
              </p>
            )}

            {stage === 'Discussion' && flaggedGoals.length === 0 && allSettled && (
              <div className={`${shared.notice} ${shared.noticeAgreed}`}>
                <Icon name="check" size={16} />
                <span>Every goal is settled. The record moves to acknowledgement shortly.</span>
              </div>
            )}

            {(stage === 'Acknowledge' || stage === 'Done') && (
              <div className={emp.signGrid}>
                {parties.map((party) => {
                  const signedAt = signatures[party.key];
                  const isMe = party.key === 'people_team';
                  return (
                    <div
                      key={party.key}
                      className={`${emp.signTile} ${
                        signedAt ? emp.signTileDone : isMe ? emp.signTileActive : ''
                      }`}
                    >
                      <Avatar
                        userId={party.person?.id ?? party.key}
                        name={party.person?.name ?? party.fallbackName}
                        avatarUrl={party.person?.avatarUrl ?? null}
                        size={48}
                      />
                      <div className={emp.signTileName}>
                        {party.person?.name ?? party.fallbackName}
                      </div>
                      <div className={emp.signTileRole}>{party.role}</div>
                      {signedAt ? (
                        <span className={emp.signedPill}>
                          <Icon name="check" size={14} /> Signed {'\u00b7'} {signedWhen(signedAt)}
                        </span>
                      ) : isMe ? (
                        <button
                          type="button"
                          className={shared.signButton}
                          disabled={!readyToLock || sign.isPending}
                          onClick={() => signAs('people_team')}
                        >
                          Sign as People Team
                        </button>
                      ) : (
                        <span className={emp.awaitingPill}>Awaiting signature</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
