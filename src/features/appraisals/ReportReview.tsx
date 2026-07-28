import { useMemo, useState } from 'react';
import { useCycles, useGoals } from '@/api/queries/goals';
import { useUsers } from '@/api/queries/org';
import {
  useSaveTeamAppraisal,
  useSignTeamAppraisal,
  useTeamAppraisal,
} from '@/api/queries/teamAppraisals';
import type { SignaturePartyInput } from '@/api/schemas/teamAppraisal';
import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { categoryOrder, ratingLabels } from '@/components/ui/accent';
import type { FinalRating, Goal, Rating, TeamAppraisal, User } from '@/types/domain';
import { DiscussionStage } from './DiscussionStage';
import { ManagerRatingStage, SelfContext } from './ManagerRatingStage';
import { Acknowledgement, DoneCard } from './SignOffStage';
import {
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

const scale: Rating[] = [1, 2, 3, 4];

// Loads the cycle, the report's goals and the persisted team-appraisal record,
// then hands over to the stateful body. Keyed by record id so switching report
// or cycle rebuilds the working state from what the server has.
export function ReportReview({ report }: { report: User }) {
  const cyclesQuery = useCycles();
  const cycle = useMemo(() => {
    const cycles = cyclesQuery.data ?? [];
    return cycles.find((c) => c.state === 'open' || c.state === 'closing') ?? cycles[0];
  }, [cyclesQuery.data]);
  const goalsQuery = useGoals(cycle?.id, report.id);
  const recordQuery = useTeamAppraisal(cycle?.id, report.id);
  const usersQuery = useUsers();

  const goals = useMemo(() => {
    const list = goalsQuery.data ?? [];
    return [...list]
      .filter((goal) => goal.cycleId === cycle?.id)
      .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
  }, [goalsQuery.data, cycle?.id]);

  if (goalsQuery.isPending || cyclesQuery.isPending || recordQuery.isPending) {
    return <ViewSkeleton />;
  }
  if (goalsQuery.isError) {
    return <ErrorState error={goalsQuery.error} onRetry={goalsQuery.refetch} />;
  }
  if (recordQuery.isError) {
    return <ErrorState error={recordQuery.error} onRetry={recordQuery.refetch} />;
  }

  const record = recordQuery.data;
  const users = usersQuery.data ?? [];
  const manager = users.find((user) => user.id === record.managerId) ?? null;
  const peopleTeam = users.find((user) => user.role === 'people_team') ?? null;

  return (
    <ReviewBody
      key={record.id}
      record={record}
      report={report}
      manager={manager}
      peopleTeam={peopleTeam}
      goals={goals}
      cycleId={record.cycleId}
      year={cycle?.year ?? new Date().getFullYear()}
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
  const save = useSaveTeamAppraisal(cycleId, report.id);
  const sign = useSignTeamAppraisal(cycleId, report.id);

  // Working copy of the persisted record. Initialised from the server and
  // pushed back through PUT on every meaningful action, so the calibration
  // view and other personas see the manager's progress live.
  const [stage, setStage] = useState<Stage>(fromServerStage(record.stage));
  const [managerRatings, setManagerRatings] = useState(record.managerRatings);
  const [evidence, setEvidence] = useState(record.evidence);
  const [overallComment, setOverallComment] = useState(record.overallComment);
  const [finals, setFinals] = useState(record.finals);
  const [signatures, setSignatures] = useState(record.signatures);

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
    save.mutate(
      {
        stage: toServerStage(patch.stage ?? stage),
        managerRatings: patch.managerRatings ?? managerRatings,
        evidence: patch.evidence ?? evidence,
        overallComment: patch.overallComment ?? overallComment,
        finals: patch.finals ?? finals,
      },
      { onSuccess: (saved) => setSignatures(saved.signatures) },
    );
  };

  const goToStage = (next: Stage) => {
    setStage(next);
    persist({ stage: next });
  };

  const reset = () => {
    setStage('Manager');
    setManagerRatings({});
    setEvidence({});
    setOverallComment('');
    setFinals({});
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
    const next = { ...finals, [goalId]: final };
    setFinals(next);
    persist({ finals: next });
  };

  const proposeFinal = (goalId: string, rating: Rating) =>
    setFinal(goalId, { value: rating, status: 'proposed' });
  const agreeFinal = (goalId: string) =>
    setFinal(goalId, { value: finalOf(finals, goalId).value, status: 'locked' });
  const flagFinal = (goalId: string) =>
    setFinal(goalId, { value: finalOf(finals, goalId).value, status: 'flagged' });
  const resolveFinal = (goalId: string) => {
    const ctx = contextOf(goalId);
    setFinal(goalId, {
      value: resolveMidpoint(finalOf(finals, goalId).value, ctx.selfRating, ctx.peer.rating),
      status: 'resolved',
    });
  };
  const reopenFinal = (goalId: string) => setFinal(goalId, { value: null, status: 'open' });

  const handleSign = (party: SignaturePartyInput) => {
    sign.mutate(party, {
      onSuccess: (signed) => {
        setSignatures(signed.signatures);
        if (signed.stage === 'done') setStage('Done');
      },
    });
  };

  const stepper = [
    { title: 'Self-appraisal', hint: first, done: true },
    { title: 'Line manager', hint: 'You', done: stage !== 'Manager' && stage !== 'Self' },
    { title: 'Final discussion', hint: 'Align', done: stage === 'Acknowledge' || stage === 'Done' },
    { title: 'Acknowledge', hint: 'Sign off', done: stage === 'Done' },
  ];
  const activeStep =
    stage === 'Self' || stage === 'Manager' ? 1 : stage === 'Discussion' ? 2 : stage === 'Acknowledge' ? 3 : 4;

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
          onPropose={proposeFinal}
          onAgree={agreeFinal}
          onFlag={flagFinal}
          onResolve={resolveFinal}
          onReopen={reopenFinal}
          onAdvance={() => goToStage('Acknowledge')}
        />
      )}

      {stage === 'Acknowledge' && (
        <Acknowledgement
          report={report}
          first={first}
          manager={manager}
          peopleTeam={peopleTeam}
          signatures={signatures}
          signing={sign.isPending}
          onSign={handleSign}
        />
      )}

      {stage === 'Done' && <DoneCard report={report} first={first} year={year} projected={projected} />}
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
      sub: `Compare self and manager ratings for each goal and agree a final number together. You both confirm before a goal locks.`,
    },
    Acknowledge: {
      kicker: `Acknowledgement · ${year}`,
      title: 'Sign off the aligned appraisal',
      sub: 'Each party signs to confirm the discussion took place and the ratings are agreed. The People Team signs last to lock the record.',
    },
    Done: {
      kicker: `Complete · ${year}`,
      title: 'Appraisal locked',
      sub: `${report.name}'s ${year} appraisal is signed and locked.`,
    },
  };
  const showScore = stage === 'Discussion' || stage === 'Acknowledge' || stage === 'Done';
  const current = copy[stage];
  return (
    <div className={`grain ${styles.banner}`}>
      <div className={styles.bannerBody}>
        <div className={styles.bannerKicker}>{current.kicker}</div>
        <h1 className={styles.bannerTitle}>{current.title}</h1>
        <p className={styles.bannerSub}>{current.sub}</p>
        {stage === 'Manager' && (
          <div className={styles.key}>
            {scale.map((n) => (
              <span key={n} className={styles.keyChip}>
                <span className={styles.keyNum}>{n}</span>
                {ratingLabels[n]}
              </span>
            ))}
          </div>
        )}
      </div>
      {showScore && projected > 0 ? (
        <div className={styles.projected}>
          <div className={styles.projectedNum}>{projected.toFixed(1)}</div>
          <div className={styles.projectedTag}>{stage === 'Done' ? 'Final' : 'Projected'}</div>
        </div>
      ) : (
        <div className={styles.bannerFace}>
          <Avatar userId={report.id} name={report.name} avatarUrl={report.avatarUrl} size={64} />
        </div>
      )}
    </div>
  );
}
