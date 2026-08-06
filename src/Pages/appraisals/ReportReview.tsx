import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@/Lib/router';
import type { SignaturePartyInput } from '@/Types/teamAppraisal';
import { Icon } from '@/Components/icons/Icon';
import { Avatar } from '@/Components/ui/Avatar';
import { categoryOrder, ratingColour, ratingLabels } from '@/Components/ui/accent';
import type { FinalRating, Goal, Rating, TeamAppraisal, User } from '@/Types/domain';
import type { TeamReviewData } from './Appraisal';
import { DiscussionStage } from './DiscussionStage';
import { ManagerRatingStage, SelfContext } from './ManagerRatingStage';
import { LockedRecord, SignOffPanel, type SignerParty } from './EmployeeStages';
import {
  demoManagerRating,
  finalOf,
  firstNameOf,
  fromServerStage,
  goalContext,
  projectedAverage,
  resolveMidpoint,
  stageFlow,
  stageTone,
  toServerStage,
  type Stage,
} from './reviewModel';
import styles from './ManagerAppraisal.module.css';
import emp from './Appraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

// Orders the report's goals and resolves the counterparties, then hands over
// to the stateful body. Keyed by record id upstream so switching report or
// cycle rebuilds the working state from what the record holds.
export function ReportReview({
  data,
  users,
  year,
}: {
  data: TeamReviewData;
  users: User[];
  year: number;
}) {
  const { report, record } = data;
  const goals = useMemo(
    () =>
      [...data.goals].sort(
        (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category),
      ),
    [data.goals],
  );

  const manager = users.find((user) => user.id === record.managerId) ?? null;
  const peopleTeam = users.find((user) => user.role === 'people_team') ?? null;

  return (
    <ReviewBody
      record={record}
      report={report}
      manager={manager}
      peopleTeam={peopleTeam}
      goals={goals}
      cycleId={record.cycleId}
      year={year}
    />
  );
}

function ReviewBody({
  record,
  report,
  manager,
  peopleTeam,
  goals,
  cycleId,
  year,
}: {
  record: TeamAppraisal;
  report: User;
  manager: User | null;
  peopleTeam: User | null;
  goals: Goal[];
  cycleId: string;
  year: number;
}) {
  const [signing, setSigning] = useState(false);

  // Working copy of the persisted record. Initialised from the record and
  // pushed back through PUT on every meaningful action, so the calibration
  // view and other personas see the manager's progress live.
  const [stage, setStage] = useState<Stage>(fromServerStage(record.stage));
  const [managerRatings, setManagerRatings] = useState(record.managerRatings);
  const [evidence, setEvidence] = useState(record.evidence);
  const [overallComment, setOverallComment] = useState(record.overallComment);
  const [finals, setFinals] = useState(record.finals);
  // Signatures arrive with each fresh props payload; the ref lets the timers
  // below read the latest state instead of the render they were scheduled in.
  const signatures = record.signatures;
  const signaturesRef = useRef(signatures);
  signaturesRef.current = signatures;
  // Which pending proposals came from the report rather than from you.
  const [reportProposed, setReportProposed] = useState<Set<string>>(new Set());

  // Mirrors so the demo timers below always read the live values rather than
  // the state captured when they were scheduled.
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const ratingsRef = useRef(managerRatings);
  ratingsRef.current = managerRatings;
  const evidenceRef = useRef(evidence);
  evidenceRef.current = evidence;
  const commentRef = useRef(overallComment);
  commentRef.current = overallComment;
  const finalsRef = useRef(finals);
  finalsRef.current = finals;

  // Timed demo responses that stand in for the report and the People Team
  // answering from their own seats until the real backend pushes updates.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  };

  const first = firstNameOf(report.name);
  const contextOf = (goalId: string) => goalContext(goalId);
  const selfOf = (goalId: string) => goalContext(goalId).selfRating;

  const projected = projectedAverage(goals, finals, managerRatings, selfOf);

  const persist = (patch: {
    stage?: Stage;
    managerRatings?: Record<string, Rating>;
    evidence?: Record<string, string>;
    overallComment?: string;
    finals?: Record<string, FinalRating>;
  }) => {
    void router.put(`/cycles/${cycleId}/team-appraisals/${report.id}`, {
      stage: toServerStage(patch.stage ?? stageRef.current),
      managerRatings: patch.managerRatings ?? ratingsRef.current,
      evidence: patch.evidence ?? evidenceRef.current,
      overallComment: patch.overallComment ?? commentRef.current,
      finals: patch.finals ?? finalsRef.current,
    });
  };

  const goToStage = (next: Stage) => {
    // Jumping ahead with the demo tabs past the rating stage needs manager
    // numbers on the board, so seed the stable stand-ins where none exist.
    if (
      (next === 'Discussion' || next === 'Acknowledge' || next === 'Done') &&
      Object.keys(ratingsRef.current).length === 0
    ) {
      const seeded: Record<string, Rating> = {};
      for (const goal of goals) seeded[goal.id] = demoManagerRating(goal.id, selfOf(goal.id));
      setManagerRatings(seeded);
      setStage(next);
      persist({ stage: next, managerRatings: seeded });
      return;
    }
    setStage(next);
    persist({ stage: next });
  };

  const reset = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setStage('Manager');
    setManagerRatings({});
    setEvidence({});
    setOverallComment('');
    setFinals({});
    setReportProposed(new Set());
    persist({
      stage: 'Manager',
      managerRatings: {},
      evidence: {},
      overallComment: '',
      finals: {},
    });
  };

  const rate = (goalId: string, rating: Rating) => {
    const next = { ...managerRatings, [goalId]: rating };
    setManagerRatings(next);
    persist({ managerRatings: next });
  };

  const setFinal = (goalId: string, final: FinalRating) => {
    const next = { ...finalsRef.current, [goalId]: final };
    setFinals(next);
    persist({ finals: next });
  };

  const dropReportProposal = (goalId: string) =>
    setReportProposed((prev) => {
      if (!prev.has(goalId)) return prev;
      const next = new Set(prev);
      next.delete(goalId);
      return next;
    });

  // You propose (or counter-propose) a number; in this demo the report comes
  // around after a moment unless the goal moved on in the meantime.
  const proposeFinal = (goalId: string, rating: Rating) => {
    dropReportProposal(goalId);
    setFinal(goalId, { value: rating, status: 'proposed' });
    later(2400, () => {
      const pending = finalOf(finalsRef.current, goalId);
      if (pending.status === 'proposed' && pending.value === rating) {
        setFinal(goalId, { value: rating, status: 'locked' });
      }
    });
  };

  const agreeFinal = (goalId: string) => {
    dropReportProposal(goalId);
    setFinal(goalId, { value: finalOf(finalsRef.current, goalId).value, status: 'locked' });
  };

  // Flagging hands the goal to the People Team, who mediate a midpoint after
  // a moment — a stand-in for their real round-trip.
  const flagFinal = (goalId: string) => {
    dropReportProposal(goalId);
    const pending = finalOf(finalsRef.current, goalId);
    setFinal(goalId, { value: pending.value, status: 'flagged' });
    later(3200, () => {
      const state = finalOf(finalsRef.current, goalId);
      if (state.status !== 'flagged') return;
      const ctx = contextOf(goalId);
      const counterpart = ctx.peer?.rating ?? ratingsRef.current[goalId] ?? ctx.selfRating;
      setFinal(goalId, {
        value: resolveMidpoint(state.value, ctx.selfRating, counterpart),
        status: 'resolved',
      });
    });
  };

  const reopenFinal = (goalId: string) => {
    dropReportProposal(goalId);
    setFinal(goalId, { value: null, status: 'open' });
  };

  const handleSign = (party: SignaturePartyInput) => {
    // The record locks the moment the last outstanding signature lands.
    const before = signaturesRef.current;
    const lastToSign = (['employee', 'manager', 'people_team'] as const)
      .filter((other) => other !== party)
      .every((other) => before[other]);
    setSigning(true);
    void router.post(
      `/cycles/${cycleId}/team-appraisals/${report.id}/sign`,
      { party },
      {
        onSuccess: () => {
          if (lastToSign) {
            setStage('Done');
            return;
          }
          // With the employee and manager in, the People Team countersigns and
          // locks the record after a beat.
          const employeeIn = Boolean(before.employee) || party === 'employee';
          const managerIn = Boolean(before.manager) || party === 'manager';
          if (employeeIn && managerIn && !before.people_team && party !== 'people_team') {
            later(1800, () => {
              if (!signaturesRef.current.people_team) handleSign('people_team');
            });
          }
        },
        onFinish: () => setSigning(false),
      },
    );
  };

  // Once the discussion opens, the report starts proposing numbers for any
  // goal still untouched — staggered so it reads like a real back-and-forth.
  useEffect(() => {
    if (stage !== 'Discussion') return;
    goals.forEach((goal, index) => {
      later(2600 + index * 1300, () => {
        if (stageRef.current !== 'Discussion') return;
        if (finalOf(finalsRef.current, goal.id).status !== 'open') return;
        const self = selfOf(goal.id);
        const managerRating = ratingsRef.current[goal.id] ?? self;
        setReportProposed((prev) => new Set(prev).add(goal.id));
        setFinal(goal.id, {
          value: resolveMidpoint(null, self, managerRating),
          status: 'proposed',
        });
      });
    });
    // The timers read live state through the refs; re-running on other
    // changes would double-book the report's replies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // The report signs from their own seat shortly after the sign-off opens.
  useEffect(() => {
    if (stage !== 'Acknowledge') return;
    if (signatures.employee) return;
    later(2200, () => {
      if (stageRef.current !== 'Acknowledge') return;
      if (!signaturesRef.current.employee) handleSign('employee');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const parties: SignerParty[] = [
    { key: 'employee', person: report, fallbackName: report.name, role: 'Employee' },
    { key: 'manager', person: manager, fallbackName: 'Line manager', role: 'Line Manager' },
    {
      key: 'people_team',
      person: peopleTeam,
      fallbackName: 'People Team',
      role: 'People Team · locks record',
    },
  ];

  const stepper = [
    { title: 'Self-appraisal', hint: first, done: true },
    {
      title: 'Line manager',
      hint: manager ? firstNameOf(manager.name) : 'You',
      done: stage !== 'Manager' && stage !== 'Self',
    },
    { title: 'Final discussion', hint: 'Align', done: stage === 'Acknowledge' || stage === 'Done' },
    { title: 'Acknowledge', hint: 'Sign off', done: stage === 'Done' },
  ];
  const activeStep =
    stage === 'Self' || stage === 'Manager'
      ? 1
      : stage === 'Discussion'
        ? 2
        : stage === 'Acknowledge'
          ? 3
          : 4;

  return (
    <>
      <div className={`card ${styles.demoCard}`}>
        <span className={styles.demoLabel}>Demo · cycle stage</span>
        <div className={styles.demoTabs}>
          {stageFlow.map((s) => {
            const on = s === stage;
            return (
              <button
                key={s}
                type="button"
                className={`${styles.demoTab} ${on ? styles.demoTabOn : ''}`}
                style={on ? { background: stageTone[s] } : undefined}
                onClick={() => goToStage(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button type="button" className={styles.demoReset} onClick={reset}>
          Reset
        </button>
      </div>

      <Banner stage={stage} report={report} first={first} year={year} projected={projected} />

      <div className={`card ${styles.stepper}`}>
        {stepper.map((step, index) => {
          const isActive = index + 1 === activeStep;
          return (
            <div key={step.title} style={{ display: 'contents' }}>
              <div className={styles.stage}>
                <span
                  className={styles.stageDot}
                  style={{
                    background: step.done
                      ? 'var(--teal)'
                      : isActive
                        ? 'var(--ink)'
                        : 'rgba(20, 17, 50, 0.08)',
                    color: step.done || isActive ? 'var(--surface)' : 'var(--text-muted)',
                  }}
                >
                  {step.done ? <Icon name="check" size={15} /> : index + 1}
                </span>
                <span>
                  <span className={styles.stageTitle} style={{ display: 'block' }}>
                    {step.title}
                  </span>
                  <span className={styles.stageHint}>{step.hint}</span>
                </span>
              </div>
              {index < stepper.length - 1 && <span className={styles.stageBar} />}
            </div>
          );
        })}
      </div>

      {(stage === 'Self' || stage === 'Manager') && (
        <div className={emp.keyRow}>
          {scale.map((n) => (
            <span key={n} className={emp.keyItem}>
              <span className={emp.keyItemNum} style={{ background: ratingColour[n] }}>
                {n}
              </span>
              {ratingLabels[n]}
            </span>
          ))}
        </div>
      )}

      {stage === 'Self' && <SelfContext goals={goals} contextOf={contextOf} first={first} />}

      {stage === 'Manager' && (
        <ManagerRatingStage
          goals={goals}
          contextOf={contextOf}
          first={first}
          managerRatings={managerRatings}
          evidence={evidence}
          overallComment={overallComment}
          onRate={rate}
          onEvidence={(goalId, text) => setEvidence((prev) => ({ ...prev, [goalId]: text }))}
          onOverallComment={setOverallComment}
          onAdvance={() => goToStage('Discussion')}
        />
      )}

      {stage === 'Discussion' && (
        <DiscussionStage
          goals={goals}
          contextOf={contextOf}
          first={first}
          managerRatings={managerRatings}
          finals={finals}
          proposedByReport={(goalId) => reportProposed.has(goalId)}
          onPropose={proposeFinal}
          onAgree={agreeFinal}
          onFlag={flagFinal}
          onReopen={reopenFinal}
          onAdvance={() => goToStage('Acknowledge')}
        />
      )}

      {stage === 'Acknowledge' && (
        <SignOffPanel
          parties={parties}
          goalCount={goals.length}
          signatures={signatures}
          signing={signing}
          signerKey="manager"
          signLabel="Sign as manager"
          onSign={() => handleSign('manager')}
        />
      )}

      {stage === 'Done' && (
        <LockedRecord
          name={first}
          year={year}
          final={projected}
          parties={parties}
          signatures={signatures}
        />
      )}
    </>
  );
}

function Banner({
  stage,
  report,
  first,
  year,
  projected,
}: {
  stage: Stage;
  report: User;
  first: string;
  year: number;
  projected: number;
}) {
  const copy: Record<Stage, { kicker: string; title: string; sub: string }> = {
    Self: {
      kicker: `Self-appraisal · ${year}`,
      title: `${first}'s self-appraisal`,
      sub: `${first} rated themselves against each goal. Review it as context before you add your own ratings.`,
    },
    Manager: {
      kicker: `Line-manager stage · ${year}`,
      title: `Rate ${report.name}`,
      sub: `${first} has submitted their self-appraisal. Add your ratings and evidence, then open the alignment discussion.`,
    },
    Discussion: {
      kicker: `Final discussion · ${year}`,
      title: 'Align on the final rating',
      sub: `Compare self and manager ratings for each goal and agree a final number together. Both of you confirm before a goal locks.`,
    },
    Acknowledge: {
      kicker: `Acknowledgement · ${year}`,
      title: 'Sign off the appraisal',
      sub: 'All goals are aligned. Employee, line manager and People Team each sign to complete the record.',
    },
    Done: {
      kicker: `Complete · ${year}`,
      title: 'Appraisal locked',
      sub: 'This appraisal is signed by all parties and locked.',
    },
  };
  const showScore =
    (stage === 'Discussion' || stage === 'Acknowledge' || stage === 'Done') && projected > 0;
  const current = copy[stage];
  return (
    <div className={`grain ${styles.banner}`}>
      <div className={styles.bannerFace}>
        <Avatar userId={report.id} name={report.name} avatarUrl={report.avatarUrl} size={64} />
      </div>
      <div className={styles.bannerBody}>
        <div className={styles.bannerKicker}>{current.kicker}</div>
        <h1 className={styles.bannerTitle}>{current.title}</h1>
        <p className={styles.bannerSub}>{current.sub}</p>
      </div>
      {showScore && (
        <div className={styles.projected}>
          <div className={styles.projectedNum}>{projected.toFixed(1)}</div>
          <div className={styles.projectedTag}>{stage === 'Done' ? 'Final' : 'Projected'}</div>
        </div>
      )}
    </div>
  );
}
