import { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { categoryColour, categoryOrder } from '@/components/ui/accent';
import type { Goal } from '@/types/domain';
import type { useManagerReview } from './useManagerReview';
import styles from './ManagerReview.module.css';

export function ReviewDecisionPanel({
  review,
  goals,
  subjectName,
}: {
  review: ReturnType<typeof useManagerReview>;
  goals: Goal[];
  subjectName: string;
}) {
  const [returning, setReturning] = useState(false);
  const [returnText, setReturnText] = useState('');

  if (review.outcome === 'approved' || review.outcome === 'returned') {
    const approved = review.outcome === 'approved';
    return (
      <div className={`card ${styles.decisionCard}`}>
        <div className={styles.outcome}>
          <div
            className={`${styles.outcomeMark} ${approved ? styles.outcomeMarkApproved : styles.outcomeMarkReturned}`}
          >
            <Icon name={approved ? 'goal' : 'logout'} size={32} />
          </div>
          <div className={styles.outcomeTitle}>
            {approved ? 'Submission approved' : 'Returned to HR'}
          </div>
          <div className={styles.outcomeBody}>
            {approved
              ? `${subjectName}'s goals are locked in. They have been notified and the cycle moves to in progress.`
              : `Routed to HR for review. Once HR signs off, ${subjectName} can edit and resubmit. Your comment travels with it.`}
          </div>
          <button
            type="button"
            className={styles.outcomeBack}
            onClick={() => {
              setReturning(false);
              setReturnText('');
              review.reset();
            }}
          >
            Back to team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${styles.decisionCard}`}>
      <div className={styles.decisionTitle}>Your decision</div>
      <div className={styles.decisionBlurb}>
        Review all four categories, add any comments, then approve or return the whole submission.
      </div>

      <div className={styles.summary}>
        {categoryOrder.map((category) => {
          const count = goals.filter((goal) => goal.category === category).length;
          return (
            <div key={category} className={styles.summaryRow}>
              <span
                className={styles.summarySwatch}
                style={{ background: categoryColour[category] }}
              />
              <span style={{ fontWeight: 600 }}>{category}</span>
              <span className={styles.summaryNote}>
                {count} {count === 1 ? 'goal' : 'goals'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.approveBtn}
        onClick={() => review.decideActive('approved', '')}
        disabled={review.bulkPending}
      >
        Approve submission
      </button>

      {!returning ? (
        <button type="button" className={styles.returnBtn} onClick={() => setReturning(true)}>
          Return with comments
        </button>
      ) : (
        <div>
          <label className={styles.returnLabel} htmlFor="return-comment">
            Overall comment (required to return)
          </label>
          <textarea
            id="return-comment"
            className={styles.returnText}
            rows={3}
            value={returnText}
            onChange={(event) => setReturnText(event.target.value)}
            placeholder="Explain what needs revising"
          />
          <button
            type="button"
            className={styles.confirmReturn}
            disabled={!returnText.trim() || review.bulkPending}
            onClick={() => review.decideActive('returned', returnText)}
          >
            Return to HR for review
          </button>
        </div>
      )}
    </div>
  );
}
