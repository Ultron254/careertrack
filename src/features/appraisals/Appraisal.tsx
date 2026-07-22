import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { BrandWatermark } from '@/components/ui/BrandWatermark';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { categoryColour, categoryTint, ratingColour, ratingLabels } from '@/components/ui/accent';
import type { Rating } from '@/types/domain';
import { AppraisalPeerPanel } from './AppraisalPeerPanel';
import { useSelfAppraisal } from './useSelfAppraisal';
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

export function Appraisal() {
  const navigate = useNavigate();
  const a = useSelfAppraisal();

  if (a.isPending) return <ViewSkeleton />;
  if (a.isError || !a.cycle) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={a.error} onRetry={a.refetch} />
      </div>
    );
  }

  const stages = [
    { title: 'Self appraisal', hint: a.phase === 'intro' ? 'Start here' : 'You, now', active: !a.submitted },
    { title: 'Line manager', hint: 'Next', active: false },
    { title: 'Final discussion', hint: 'Align rating', active: false },
    { title: 'Acknowledge', hint: 'Sign off', active: false },
  ];

  return (
    <div className={`view ${styles.page}`}>
      <div className={`oxy-plate oxy-wash grain ${styles.banner}`}>
        <div className={styles.bannerBody}>
          <div className={styles.bannerKicker}>Year end appraisal, {a.cycle.year}</div>
          <h1 className={styles.bannerTitle}>Reflect on your year</h1>
          <p className={styles.bannerSub}>
            Rate yourself against each approved goal on a 1 to 4 scale. Your line manager rates next,
            then you align on a final rating together.
          </p>
          <div className={styles.key}>
            {scale.map((n) => (
              <span key={n} className={styles.keyChip}>
                <span className={styles.keyNum}>{n}</span>
                {ratingLabels[n]}
              </span>
            ))}
          </div>
        </div>
        <BrandWatermark />
      </div>

      <div className={`card ${styles.stepper}`}>
        {stages.map((stage, index) => (
          <div key={stage.title} style={{ display: 'contents' }}>
            <div className={styles.stage}>
              <span
                className={styles.stageDot}
                style={{
                  background: stage.active ? 'var(--teal)' : 'rgba(20, 17, 50, 0.08)',
                  color: stage.active ? 'var(--surface)' : 'var(--text-muted)',
                }}
              >
                {index + 1}
              </span>
              <span>
                <span className={styles.stageTitle} style={{ display: 'block' }}>
                  {stage.title}
                </span>
                <span className={styles.stageHint}>{stage.hint}</span>
              </span>
            </div>
            {index < stages.length - 1 && <span className={styles.stageBar} />}
          </div>
        ))}
      </div>

      {a.submitted ? (
        <>
          <div className={`card ${styles.doneCard}`}>
            <div className={styles.doneMark}>
              <Icon name="goal" size={42} />
            </div>
            <h2 className={styles.doneTitle}>Self appraisal submitted</h2>
            <p className={styles.doneBody}>
              Sent to your line manager for the next stage. You will be invited to a final
              discussion, then asked to acknowledge and sign off your aligned rating.
            </p>
          </div>
          <AppraisalPeerPanel a={a} />
        </>
      ) : a.totalGoals === 0 ? (
        <EmptyState
          title="No approved goals to appraise"
          body="Once your goals are approved for this cycle, you can start a self appraisal here."
          action={
            <button type="button" className={styles.submitButton} onClick={() => navigate('/goals')}>
              Open my goals
            </button>
          }
        />
      ) : a.phase === 'intro' ? (
        <div className={`card ${styles.startCard}`}>
          <div className={styles.startMark}>
            <Icon name="goal" size={36} />
          </div>
          <h2 className={styles.startTitle}>Ready to start your self appraisal?</h2>
          <p className={styles.startBody}>
            You have <strong>{a.totalGoals}</strong> approved goal{a.totalGoals === 1 ? '' : 's'} for{' '}
            {a.cycle.year}. We will walk you through each one, then growth areas and your overall
            rating. You can save a draft at any time.
          </p>
          <ol className={styles.startSteps}>
            <li>Rate each approved goal on the 1 to 4 scale</li>
            <li>Note areas you want to grow next year</li>
            <li>Set an overall self rating and submit</li>
          </ol>
          <button type="button" className={styles.submitButton} onClick={a.start}>
            Start self appraisal
          </button>
        </div>
      ) : a.phase === 'goals' && a.currentGoal ? (
        <div className={styles.sections}>
          <div className={`card ${styles.wizardCard}`}>
            <div className={styles.wizardMeta}>
              Goal {a.goalStep + 1} of {a.flatGoals.length}
            </div>
            <span
              className={styles.sectionChip}
              style={{
                background: categoryTint[a.currentGoal.category],
                color: categoryColour[a.currentGoal.category],
              }}
            >
              <span
                className={styles.sectionChipDot}
                style={{ background: categoryColour[a.currentGoal.category] }}
              />
              {a.currentGoal.category} · weight {a.currentGoal.weight}%
            </span>
            <h2 className={styles.wizardTitle}>{a.currentGoal.title}</h2>
            <p className={styles.wizardHint}>
              How would you rate your delivery against this goal?
            </p>
            <div className={styles.wizardScale}>
              <RatingScale
                value={a.ratings[a.currentGoal.id] ?? null}
                onPick={(rating) => a.setGoalRating(a.currentGoal!.id, rating)}
                large
              />
              <div className={styles.wizardLabels}>
                {scale.map((n) => (
                  <span key={n}>{ratingLabels[n]}</span>
                ))}
              </div>
            </div>
            <label className={styles.commentLabel} htmlFor="goal-comment">
              Examples of behaviour that support your rating
            </label>
            <textarea
              id="goal-comment"
              className={styles.textarea}
              rows={3}
              value={a.comments[a.currentGoal.id] ?? ''}
              onChange={(event) => a.setSectionComment(a.currentGoal!.id, event.target.value)}
              placeholder="Give specific examples"
            />
            <div className={styles.wizardNav}>
              <button type="button" className={styles.draftButton} onClick={a.backGoal}>
                Back
              </button>
              <button type="button" className={styles.draftButton} onClick={a.saveDraft} disabled={a.saving}>
                Save draft
              </button>
              <button type="button" className={styles.submitButton} onClick={a.nextGoal}>
                {a.goalStep >= a.flatGoals.length - 1 ? 'Continue to growth areas' : 'Next goal'}
              </button>
            </div>
          </div>
        </div>
      ) : a.phase === 'growth' ? (
        <div className={styles.sections}>
          <div className={`card ${styles.blockCard}`}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>Areas for growth and development</div>
              <button type="button" className={styles.addButton} onClick={a.addGrowthArea}>
                Add area
              </button>
            </div>
            <p className={styles.wizardHint} style={{ marginTop: 0 }}>
              Optional, but helpful for your line manager conversation.
            </p>
            <div className={styles.growthList}>
              {a.growthAreas.length === 0 && (
                <div className={styles.placeholder}>
                  Add an area you want to develop next year, or skip ahead.
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
            <div className={styles.wizardNav}>
              <button type="button" className={styles.draftButton} onClick={() => a.setPhase('goals')}>
                Back
              </button>
              <button type="button" className={styles.draftButton} onClick={a.saveDraft} disabled={a.saving}>
                Save draft
              </button>
              <button type="button" className={styles.submitButton} onClick={() => a.setPhase('overall')}>
                Continue to overall rating
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.sections}>
          <div className={`card ${styles.blockCard}`}>
            <div className={styles.overallHead}>
              <div className={styles.blockTitle}>Overall self rating</div>
              {a.suggested && (
                <span className={styles.suggested}>
                  Suggested from your goals: <strong>{a.suggested}</strong>
                </span>
              )}
            </div>
            <div className={styles.overallColumns}>
              <div>
                <div className={`${styles.columnLabel} ${styles.columnLabelSelf}`}>You</div>
                <RatingScale value={a.overallRating} onPick={a.setOverallRating} large />
              </div>
              <div>
                <div className={`${styles.columnLabel} ${styles.columnLabelMuted}`}>Manager</div>
                <div className={styles.placeholder}>Pending</div>
              </div>
              <div>
                <div className={`${styles.columnLabel} ${styles.columnLabelMuted}`}>Aligned</div>
                <div className={styles.placeholder}>After discussion</div>
              </div>
            </div>
            <textarea
              className={styles.textarea}
              style={{ marginTop: 14 }}
              rows={2}
              value={a.overallComment}
              onChange={(event) => a.setOverallComment(event.target.value)}
              placeholder="Overall comments"
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
            <button type="button" className={styles.draftButton} onClick={() => a.setPhase('growth')}>
              Back
            </button>
            <button type="button" className={styles.draftButton} onClick={a.saveDraft} disabled={a.saving}>
              Save as draft
            </button>
            <button
              type="button"
              className={styles.submitButton}
              onClick={a.submit}
              disabled={!a.canSubmit || a.submitting}
            >
              Submit self appraisal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
