import { Icon } from '@/components/icons/Icon';
import { ratingColour } from '@/components/ui/accent';
import type { FinalRating, Goal, Rating } from '@/types/domain';
import { GoalCard } from './ManagerRatingStage';
import { finalOf, type GoalContext } from './reviewModel';
import styles from './ManagerAppraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

// The alignment discussion: manager and report agree a final number per goal,
// or flag it for People Team mediation. Everything locks before sign-off.
export function DiscussionStage({
  goals,
  contextOf,
  first,
  managerRatings,
  finals,
  onPropose,
  onAgree,
  onFlag,
  onResolve,
  onReopen,
  onAdvance,
}: {
  goals: Goal[];
  contextOf: (goalId: string) => GoalContext;
  first: string;
  managerRatings: Record<string, Rating>;
  finals: Record<string, FinalRating>;
  onPropose: (goalId: string, rating: Rating) => void;
  onAgree: (goalId: string) => void;
  onFlag: (goalId: string) => void;
  onResolve: (goalId: string) => void;
  onReopen: (goalId: string) => void;
  onAdvance: () => void;
}) {
  const lockedCount = goals.filter((goal) => {
    const { status } = finalOf(finals, goal.id);
    return status === 'locked' || status === 'resolved';
  }).length;
  const flaggedCount = goals.filter((goal) => finalOf(finals, goal.id).status === 'flagged').length;
  const allLocked = goals.length > 0 && lockedCount === goals.length;

  return (
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
          const ctx = contextOf(goal.id);
          const state = finalOf(finals, goal.id);
          const self = ctx.selfRating;
          const manager = managerRatings[goal.id] ?? ctx.selfRating;
          return (
            <GoalCard key={goal.id} goal={goal}>
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
                        onClick={() => onPropose(goal.id, n)}
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
                {state.status === 'open' && <span className={styles.statePill}>No proposal yet</span>}
                {(state.status === 'locked' || state.status === 'resolved') && (
                  <span className={`${styles.statePill} ${styles.statePillLocked}`}>✓ Locked</span>
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
                      onClick={() => onAgree(goal.id)}
                    >
                      ✓ Agree on {state.value}
                    </button>
                    <button
                      type="button"
                      className={styles.flagButton}
                      onClick={() => onFlag(goal.id)}
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
                      onClick={() => onResolve(goal.id)}
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
                    onClick={() => onReopen(goal.id)}
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
            </GoalCard>
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
            onClick={onAdvance}
          >
            Move to acknowledgement →
          </button>
        </div>
      </div>
    </>
  );
}
