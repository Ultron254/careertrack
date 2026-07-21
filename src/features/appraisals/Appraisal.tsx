import { Icon } from '@/components/icons/Icon';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { categoryColour, categoryTint, ratingColour, ratingLabels } from '@/components/ui/accent';
import type { Rating } from '@/types/domain';
import { AppraisalPeerPanel } from './AppraisalPeerPanel';
import { useSelfAppraisal } from './useSelfAppraisal';
import styles from './Appraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

const stages = [
  { title: 'Self appraisal', hint: 'You, now', active: true },
  { title: 'Line manager', hint: 'Next' },
  { title: 'Final discussion', hint: 'Align rating' },
  { title: 'Acknowledge', hint: 'Sign off' },
];

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
  const a = useSelfAppraisal();

  if (a.isPending) return <ViewSkeleton />;
  if (a.isError || !a.cycle) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={a.error} onRetry={a.refetch} />
      </div>
    );
  }

  return (
    <div className={`view ${styles.page}`}>
      <div className={`grain ${styles.banner}`}>
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
          title="No goals to appraise"
          body="Once your goals are set for this cycle, you can rate yourself against each one here."
        />
      ) : (
        <div className={styles.sections}>
          {a.sections.map((section) => {
            const colour = categoryColour[section.category];
            return (
              <div key={section.category} className={`card ${styles.section}`} style={{ borderLeftColor: colour }}>
                <div className={styles.sectionHead}>
                  <span
                    className={styles.sectionChip}
                    style={{ background: categoryTint[section.category], color: colour }}
                  >
                    <span className={styles.sectionChipDot} style={{ background: colour }} />
                    {section.category} focus
                  </span>
                  <span className={styles.sectionWeight}>Weight {section.weight}%</span>
                </div>

                {section.goals.length === 0 && (
                  <div className={styles.placeholder} style={{ marginBottom: 14 }}>
                    No {section.category} goal in this cycle
                  </div>
                )}

                {section.goals.map((goal) => (
                  <div key={goal.id} className={styles.goalBlock}>
                    <div className={styles.goalTitle}>{goal.title}</div>
                    <div className={styles.ratingColumns}>
                      <div>
                        <div className={`${styles.columnLabel} ${styles.columnLabelSelf}`}>
                          Your rating
                        </div>
                        <RatingScale
                          value={a.ratings[goal.id] ?? null}
                          onPick={(rating) => a.setGoalRating(goal.id, rating)}
                        />
                      </div>
                      <div>
                        <div className={`${styles.columnLabel} ${styles.columnLabelMuted}`}>Manager</div>
                        <div className={styles.placeholder}>Pending</div>
                      </div>
                      <div>
                        <div className={`${styles.columnLabel} ${styles.columnLabelMuted}`}>
                          Final (aligned)
                        </div>
                        <div className={styles.placeholder}>After discussion</div>
                      </div>
                    </div>
                  </div>
                ))}

                {section.commentGoalId && (
                  <>
                    <label className={styles.commentLabel} htmlFor={`comment-${section.category}`}>
                      Examples of behaviour that support your rating
                    </label>
                    <textarea
                      id={`comment-${section.category}`}
                      className={styles.textarea}
                      rows={2}
                      value={a.comments[section.commentGoalId] ?? ''}
                      onChange={(event) =>
                        a.setSectionComment(section.commentGoalId!, event.target.value)
                      }
                      placeholder="Give specific examples"
                    />
                  </>
                )}
              </div>
            );
          })}

          <div className={`card ${styles.blockCard}`}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>Areas for growth and development</div>
              <button type="button" className={styles.addButton} onClick={a.addGrowthArea}>
                Add area
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
