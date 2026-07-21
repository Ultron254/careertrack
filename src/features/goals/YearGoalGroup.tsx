import { useState } from 'react';
import { useYearEvaluation } from '@/api/queries/appraisals';
import { Icon } from '@/components/icons/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { categoryColour, categoryTint } from '@/components/ui/accent';
import { categoryOrder } from './goalCopy';
import type { YearGroup } from './useMyGoals';
import styles from './MyGoals.module.css';

export function YearGoalGroup({ group }: { group: YearGroup }) {
  const [evalOpen, setEvalOpen] = useState(false);
  const evaluation = useYearEvaluation(group.year, evalOpen);

  const goalsByCategory = categoryOrder.map((category) => ({
    category,
    count: group.goals.filter((goal) => goal.category === category).length,
    weight: group.cycle.categoryWeights[category],
  }));

  const summary = `${group.goals.length} ${group.goals.length === 1 ? 'goal' : 'goals'}`;

  return (
    <div className={styles.yearBlock}>
      <div className={`grain ${styles.yearBanner}`}>
        <div className={styles.yearBannerInner}>
          <span className={styles.yearNum}>{group.year}</span>
          <span className={styles.yearSummary}>{summary}</span>
          <span className={styles.cycleBadge}>{group.cycle.state}</span>
          <button
            type="button"
            className={styles.evalButton}
            onClick={() => setEvalOpen((open) => !open)}
          >
            <Icon name="sparkle" size={14} />
            {evalOpen ? 'Hide evaluation' : 'Evaluate with AI'}
          </button>
        </div>
      </div>

      {evalOpen && (
        <div className={styles.evalPanel}>
          <div className={styles.evalHead}>
            <span className={styles.evalMark}>
              <Icon name="sparkle" size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <div className={styles.evalTitle}>AI goal evaluation, {group.year}</div>
              <div className={styles.evalSubtitle}>
                Generated on request from your goals and check-ins
              </div>
            </div>
            {evaluation.data && (
              <>
                <div className={styles.evalScore}>
                  <div className={styles.evalScoreNum}>{evaluation.data.score.toFixed(1)}</div>
                  <div className={styles.evalScoreLabel}>of 4.0</div>
                </div>
                <span className={styles.evalYoy}>{evaluation.data.yoyLabel}</span>
              </>
            )}
          </div>
          <div className={styles.evalBody}>
            {evaluation.isPending && <div className={styles.evalNarrative}>Generating summary.</div>}
            {evaluation.isError && (
              <div className={styles.evalNarrative}>
                The evaluation did not load. Close this panel and try again.
              </div>
            )}
            {evaluation.data && (
              <>
                <div className={styles.evalNarrative}>{evaluation.data.narrative}</div>
                <div className={styles.evalCats}>
                  {evaluation.data.categories.map((entry) => (
                    <div key={entry.category} className={styles.evalCat}>
                      <div className={styles.evalCatHead}>
                        <span>{entry.category}</span>
                        <span
                          className={styles.evalCatScore}
                          style={{ color: categoryColour[entry.category] }}
                        >
                          {entry.score.toFixed(1)}
                        </span>
                      </div>
                      <div className={styles.miniTrack}>
                        <div
                          className={styles.miniFill}
                          style={{
                            width: `${(entry.score / 4) * 100}%`,
                            background: categoryColour[entry.category],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.evalDisclaimer}>
                  AI assessment is advisory and should be reviewed with your line manager. Not a
                  substitute for the formal appraisal.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.catCounts}>
        {goalsByCategory.map((entry) => (
          <div
            key={entry.category}
            className={`card ${styles.catCount}`}
            style={{ borderTopColor: categoryColour[entry.category] }}
          >
            <div className={styles.catCountHead}>
              <span className={styles.catCountNum} style={{ color: categoryColour[entry.category] }}>
                {entry.count}
              </span>
              <span className={styles.catCountWeight}>{entry.weight}%</span>
            </div>
            <div className={styles.catCountLabel}>{entry.category}</div>
          </div>
        ))}
      </div>

      <div className={styles.goalList}>
        {group.goals.length === 0 && (
          <div className={styles.emptyYear}>No goals match the current filters for this year.</div>
        )}
        {group.goals.map((goal) => (
          <div
            key={goal.id}
            className={`card ${styles.goalCard}`}
            style={{ borderLeftColor: categoryColour[goal.category] }}
          >
            <div className={styles.goalCardHead}>
              <span
                className={styles.goalCat}
                style={{
                  background: categoryTint[goal.category],
                  color: categoryColour[goal.category],
                }}
              >
                {goal.category}
              </span>
              <span className={styles.goalWeight}>Weight {goal.weight}%</span>
              <span className={styles.goalStatus}>
                <StatusBadge status={goal.status} />
              </span>
            </div>
            <div className={styles.goalTitle}>{goal.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
