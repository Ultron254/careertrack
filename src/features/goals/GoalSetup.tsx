import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/icons/Icon';
import { ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { categoryGradient } from '@/components/ui/accent';
import type { CycleState } from '@/types/domain';
import { categoryCopy, categoryOrder } from './goalCopy';
import { GoalCategoryStep } from './GoalCategoryStep';
import { GoalReviewStep } from './GoalReviewStep';
import { REVIEW_STEP, useGoalSetup } from './useGoalSetup';
import styles from './GoalSetup.module.css';

interface BannerCopy {
  gradient: string;
  kicker: string;
  title: string;
  sub: string;
  showCount: boolean;
}

function bannerFor(state: CycleState, year: number, canSubmit: boolean): BannerCopy {
  switch (state) {
    case 'upcoming':
      return {
        gradient: 'linear-gradient(115deg, var(--blue), var(--teal))',
        kicker: 'Goal setting, upcoming',
        title: 'Goal setting opens soon',
        sub: 'Get a head start: jot down ideas across the four categories.',
        showCount: true,
      };
    case 'open':
      return {
        gradient: 'linear-gradient(115deg, var(--teal), var(--blue))',
        kicker: 'Goal setting, open',
        title: 'Goal setting is open',
        sub: 'Set four to five goals, one per category, with at least one stretch goal.',
        showCount: true,
      };
    case 'closed':
      return {
        gradient: 'var(--ink)',
        kicker: 'Goal setting, closed',
        title: 'Goal setting has closed',
        sub: 'Contact HR if you need to add an ad hoc goal.',
        showCount: false,
      };
    case 'closing':
    default:
      return {
        gradient: 'linear-gradient(115deg, var(--orange), var(--gold))',
        kicker: 'Goal setting, closing soon',
        title: `Your ${year} goals are due soon`,
        sub: canSubmit
          ? 'All four categories have goals. Review and submit.'
          : 'Finish every category, then submit them all together.',
        showCount: true,
      };
  }
}

export function GoalSetup() {
  const s = useGoalSetup();
  const navigate = useNavigate();

  if (s.isPending) {
    return (
      <div className={`view ${styles.page}`}>
        <Skeleton height={92} radius={24} style={{ marginBottom: 16 }} />
        <Skeleton height={62} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton height={520} radius={22} />
      </div>
    );
  }

  if (s.isError || !s.activeCycle) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={s.error} onRetry={() => s.refetch()} />
      </div>
    );
  }

  if (s.submitted) {
    return (
      <div className={`view ${styles.page}`}>
        <div className={styles.submittedWrap}>
          <div className={styles.submittedCard}>
            <div className={styles.submittedMark}>
              <Icon name="goal" size={44} />
            </div>
            <h2 className={styles.submittedTitle}>Goals submitted</h2>
            <p className={styles.submittedBody}>
              Your {s.activeCycle.year} goals are with your manager for review. You can track their
              status on My Goals, and you will be notified when they are approved or returned.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button onClick={() => navigate('/goals')}>Go to My Goals</Button>
              <Button variant="surface" onClick={s.reviewSubmission}>
                Back to review
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cycle = s.activeCycle;
  const banner = bannerFor(cycle.state, cycle.year, s.check.canSubmit);
  const daysLeft = Math.max(0, differenceInCalendarDays(parseISO(cycle.closesAt), new Date()));
  const isReview = s.step === REVIEW_STEP;
  const category = s.currentCategory;

  const pane =
    category != null
      ? {
          gradient: categoryGradient[category],
          kicker: categoryCopy[category].kicker,
          title: categoryCopy[category].paneTitle,
          tips: categoryCopy[category].tips,
        }
      : {
          gradient: 'var(--grad-ink)',
          kicker: 'Almost there',
          title: 'Submit once, all together.',
          tips: [
            'You submit all four categories at once',
            'Approvals and returns come with comments',
            'A returned goal routes via HR before you edit',
          ],
        };

  return (
    <div className={`view ${styles.page}`}>
      <div className={`oxy-wash grain ${styles.banner}`} style={{ background: banner.gradient }}>
        <div className={styles.bannerInner}>
          <div className={styles.bannerText}>
            <div className={styles.bannerKicker}>{banner.kicker}</div>
            <h1 className={styles.bannerTitle}>{banner.title}</h1>
            <div className={styles.bannerSub}>{banner.sub}</div>
          </div>
          {banner.showCount && (
            <div className={styles.days}>
              <div className={styles.daysNum}>{String(daysLeft).padStart(2, '0')}</div>
              <div className={styles.daysLabel}>days left</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.stepper}>
        {categoryOrder.map((cat, index) => {
          const done = s.goalsByCategory[cat].length > 0;
          const active = index === s.step;
          return (
            <StepButton
              key={cat}
              title={cat}
              hint={done ? `${s.goalsByCategory[cat].length} set` : 'Not started'}
              active={active}
              done={done}
              mark={done ? '\u2713' : String(index + 1)}
              onClick={() => s.setStep(index)}
              showBar
            />
          );
        })}
        <StepButton
          title="Review"
          hint={s.check.canSubmit ? 'Ready' : 'Complete all first'}
          active={isReview}
          done={false}
          mark={'\u2605'}
          onClick={() => s.setStep(REVIEW_STEP)}
        />
      </div>

      <div className={styles.twoPane}>
        <div className={styles.formSide}>
          {isReview ? <GoalReviewStep s={s} /> : <GoalCategoryStep s={s} />}

          <div className={styles.footer}>
            {s.step > 0 && (
              <button type="button" className={styles.back} onClick={s.prev}>
                Back
              </button>
            )}
            <button type="button" className={styles.draft} onClick={s.saveDraft}>
              Save as draft
            </button>
            {!isReview && (
              <button type="button" className={styles.continue} onClick={s.next}>
                Continue
              </button>
            )}
          </div>
        </div>

        <div className={`oxy-wash grain ${styles.pane}`} style={{ background: pane.gradient }}>
          <div className={styles.paneKicker}>{pane.kicker}</div>
          <div className={styles.paneTitle}>{pane.title}</div>
          <div className={styles.paneTips}>
            {pane.tips.map((tip) => (
              <div key={tip} className={styles.paneTip}>
                <span aria-hidden>&#10022;</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
          <div
            className={styles.paneArt}
            style={{ backgroundImage: 'url(/illustrations/goal-setting.svg)' }}
          />
        </div>
      </div>
    </div>
  );
}

function StepButton({
  title,
  hint,
  active,
  done,
  mark,
  onClick,
  showBar = false,
}: {
  title: string;
  hint: string;
  active: boolean;
  done: boolean;
  mark: string;
  onClick: () => void;
  showBar?: boolean;
}) {
  const dotBg = done ? 'var(--teal)' : active ? 'var(--ink)' : 'rgba(20, 17, 50, 0.08)';
  const dotFg = done || active ? 'var(--surface)' : 'var(--text-muted)';
  return (
    <>
      <button
        type="button"
        className={styles.step}
        onClick={onClick}
        style={{ background: active ? 'var(--status-neutral-bg)' : 'transparent' }}
      >
        <span className={styles.stepDot} style={{ background: dotBg, color: dotFg }}>
          {mark}
        </span>
        <span>
          <span className={styles.stepTitle} style={{ display: 'block' }}>
            {title}
          </span>
          <span className={styles.stepHint}>{hint}</span>
        </span>
      </button>
      {showBar && <span className={styles.stepBar} />}
    </>
  );
}
