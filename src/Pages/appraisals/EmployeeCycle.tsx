import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/Context/AuthContext';
import { router } from '@/Lib/router';
import type { SignaturePartyInput } from '@/Types/teamAppraisal';
import { Icon } from '@/Components/icons/Icon';
import { Avatar } from '@/Components/ui/Avatar';
import { BrandWatermark } from '@/Components/ui/BrandWatermark';
import { ErrorState } from '@/Components/ui/States';
import { ratingColour, ratingLabels } from '@/Components/ui/accent';
import type { FinalRating, Rating, TeamAppraisal, User } from '@/Types/domain';
import type { SelfAppraisalData } from './Appraisal';
import { EmployeeSelfStage } from './EmployeeSelfStage';
import {
  EmployeeDiscussion,
  LockedRecord,
  SignOffPanel,
  WaitingOnManager,
  type SignerParty,
} from './EmployeeStages';
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
import { useSelfAppraisal } from './useSelfAppraisal';
import styles from './Appraisal.module.css';
import shared from './ManagerAppraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

// Everyone who signs at the acknowledgement stage, in the order they sign.
const signingOrder: SignaturePartyInput[] = ['employee', 'manager', 'people_team'];

// The employee's walk through the whole appraisal cycle: self-appraisal, the
// line-manager wait, the alignment discussion, three-party sign-off and the
// locked record. It works the same team-appraisal record the manager flow
// uses, so both sides of the demo stay consistent. The stage toolbar is a
// demo affordance — in production the cycle stage comes from the backend.
export function EmployeeCycle({ self }: { self: SelfAppraisalData }) {
  const { user } = useAuth();
  const a = useSelfAppraisal(self);

  if (!a.cycle || !user || !self.record) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState message="No appraisal cycle is open right now." />
      </div>
    );
  }

  return (
    <CycleBody
      key={self.record.id}
      a={a}
      record={self.record}
      user={user}
      year={a.cycle.year}
      cycleId={a.cycle.id}
    />
  );
}

function CycleBody({
  a,
  record,
  user,
  year,
  cycleId,
}: {
  a: ReturnType<typeof useSelfAppraisal>;
  record: TeamAppraisal;
  user: User;
  year: number;
  cycleId: string;
}) {
  const [signing, setSigning] = useState(false);

  // Pick up where the persisted record left off; a fresh record starts at the
  // self-appraisal (or the manager wait, if the form is already submitted).
  const [stage, setStage] = useState<Stage>(() => {
    const fromRecord = fromServerStage(record.stage);
    if (fromRecord === 'Manager') return a.submitted ? 'Manager' : 'Self';
    return fromRecord;
  });
  const [managerRatings, setManagerRatings] = useState(record.managerRatings);
  const [finals, setFinals] = useState(record.finals);
  // Signatures arrive with each fresh props payload; the ref lets the timers
  // below read the latest state instead of the render they were scheduled in.
  const signatures = record.signatures;
  const signaturesRef = useRef(signatures);
  signaturesRef.current = signatures;

  // Refs so the simulated-counterparty timers always read fresh state.
  const finalsRef = useRef(finals);
  finalsRef.current = finals;

  // Timers standing in for the manager and People Team acting on their side.
  // Cleared on unmount so a navigation away doesn't fire ghost updates.
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);
  const later = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  };

  const firstName = firstNameOf(user.name);
  const manager = user.managerId ? a.usersById.get(user.managerId) : undefined;
  const managerFirst = manager ? firstNameOf(manager.name) : 'your manager';
  const peopleTeam = [...a.usersById.values()].find((u) => u.role === 'people_team') ?? null;

  const goals = a.flatGoals;
  // The real submitted self-rating where the form was filled in; the stable
  // stand-in keeps the demo coherent when someone jumps ahead via the toolbar.
  const selfOf = (goalId: string) => a.ratings[goalId] ?? goalContext(goalId).selfRating;
  const managerOf = (goalId: string) =>
    managerRatings[goalId] ?? demoManagerRating(goalId, selfOf(goalId));

  const projected = projectedAverage(goals, finals, managerRatings, selfOf);

  const persist = (patch: {
    stage?: Stage;
    managerRatings?: Record<string, Rating>;
    finals?: Record<string, FinalRating>;
  }) => {
    void router.put(`/cycles/${cycleId}/team-appraisals/${user.id}`, {
      stage: toServerStage(patch.stage ?? stage),
      managerRatings: patch.managerRatings ?? managerRatings,
      evidence: record.evidence,
      overallComment: record.overallComment,
      finals: patch.finals ?? finals,
    });
  };

  // Once the discussion is in sight the manager's numbers have to exist. Use
  // whatever the manager persona actually rated, otherwise seed the demo
  // stand-ins so both sides of the record agree on the numbers.
  const ensureManagerRatings = (): Record<string, Rating> => {
    if (Object.keys(managerRatings).length) return managerRatings;
    const seeded: Record<string, Rating> = {};
    for (const goal of goals) seeded[goal.id] = demoManagerRating(goal.id, selfOf(goal.id));
    setManagerRatings(seeded);
    return seeded;
  };

  const goToStage = (next: Stage) => {
    setStage(next);
    const patch: Parameters<typeof persist>[0] = { stage: next };
    if (next === 'Discussion' || next === 'Acknowledge' || next === 'Done') {
      patch.managerRatings = ensureManagerRatings();
    }
    persist(patch);
  };

  // Submitting the form hands the appraisal to the line manager, so the view
  // moves along with it.
  const submittedBefore = useRef(a.submitted);
  useEffect(() => {
    if (a.submitted && !submittedBefore.current && stage === 'Self') {
      goToStage('Manager');
    }
    submittedBefore.current = a.submitted;
  });

  const reset = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setStage(a.submitted ? 'Manager' : 'Self');
    setManagerRatings({});
    setFinals({});
    persist({ stage: 'Self', managerRatings: {}, finals: {} });
  };

  const applyFinal = (goalId: string, final: FinalRating) => {
    const next = { ...finalsRef.current, [goalId]: final };
    setFinals(next);
    persist({ finals: next });
  };

  const propose = (goalId: string, rating: Rating) => {
    applyFinal(goalId, { value: rating, status: 'proposed' });
    // The manager confirms on their own screen; the demo stands in for that
    // round-trip with a short delay before the goal locks.
    later(2400, () => {
      const pending = finalsRef.current[goalId];
      if (pending?.status !== 'proposed' || pending.value !== rating) return;
      applyFinal(goalId, { value: pending.value, status: 'locked' });
    });
  };

  const flag = (goalId: string) => {
    applyFinal(goalId, { value: finalOf(finalsRef.current, goalId).value, status: 'flagged' });
    // The People Team mediates flagged goals; the demo resolves at the
    // midpoint of the two views after a moment.
    later(3200, () => {
      const pending = finalsRef.current[goalId];
      if (pending?.status !== 'flagged') return;
      applyFinal(goalId, {
        value: resolveMidpoint(pending.value, selfOf(goalId), managerOf(goalId)),
        status: 'resolved',
      });
    });
  };

  const signAs = (party: SignaturePartyInput) => {
    if (signaturesRef.current[party]) return;
    // The record locks the moment the last outstanding signature lands.
    const lastToSign = signingOrder
      .filter((other) => other !== party)
      .every((other) => signaturesRef.current[other]);
    setSigning(true);
    void router.post(
      `/cycles/${cycleId}/team-appraisals/${user.id}/sign`,
      { party },
      {
        onSuccess: () => {
          // The counterparties sign from their own screens; the demo walks them
          // in one after the other so the hand-off is visible.
          if (party === 'employee') later(1800, () => signAs('manager'));
          if (party === 'manager') later(1800, () => signAs('people_team'));
          if (lastToSign) setStage('Done');
        },
        onFinish: () => setSigning(false),
      },
    );
  };

  const parties: SignerParty[] = [
    { key: 'employee', person: user, fallbackName: 'You', role: 'Employee' },
    { key: 'manager', person: manager ?? null, fallbackName: 'Line manager', role: 'Line Manager' },
    {
      key: 'people_team',
      person: peopleTeam,
      fallbackName: 'People Team',
      role: 'People Team · locks record',
    },
  ];

  const copy: Record<Stage, { kicker: string; title: string; sub: string }> = {
    Self: {
      kicker: `Year-end appraisal · ${year}`,
      title: `Reflect on your year${firstName ? `, ${firstName}` : ''} \u2728`,
      sub: 'Rate yourself against each approved goal on a 1 to 4 scale. Your line manager rates next, then you align on a final rating together.',
    },
    Manager: {
      kicker: `Line-manager stage · ${year}`,
      title: 'With your line manager',
      sub: `${manager?.name ?? 'Your line manager'} is reviewing your self-appraisal and adding their ratings. You'll align together next.`,
    },
    Discussion: {
      kicker: `Final discussion · ${year}`,
      title: 'Align on the final rating',
      sub: 'Compare self and manager ratings for each goal and agree a final number together. Both of you confirm before a goal locks.',
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
  const showScore = stage === 'Discussion' || stage === 'Acknowledge' || stage === 'Done';

  const activeStep =
    stage === 'Self' || stage === 'Manager'
      ? stage === 'Self'
        ? 1
        : 2
      : stage === 'Discussion'
        ? 3
        : stage === 'Acknowledge'
          ? 4
          : 5;
  const steps = [
    { title: 'Self-appraisal', hint: firstName || 'You' },
    { title: 'Line manager', hint: manager ? firstNameOf(manager.name) : 'Manager' },
    { title: 'Final discussion', hint: 'Align' },
    { title: 'Acknowledge', hint: 'Sign-off' },
  ];

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
        <div className={styles.bannerFace}>
          <Avatar userId={user.id} name={user.name} avatarUrl={user.avatarUrl} size={48} />
        </div>
        <div className={styles.bannerBody}>
          <div className={styles.bannerKicker}>{copy[stage].kicker}</div>
          <h1 className={styles.bannerTitle}>{copy[stage].title}</h1>
          <p className={styles.bannerSub}>{copy[stage].sub}</p>
        </div>
        {showScore && projected > 0 && (
          <div className={styles.projected}>
            <div className={styles.projectedNum}>{projected.toFixed(1)}</div>
            <div className={styles.projectedTag}>{stage === 'Done' ? 'Final' : 'Projected'}</div>
          </div>
        )}
        <BrandWatermark />
      </div>

      <div className={`card ${styles.stepper}`}>
        {steps.map((step, index) => {
          const done = index + 1 < activeStep;
          const isActive = index + 1 === activeStep;
          return (
            <div key={step.title} style={{ display: 'contents' }}>
              <div className={styles.stage}>
                <span
                  className={styles.stageDot}
                  style={{
                    background: done
                      ? 'var(--teal)'
                      : isActive
                        ? 'var(--ink)'
                        : 'rgba(20, 17, 50, 0.08)',
                    color: done || isActive ? 'var(--surface)' : 'var(--text-muted)',
                  }}
                >
                  {done ? <Icon name="check" size={15} /> : index + 1}
                </span>
                <span>
                  <span className={styles.stageTitle} style={{ display: 'block' }}>
                    {step.title}
                  </span>
                  <span className={styles.stageHint}>{step.hint}</span>
                </span>
              </div>
              {index < steps.length - 1 && <span className={styles.stageBar} />}
            </div>
          );
        })}
      </div>

      {(stage === 'Self' || stage === 'Manager') && (
        <div className={styles.keyRow}>
          {scale.map((n) => (
            <span key={n} className={styles.keyItem}>
              <span className={styles.keyItemNum} style={{ background: ratingColour[n] }}>
                {n}
              </span>
              {ratingLabels[n]}
            </span>
          ))}
        </div>
      )}

      {stage === 'Self' && (
        <EmployeeSelfStage a={a} managerName={manager?.name ?? 'your line manager'} />
      )}

      {stage === 'Manager' && <WaitingOnManager goals={goals} selfOf={selfOf} />}

      {stage === 'Discussion' && (
        <EmployeeDiscussion
          goals={goals}
          selfOf={selfOf}
          managerOf={managerOf}
          finals={finals}
          managerFirst={managerFirst}
          onPropose={propose}
          onFlag={flag}
          onAdvance={() => goToStage('Acknowledge')}
        />
      )}

      {stage === 'Acknowledge' && (
        <SignOffPanel
          parties={parties}
          goalCount={goals.length}
          signatures={signatures}
          signing={signing}
          signerKey="employee"
          signLabel="Sign as you"
          onSign={() => signAs('employee')}
        />
      )}

      {stage === 'Done' && (
        <LockedRecord
          name={firstName || user.name}
          year={year}
          final={projected}
          parties={parties}
          signatures={signatures}
        />
      )}
    </div>
  );
}
