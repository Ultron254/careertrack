import { useMemo, useState } from 'react';
import { useCycles, useGoals } from '@/api/queries/goals';
import { useUsers } from '@/api/queries/org';
import { useAuth } from '@/auth/authProvider';
import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import {
  categoryColour,
  categoryOrder,
  categoryTint,
  ratingColour,
  ratingLabels,
} from '@/components/ui/accent';
import type { Goal, Rating, User } from '@/types/domain';
import { Appraisal } from './Appraisal';
import styles from './ManagerAppraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

// The manager walks a report's appraisal through these stages. "Self" is the
// report's own submission (read-only context); the rest are the manager's work.
const stageFlow = ['Self', 'Manager', 'Discussion', 'Acknowledge', 'Done'] as const;
type Stage = (typeof stageFlow)[number];

const stageTone: Record<Stage, string> = {
  Self: 'var(--blue)',
  Manager: 'var(--gold)',
  Discussion: 'var(--orange)',
  Acknowledge: 'var(--teal)',
  Done: 'var(--ink)',
};

// --- Dummy appraisal context -------------------------------------------------
// The appraisals API does not yet return a report's submitted self-ratings, the
// per-goal comments they wrote, or the advisory peer input a manager sees while
// rating. We derive a stable stand-in from each goal id so the numbers stay put
// between renders. Replace with the real submitted appraisal + peer records.
const peerPool = [
  { name: 'Sana Patel', dept: 'Client Service' },
  { name: 'Grace Achieng', dept: 'Client Service' },
  { name: 'Kevin Njoroge', dept: 'Digital' },
  { name: 'Faith Chebet', dept: 'Creative' },
] as const;

const peerQuotes = [
  'Dependable partner on shared accounts — always shares context early.',
  'Brought real structure to our last pitch and kept everyone on track.',
  'Generous with feedback and quick to unblock the wider team.',
  'Client-ready work, though timelines occasionally slipped under pressure.',
] as const;

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

interface GoalContext {
  selfRating: Rating;
  selfComment: string;
  peer: { name: string; dept: string; quote: string; rating: Rating };
}

function goalContext(goalId: string): GoalContext {
  const h = hashId(goalId);
  const selfRating = (((h >>> 2) % 3) + 2) as Rating; // 2..4, people rate themselves kindly
  const peerRating = Math.min(4, Math.max(1, selfRating + ((h >>> 5) % 3) - 1)) as Rating;
  return {
    selfRating,
    selfComment: 'Delivered against this consistently and kept stakeholders informed throughout.',
    peer: {
      ...peerPool[h % peerPool.length],
      quote: peerQuotes[(h >>> 4) % peerQuotes.length],
      rating: peerRating,
    },
  };
}

const firstNameOf = (name: string) => name.split(' ')[0];

function ratingWord(value: number): string {
  const rounded = Math.min(4, Math.max(1, Math.round(value))) as Rating;
  return ratingLabels[rounded];
}

export function ManagerAppraisalFlow() {
  const { user } = useAuth();
  const usersQuery = useUsers();
  const [tab, setTab] = useState<'me' | 'team'>('me');

  if (usersQuery.isPending) return <ViewSkeleton />;
  if (usersQuery.isError) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={usersQuery.error} onRetry={usersQuery.refetch} />
      </div>
    );
  }

  const reports = (usersQuery.data ?? []).filter((u) => u.managerId === user?.id);

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.switch}>
        <button
          type="button"
          className={`${styles.switchTab} ${tab === 'me' ? styles.switchTabOn : ''}`}
          onClick={() => setTab('me')}
        >
          My appraisal
        </button>
        <button
          type="button"
          className={`${styles.switchTab} ${tab === 'team' ? styles.switchTabOn : ''}`}
          onClick={() => setTab('team')}
        >
          My team{reports.length ? ` · ${reports.length}` : ''}
        </button>
      </div>

      {tab === 'me' ? <Appraisal selfOnly /> : <TeamAppraisals reports={reports} />}
    </div>
  );
}

function TeamAppraisals({ reports }: { reports: User[] }) {
  const [reportId, setReportId] = useState(reports[0]?.id ?? '');

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No direct reports yet"
        body="Once team members report to you, their appraisals appear here for rating and sign-off."
      />
    );
  }

  const report = reports.find((r) => r.id === reportId) ?? reports[0];

  return (
    <>
      {reports.length > 1 && (
        <div className={styles.reportBar}>
          <span className={styles.reportLabel}>Reviewing</span>
          {reports.map((r) => {
            const on = r.id === report.id;
            return (
              <button
                key={r.id}
                type="button"
                className={`${styles.reportChip} ${on ? styles.reportChipOn : ''}`}
                onClick={() => setReportId(r.id)}
              >
                <Avatar userId={r.id} name={r.name} avatarUrl={r.avatarUrl} size={28} />
                {firstNameOf(r.name)}
              </button>
            );
          })}
        </div>
      )}

      {/* Reset the whole flow when the manager switches to a different report. */}
      <ReportReview key={report.id} report={report} />
    </>
  );
}

interface FinalState {
  value: Rating | null;
  status: 'open' | 'proposed' | 'locked' | 'flagged' | 'resolved';
}

function ReportReview({ report }: { report: User }) {
  const cyclesQuery = useCycles();
  const cycle = useMemo(() => {
    const cycles = cyclesQuery.data ?? [];
    return cycles.find((c) => c.state === 'open' || c.state === 'closing') ?? cycles[0];
  }, [cyclesQuery.data]);
  const goalsQuery = useGoals(cycle?.id, report.id);

  const [stage, setStage] = useState<Stage>('Manager');
  const [managerRatings, setManagerRatings] = useState<Record<string, Rating>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [overallComment, setOverallComment] = useState('');
  const [finals, setFinals] = useState<Record<string, FinalState>>({});
  const [signatures, setSignatures] = useState({
    employee: false,
    manager: false,
    peopleTeam: false,
  });

  const goals = useMemo(() => {
    const list = goalsQuery.data ?? [];
    return [...list]
      .filter((goal) => goal.cycleId === cycle?.id)
      .sort(
        (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category),
      );
  }, [goalsQuery.data, cycle?.id]);

  if (goalsQuery.isPending || cyclesQuery.isPending) return <ViewSkeleton />;
  if (goalsQuery.isError) {
    return <ErrorState error={goalsQuery.error} onRetry={goalsQuery.refetch} />;
  }

  const year = cycle?.year ?? new Date().getFullYear();
  const first = firstNameOf(report.name);
  const context = new Map(goals.map((goal) => [goal.id, goalContext(goal.id)] as const));

  const finalOf = (goalId: string): FinalState => finals[goalId] ?? { value: null, status: 'open' };
  const bestFinal = (goal: Goal): number =>
    finalOf(goal.id).value ?? managerRatings[goal.id] ?? context.get(goal.id)?.selfRating ?? 0;

  const projected = goals.length
    ? goals.reduce((sum, goal) => sum + bestFinal(goal), 0) / goals.length
    : 0;

  const ratedCount = goals.filter((goal) => managerRatings[goal.id]).length;
  const managerAvg =
    ratedCount > 0
      ? goals.reduce((sum, goal) => sum + (managerRatings[goal.id] ?? 0), 0) / ratedCount
      : 0;

  const lockedCount = goals.filter((goal) => {
    const { status } = finalOf(goal.id);
    return status === 'locked' || status === 'resolved';
  }).length;
  const flaggedCount = goals.filter((goal) => finalOf(goal.id).status === 'flagged').length;
  const allLocked = goals.length > 0 && lockedCount === goals.length;

  const setManagerRating = (goalId: string, rating: Rating) =>
    setManagerRatings((prev) => ({ ...prev, [goalId]: rating }));

  const proposeFinal = (goalId: string, rating: Rating) =>
    setFinals((prev) => ({ ...prev, [goalId]: { value: rating, status: 'proposed' } }));
  const agreeFinal = (goalId: string) =>
    setFinals((prev) => ({
      ...prev,
      [goalId]: { value: prev[goalId]?.value ?? null, status: 'locked' },
    }));
  const flagFinal = (goalId: string) =>
    setFinals((prev) => ({
      ...prev,
      [goalId]: { value: prev[goalId]?.value ?? null, status: 'flagged' },
    }));
  const resolveFinal = (goalId: string) =>
    setFinals((prev) => {
      const ctx = context.get(goalId);
      const midpoint = Math.round(
        ((prev[goalId]?.value ?? ctx?.selfRating ?? 2) + (ctx?.peer.rating ?? 2)) / 2,
      );
      return {
        ...prev,
        [goalId]: { value: Math.min(4, Math.max(1, midpoint)) as Rating, status: 'resolved' },
      };
    });
  const reopenFinal = (goalId: string) =>
    setFinals((prev) => ({ ...prev, [goalId]: { value: null, status: 'open' } }));

  const stepper = [
    { title: 'Self-appraisal', hint: first, done: true },
    { title: 'Line manager', hint: 'You', done: stage !== 'Manager' && stage !== 'Self' },
    {
      title: 'Final discussion',
      hint: 'Align',
      done: stage === 'Acknowledge' || stage === 'Done',
    },
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
                onClick={() => setStage(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.demoReset}
          onClick={() => {
            setStage('Manager');
            setManagerRatings({});
            setEvidence({});
            setOverallComment('');
            setFinals({});
            setSignatures({ employee: false, manager: false, peopleTeam: false });
          }}
        >
          Reset
        </button>
      </div>

      <Banner
        stage={stage}
        report={report}
        first={first}
        year={year}
        projected={projected}
      />

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

      {stage === 'Self' && <SelfContext goals={goals} context={context} first={first} />}

      {stage === 'Manager' && (
        <>
          <div className={styles.notice}>
            <Icon name="info" size={16} />
            <span>
              Rate {first} against each goal on a 1–4 scale. You'll see {first}'s self-rating and
              advisory peer input as context — peer scores are non-binding.
            </span>
          </div>
          <div className={styles.sections}>
            {goals.map((goal) => {
              const ctx = context.get(goal.id)!;
              return (
                <div
                  key={goal.id}
                  className={`card ${styles.section}`}
                  style={{ borderLeftColor: categoryColour[goal.category] }}
                >
                  <div className={styles.sectionHead}>
                    <span
                      className={styles.sectionChip}
                      style={{
                        background: categoryTint[goal.category],
                        color: categoryColour[goal.category],
                      }}
                    >
                      <span
                        className={styles.sectionChipDot}
                        style={{ background: categoryColour[goal.category] }}
                      />
                      {goal.category} focus
                    </span>
                    <span className={styles.sectionWeight}>Weight {goal.weight}%</span>
                  </div>
                  <div className={styles.goalTitle}>{goal.title}</div>

                  <div className={styles.rateGrid}>
                    <div className={styles.selfBox}>
                      <div className={styles.selfBoxLabel}>{first}'s self-rating</div>
                      <div className={styles.selfBoxRow}>
                        <span
                          className={styles.selfBoxNum}
                          style={{ color: ratingColour[ctx.selfRating] }}
                        >
                          {ctx.selfRating}
                        </span>
                        <span className={styles.selfBoxWord}>{ratingLabels[ctx.selfRating]}</span>
                      </div>
                    </div>
                    <div>
                      <div className={styles.columnLabel}>Your rating as line manager</div>
                      <div className={styles.scale}>
                        {scale.map((n) => {
                          const on = managerRatings[goal.id] === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              className={styles.scaleButton}
                              onClick={() => setManagerRating(goal.id, n)}
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
                              aria-label={`${n}, ${ratingLabels[n]}`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      <label className={styles.evidenceLabel} htmlFor={`evidence-${goal.id}`}>
                        Evidence for your rating — specific examples
                      </label>
                      <textarea
                        id={`evidence-${goal.id}`}
                        className={styles.textarea}
                        rows={2}
                        value={evidence[goal.id] ?? ''}
                        onChange={(event) =>
                          setEvidence((prev) => ({ ...prev, [goal.id]: event.target.value }))
                        }
                        placeholder="What did you see that supports this rating?"
                      />
                    </div>
                  </div>

                  <div className={styles.peer}>
                    <Avatar userId={`peer-${goal.id}`} name={ctx.peer.name} size={34} />
                    <div className={styles.peerBody}>
                      <div className={styles.peerTop}>
                        <span className={styles.peerTag}>Peer input · advisory</span>
                        <span className={styles.peerName}>{ctx.peer.name}</span>
                        <span className={styles.peerDept}>{ctx.peer.dept}</span>
                      </div>
                      <div className={styles.peerQuote}>&ldquo;{ctx.peer.quote}&rdquo;</div>
                    </div>
                    <span
                      className={styles.peerRating}
                      style={{ color: ratingColour[ctx.peer.rating] }}
                    >
                      {ctx.peer.rating}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="card" style={{ padding: '22px 26px' }}>
              <label className={styles.evidenceLabel} htmlFor="manager-overall" style={{ marginTop: 0 }}>
                Overall manager comment
              </label>
              <textarea
                id="manager-overall"
                className={styles.textarea}
                rows={3}
                value={overallComment}
                onChange={(event) => setOverallComment(event.target.value)}
                placeholder="Summarise the year and set the scene for your discussion…"
              />
            </div>

            <div className={`card ${styles.footer}`}>
              <div className={styles.footerStatus}>
                <strong>
                  {ratedCount}/{goals.length}
                </strong>{' '}
                rated · your suggested overall{' '}
                <strong>{ratedCount ? managerAvg.toFixed(1) : '—'}</strong>
              </div>
              <button
                type="button"
                className={styles.advance}
                disabled={ratedCount < goals.length}
                onClick={() => setStage('Discussion')}
              >
                Submit &amp; open discussion →
              </button>
            </div>
          </div>
        </>
      )}

      {stage === 'Discussion' && (
        <>
          <div className={`${styles.notice} ${flaggedCount ? styles.noticeFlag : ''}`}>
            <Icon name={flaggedCount ? 'info' : 'chat'} size={16} />
            <span>
              {flaggedCount
                ? 'A goal is flagged for People Team mediation. It must be resolved before this appraisal can move on.'
                : `Work through each goal together. You and ${first} both confirm a final number before it locks.`}
            </span>
          </div>
          <div className={styles.sections}>
            {goals.map((goal) => {
              const ctx = context.get(goal.id)!;
              const state = finalOf(goal.id);
              const self = ctx.selfRating;
              const manager = managerRatings[goal.id] ?? ctx.selfRating;
              return (
                <div
                  key={goal.id}
                  className={`card ${styles.section}`}
                  style={{ borderLeftColor: categoryColour[goal.category] }}
                >
                  <div className={styles.sectionHead}>
                    <span
                      className={styles.sectionChip}
                      style={{
                        background: categoryTint[goal.category],
                        color: categoryColour[goal.category],
                      }}
                    >
                      <span
                        className={styles.sectionChipDot}
                        style={{ background: categoryColour[goal.category] }}
                      />
                      {goal.category} focus
                    </span>
                    <span className={styles.sectionWeight}>Weight {goal.weight}%</span>
                  </div>
                  <div className={styles.goalTitle}>{goal.title}</div>

                  <div className={styles.discussRow}>
                    <span className={styles.compare}>
                      Self <span className={styles.compareNum}>{self}</span> · Manager{' '}
                      <span className={styles.compareNum}>{manager}</span> → Agreed final
                    </span>
                    <div className={styles.finalScale}>
                      {scale.map((n) => {
                        const on = state.value === n;
                        const locked = state.status === 'locked' || state.status === 'resolved';
                        return (
                          <button
                            key={n}
                            type="button"
                            className={styles.finalButton}
                            disabled={locked}
                            onClick={() => proposeFinal(goal.id, n)}
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
                    {state.status === 'open' && (
                      <span className={styles.statePill}>No proposal yet</span>
                    )}
                    {(state.status === 'locked' || state.status === 'resolved') && (
                      <span className={`${styles.statePill} ${styles.statePillLocked}`}>
                        ✓ Locked
                      </span>
                    )}
                    {state.status === 'flagged' && (
                      <span className={`${styles.statePill} ${styles.statePillFlagged}`}>
                        Flagged · People Team
                      </span>
                    )}
                  </div>

                  {state.status === 'open' && (
                    <div className={styles.discussHint}>
                      Propose a final rating for {first} to agree.
                    </div>
                  )}
                  {state.status === 'proposed' && (
                    <>
                      <div className={styles.discussHint}>
                        {first} proposed {self}. Agree, counter-propose, or flag.
                      </div>
                      <div className={styles.discussActions}>
                        <button
                          type="button"
                          className={styles.agreeButton}
                          onClick={() => agreeFinal(goal.id)}
                        >
                          ✓ Agree on {state.value}
                        </button>
                        <button
                          type="button"
                          className={styles.flagButton}
                          onClick={() => flagFinal(goal.id)}
                        >
                          🚩 Flag to People Team
                        </button>
                      </div>
                    </>
                  )}
                  {state.status === 'flagged' && (
                    <>
                      <div className={styles.discussHint}>
                        Waiting on the People Team to mediate and set a final rating.
                      </div>
                      <div className={styles.discussActions}>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => resolveFinal(goal.id)}
                        >
                          Simulate People Team resolution
                        </button>
                      </div>
                    </>
                  )}
                  {state.status === 'locked' && (
                    <div className={styles.discussActions}>
                      <span className={styles.discussHint} style={{ margin: 0 }}>
                        Both parties agreed.
                      </span>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => reopenFinal(goal.id)}
                      >
                        Reopen
                      </button>
                    </div>
                  )}
                  {state.status === 'resolved' && (
                    <div className={styles.discussHint} style={{ margin: 0 }}>
                      People Team set the final rating.
                    </div>
                  )}
                </div>
              );
            })}

            <div className={`card ${styles.footer}`}>
              <div className={styles.footerStatus}>
                <strong>
                  {lockedCount}/{goals.length}
                </strong>{' '}
                goals locked
                {flaggedCount ? ` · ${flaggedCount} flagged for People Team` : ''}
              </div>
              <button
                type="button"
                className={`${styles.advance} ${styles.advanceTeal}`}
                disabled={!allLocked}
                onClick={() => setStage('Acknowledge')}
              >
                Move to acknowledgement →
              </button>
            </div>
          </div>
        </>
      )}

      {stage === 'Acknowledge' && (
        <Acknowledgement
          report={report}
          first={first}
          signatures={signatures}
          onSign={(who) =>
            setSignatures((prev) => {
              const next = { ...prev, [who]: true };
              if (next.employee && next.manager && next.peopleTeam) setStage('Done');
              return next;
            })
          }
        />
      )}

      {stage === 'Done' && (
        <DoneCard report={report} first={first} year={year} projected={projected} />
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

function SelfContext({
  goals,
  context,
  first,
}: {
  goals: Goal[];
  context: Map<string, GoalContext>;
  first: string;
}) {
  return (
    <>
      <div className={styles.notice}>
        <Icon name="info" size={16} />
        <span>Read-only. This is what {first} submitted at the self-appraisal stage.</span>
      </div>
      <div className={styles.sections}>
        {goals.map((goal) => {
          const ctx = context.get(goal.id)!;
          return (
            <div
              key={goal.id}
              className={`card ${styles.section}`}
              style={{ borderLeftColor: categoryColour[goal.category] }}
            >
              <div className={styles.sectionHead}>
                <span
                  className={styles.sectionChip}
                  style={{
                    background: categoryTint[goal.category],
                    color: categoryColour[goal.category],
                  }}
                >
                  <span
                    className={styles.sectionChipDot}
                    style={{ background: categoryColour[goal.category] }}
                  />
                  {goal.category} focus
                </span>
                <span className={styles.sectionWeight}>Weight {goal.weight}%</span>
              </div>
              <div className={styles.goalTitle}>{goal.title}</div>
              <div className={styles.discussRow}>
                <span className={styles.compare}>{first}'s self-rating</span>
                <span
                  className={styles.selfBoxNum}
                  style={{ color: ratingColour[ctx.selfRating], fontSize: 24 }}
                >
                  {ctx.selfRating}
                </span>
                <span className={styles.selfBoxWord}>{ratingLabels[ctx.selfRating]}</span>
              </div>
              <div className={styles.peerQuote}>&ldquo;{ctx.selfComment}&rdquo;</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Acknowledgement({
  report,
  first,
  signatures,
  onSign,
}: {
  report: User;
  first: string;
  signatures: { employee: boolean; manager: boolean; peopleTeam: boolean };
  onSign: (who: 'employee' | 'manager' | 'peopleTeam') => void;
}) {
  // The People Team locks the record last, only once both people have signed.
  const parties = [
    {
      key: 'employee' as const,
      name: report.name,
      role: 'Employee',
      userId: report.id,
      avatarUrl: report.avatarUrl,
      cta: `Mark ${first} as signed`,
      enabled: true,
    },
    {
      key: 'manager' as const,
      name: 'David Otieno',
      role: 'Line Manager',
      userId: 'u-david',
      avatarUrl: null,
      cta: 'Sign as manager',
      enabled: true,
    },
    {
      key: 'peopleTeam' as const,
      name: 'Wanjiru Mwangi',
      role: 'People Team · locks record',
      userId: 'u-wanjiru',
      avatarUrl: null,
      cta: 'Lock record',
      enabled: signatures.employee && signatures.manager,
    },
  ];

  return (
    <div className={styles.signList}>
      {parties.map((party) => {
        const signed = signatures[party.key];
        return (
          <div
            key={party.key}
            className={`${styles.signCard} ${
              signed ? styles.signCardDone : party.enabled ? styles.signCardActive : ''
            }`}
          >
            <Avatar userId={party.userId} name={party.name} avatarUrl={party.avatarUrl} size={46} />
            <div className={styles.signBody}>
              <div className={styles.signName}>{party.name}</div>
              <div className={styles.signRole}>{party.role}</div>
            </div>
            {signed ? (
              <span className={styles.signState}>
                <Icon name="check" size={16} /> Signed today
              </span>
            ) : party.enabled ? (
              <button type="button" className={styles.signButton} onClick={() => onSign(party.key)}>
                {party.cta}
              </button>
            ) : (
              <span className={styles.signWaiting}>Awaiting signature</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DoneCard({
  report,
  first,
  year,
  projected,
}: {
  report: User;
  first: string;
  year: number;
  projected: number;
}) {
  return (
    <div className={`card ${styles.doneCard}`}>
      <div className={styles.doneMark}>
        <Icon name="check" size={40} />
      </div>
      <h2 className={styles.doneTitle}>Appraisal complete &amp; locked {'\u{1F389}'}</h2>
      <p className={styles.doneBody}>
        {report.name}'s {year} appraisal is signed by all three parties and locked by the People
        Team.
      </p>
      {projected > 0 && (
        <p className={styles.doneBody}>
          Final overall rating <strong>{projected.toFixed(1)}</strong> · {ratingWord(projected)}.
        </p>
      )}
      <p className={styles.doneBody} style={{ color: 'var(--text-muted)' }}>
        {first} keeps a copy in their record; you can revisit it any time from Reports.
      </p>
    </div>
  );
}
