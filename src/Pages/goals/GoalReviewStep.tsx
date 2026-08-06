import { categoryColour } from '@/Components/ui/accent';
import { Icon } from '@/Components/icons/Icon';
import { categoryOrder } from './goalCopy';
import type { useGoalSetup } from './useGoalSetup';
import styles from './GoalSetup.module.css';

export function GoalReviewStep({
  s,
  onSchedule,
}: {
  s: ReturnType<typeof useGoalSetup>;
  onSchedule: () => void;
}) {
  const { check } = s;

  return (
    <>
      <div className={styles.reviewHead}>
        <span className={styles.reviewChip}>Review and submit</span>
        <span
          className={styles.reviewTotal}
          style={{
            color: check.weightsBalanced ? 'var(--status-approved-fg)' : 'var(--text-muted)',
          }}
        >
          Total weight, {check.total}%
        </span>
      </div>
      <h2 className={styles.headline}>One last look before you submit</h2>
      <p className={styles.blurb}>
        You submit everything together: all four categories at once, not one by one.
      </p>

      <div className={styles.reviewList}>
        {categoryOrder.map((category) => {
          const count = s.goalsByCategory[category].length;
          const done = count > 0;
          return (
            <div key={category} className={styles.reviewRow}>
              <div className={styles.reviewRowHead}>
                <span
                  className={styles.reviewSwatch}
                  style={{ background: categoryColour[category] }}
                />
                <span className={styles.reviewName}>{category}</span>
                <span className={styles.reviewCount}>
                  {count > 0 ? `${count} ${count > 1 ? 'goals' : 'goal'}` : 'none yet'}
                </span>
                <span className={styles.reviewBadge} data-done={done}>
                  {done ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              {!done && (
                <div className={styles.reviewWarn}>Add at least one {category} goal to submit.</div>
              )}
            </div>
          );
        })}
      </div>

      {check.categoriesComplete && !check.weightsBalanced && (
        <div className={styles.reviewWarn} style={{ marginTop: 14 }}>
          Weights total {check.total}%. Adjust each goal so the four categories add up to 100.
        </div>
      )}

      <div className={styles.reviewBook}>
        <span className={styles.reviewBookIcon} aria-hidden>
          <Icon name="cal" size={20} />
        </span>
        <div className={styles.reviewBookText}>
          <div className={styles.reviewBookTitle}>Book a goal review with your manager</div>
          <p className={styles.reviewBookBody}>
            Goals land best in a conversation. A 30-min review, on or off the platform, aligns
            expectations early and speeds up approval.
          </p>
        </div>
        <button type="button" className={styles.reviewBookBtn} onClick={onSchedule}>
          Schedule
        </button>
      </div>

      <div className={styles.submitBlock}>
        <button
          type="button"
          className={styles.submitButton}
          disabled={!check.canSubmit || s.submitting}
          onClick={s.submit}
        >
          {check.canSubmit
            ? 'Submit all goals for review'
            : 'Complete all four categories to submit'}
        </button>
      </div>
    </>
  );
}
