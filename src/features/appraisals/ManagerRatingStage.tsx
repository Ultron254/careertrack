import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { categoryColour, categoryTint, ratingColour, ratingLabels } from '@/components/ui/accent';
import type { Goal, Rating } from '@/types/domain';
import type { GoalContext } from './reviewModel';
import styles from './ManagerAppraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

export function GoalCard({ goal, children }: { goal: Goal; children: React.ReactNode }) {
  return (
    <div
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
      {children}
    </div>
  );
}

// Read-only view of what the report submitted at the self-appraisal stage.
export function SelfContext({
  goals,
  contextOf,
  first,
}: {
  goals: Goal[];
  contextOf: (goalId: string) => GoalContext;
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
          const ctx = contextOf(goal.id);
          return (
            <GoalCard key={goal.id} goal={goal}>
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
            </GoalCard>
          );
        })}
      </div>
    </>
  );
}

// The manager's own rating pass: a 1-4 score plus written evidence per goal,
// with the report's self-rating and advisory peer input alongside.
export function ManagerRatingStage({
  goals,
  contextOf,
  first,
  managerRatings,
  evidence,
  overallComment,
  onRate,
  onEvidence,
  onOverallComment,
  onAdvance,
}: {
  goals: Goal[];
  contextOf: (goalId: string) => GoalContext;
  first: string;
  managerRatings: Record<string, Rating>;
  evidence: Record<string, string>;
  overallComment: string;
  onRate: (goalId: string, rating: Rating) => void;
  onEvidence: (goalId: string, text: string) => void;
  onOverallComment: (text: string) => void;
  onAdvance: () => void;
}) {
  const ratedCount = goals.filter((goal) => managerRatings[goal.id]).length;
  const managerAvg =
    ratedCount > 0
      ? goals.reduce((sum, goal) => sum + (managerRatings[goal.id] ?? 0), 0) / ratedCount
      : 0;

  return (
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
          const ctx = contextOf(goal.id);
          return (
            <GoalCard key={goal.id} goal={goal}>
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
                          onClick={() => onRate(goal.id, n)}
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
                    onChange={(event) => onEvidence(goal.id, event.target.value)}
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
                <span className={styles.peerRating} style={{ color: ratingColour[ctx.peer.rating] }}>
                  {ctx.peer.rating}
                </span>
              </div>
            </GoalCard>
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
            onChange={(event) => onOverallComment(event.target.value)}
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
            onClick={onAdvance}
          >
            Submit &amp; open discussion →
          </button>
        </div>
      </div>
    </>
  );
}
