import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { EmptyState } from '@/components/ui/States';
import { categoryColour, categoryTint, ratingColour, ratingLabels } from '@/components/ui/accent';
import type { Rating } from '@/types/domain';
import { AppraisalPeerPanel } from './AppraisalPeerPanel';
import type { useSelfAppraisal } from './useSelfAppraisal';
import styles from './Appraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

function RatingScale({
  value,
  onPick,
  large,
}: {
  value: Rating | null;
  onPick: (rating: Rating) => void;
  large?: boolean;
}) {
  return (
    <div className={styles.scale}>
      {scale.map((n) => {
        const on = value === n;
        return (
          <button
            key={n}
            type="button"
            className={large ? styles.overallScaleButton : styles.scaleButton}
            onClick={() => onPick(n)}
            style={on ? { background: ratingColour[n], color: 'var(--surface)', borderColor: ratingColour[n] } : undefined}
            aria-pressed={on}
            aria-label={`${n}, ${ratingLabels[n]}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// The self-appraisal stage: one card per approved goal with a 1-4 rating and
// supporting examples, growth areas, and the overall self-rating. Once the
// appraisal is submitted this shows the confirmation card and peer panel
// instead of the form.
export function EmployeeSelfStage({
  a,
  managerName,
}: {
  a: ReturnType<typeof useSelfAppraisal>;
  managerName: string;
}) {
  const navigate = useNavigate();
  const [viewOpen, setViewOpen] = useState(false);

  if (a.submitted) {
    return (
      <>
        <div className={`card ${styles.doneCard}`}>
          <div className={styles.doneMark}>
            <Icon name="check" size={40} />
          </div>
          <h2 className={styles.doneTitle}>Self appraisal submitted {'\u{1F389}'}</h2>
          <p className={styles.doneBody}>
            Sent to {managerName} for the line-manager stage. You will be invited to a final
            discussion, then asked to acknowledge and sign off your aligned rating.
          </p>
          <button
            type="button"
            className={styles.viewButton}
            onClick={() => setViewOpen((open) => !open)}
          >
            {viewOpen ? 'Hide my appraisal' : 'View my appraisal'}
          </button>
        </div>

        {viewOpen && (
          <div className={`card ${styles.summaryCard}`}>
            <div className={styles.summaryHead}>Your submitted ratings</div>
            <div className={styles.summaryList}>
              {a.flatGoals.map((goal) => {
                const rating = a.ratings[goal.id] ?? null;
                return (
                  <div key={goal.id} className={styles.summaryRow}>
                    <span
                      className={styles.summaryChip}
                      style={{
                        background: categoryTint[goal.category],
                        color: categoryColour[goal.category],
                      }}
                    >
                      <span
                        className={styles.summaryChipDot}
                        style={{ background: categoryColour[goal.category] }}
                      />
                      {goal.category}
                    </span>
                    <span className={styles.summaryTitle}>{goal.title}</span>
                    {rating && (
                      <span className={styles.summaryScore} style={{ color: ratingColour[rating] }}>
                        {rating}
                        <span className={styles.summaryScoreUnit}>/4</span>
                      </span>
                    )}
                  </div>
                );
              })}
              <div className={styles.summaryOverall}>
                <span>Overall self rating</span>
                <strong style={{ color: a.overallRating ? ratingColour[a.overallRating] : undefined }}>
                  {a.overallRating ? `${a.overallRating}/4` : 'Not rated'}
                </strong>
              </div>
            </div>
          </div>
        )}

        <AppraisalPeerPanel a={a} />
      </>
    );
  }

  if (a.totalGoals === 0) {
    return (
      <EmptyState
        title="No approved goals to appraise"
        body="Once your goals are approved for this cycle, you can start a self appraisal here."
        action={
          <button type="button" className={styles.submitButton} onClick={() => navigate('/goals')}>
            Open my goals
          </button>
        }
      />
    );
  }

  return (
    <div className={styles.sections}>
      {a.flatGoals.map((goal) => (
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
            <span className={styles.sectionTitle}>{goal.title}</span>
            <span className={styles.sectionWeight}>Weight {goal.weight}%</span>
          </div>
          <div className={`${styles.columnLabel} ${styles.columnLabelSelf}`}>Your rating</div>
          <RatingScale
            value={a.ratings[goal.id] ?? null}
            onPick={(rating) => a.setGoalRating(goal.id, rating)}
          />
          <textarea
            className={styles.textarea}
            style={{ marginTop: 14 }}
            rows={2}
            value={a.comments[goal.id] ?? ''}
            onChange={(event) => a.setSectionComment(goal.id, event.target.value)}
            placeholder={'Examples of behaviour that support your rating\u2026'}
            aria-label={`Examples of behaviour that support your rating for ${goal.title}`}
          />
        </div>
      ))}

      <div className={`card ${styles.blockCard}`}>
        <div className={styles.blockHead}>
          <div className={styles.blockTitle}>Areas for growth &amp; development</div>
          <button type="button" className={styles.addButton} onClick={a.addGrowthArea}>
            + Add area
          </button>
        </div>
        <div className={styles.growthList}>
          {a.growthAreas.length === 0 && (
            <div className={styles.placeholder}>
              Add an area you want to develop next year.
            </div>
          )}
          {a.growthAreas.map((area) => (
            <div key={area.id} className={styles.growthRow}>
              <input
                className={styles.input}
                value={area.area}
                onChange={(event) => a.updateGrowthArea(area.id, 'area', event.target.value)}
                placeholder="Area (e.g. presentation skills)"
              />
              <input
                className={styles.input}
                value={area.whyItMatters}
                onChange={(event) =>
                  a.updateGrowthArea(area.id, 'whyItMatters', event.target.value)
                }
                placeholder="Why it matters"
              />
              <input
                className={styles.input}
                value={area.competencies}
                onChange={(event) =>
                  a.updateGrowthArea(area.id, 'competencies', event.target.value)
                }
                placeholder="Related competencies"
              />
              <button
                type="button"
                className={styles.deleteGrowth}
                onClick={() => a.removeGrowthArea(area.id)}
                aria-label="Remove growth area"
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`card ${styles.blockCard}`}>
        <div className={styles.overallHead}>
          <div className={styles.blockTitle}>Overall self-rating</div>
          <span className={styles.suggested}>
            Suggested from your goals: <strong>{a.suggested ?? '\u2014'}</strong>
          </span>
        </div>
        <RatingScale value={a.overallRating} onPick={a.setOverallRating} large />
        <textarea
          className={styles.textarea}
          style={{ marginTop: 14 }}
          rows={2}
          value={a.overallComment}
          onChange={(event) => a.setOverallComment(event.target.value)}
          placeholder={'Overall comments\u2026'}
          aria-label="Overall comments"
        />
      </div>

      <div className={`card ${styles.submitBar}`}>
        <div className={styles.submitStatus}>
          <strong>
            {a.ratedCount}/{a.totalGoals}
          </strong>{' '}
          goals rated {'\u00b7'} overall{' '}
          {a.overallRating ? `rated ${a.overallRating}` : 'not rated'}
        </div>
        <button type="button" className={styles.draftButton} onClick={a.saveDraft} disabled={a.saving}>
          Save as draft
        </button>
        <button
          type="button"
          className={styles.submitButton}
          onClick={a.submit}
          disabled={!a.canSubmit || a.submitting}
        >
          Submit self-appraisal {'\u2192'}
        </button>
      </div>
    </div>
  );
}
