import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/Components/ui/Button';
import { Icon } from '@/Components/icons/Icon';
import { ErrorState } from '@/Components/ui/States';
import { categoryColour, categoryGradient, categoryTint } from '@/Components/ui/accent';
import type { Cycle, CycleState, Goal, User } from '@/Types/domain';
import { useCalendar } from '@/Pages/calendar/useCalendar';
import { ScheduleMeetingModal } from '@/Pages/calendar/ScheduleMeetingModal';
import { categoryCopy, categoryOrder } from './goalCopy';
import { GoalCategoryStep } from './GoalCategoryStep';
import { GoalReviewStep } from './GoalReviewStep';
import { REVIEW_STEP, useGoalSetup } from './useGoalSetup';
import styles from './GoalSetup.module.css';

export interface GoalSetupProps {
  activeCycle: Cycle | null;
  // The user's goals in the active cycle.
  goals: Goal[];
  // Colleagues the review-meeting scheduler can invite.
  attendees: User[];
}

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

export function GoalSetup(props: GoalSetupProps) {
  const s = useGoalSetup(props);
  // Scheduling here only ever books a meeting, so the grid gets no events.
  const calendar = useCalendar([]);
  const { attendees } = props;
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (!s.activeCycle) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState />
      </div>
    );
  }

  if (s.submitted) {
    const goalCount = categoryOrder.reduce((sum, cat) => sum + s.goalsByCategory[cat].length, 0);
    return (
      <div className={`view ${styles.page}`}>
        <div className={styles.submittedWrap}>
          <div className={styles.submittedCard}>
            <div className={styles.submittedMark}>
              <Icon name="check" size={44} />
            </div>
            <h2 className={styles.submittedTitle}>Goals submitted &#127881;</h2>
            <p className={styles.submittedBody}>
              Your {goalCount} goals across all four categories are with{' '}
              <strong>your line manager</strong> for review. You&rsquo;ll get a notification when
              they respond. Approvals and returns come with comments, so it stays a conversation.
            </p>
            <div className={styles.submittedStatus}>
              <span className={styles.submittedStatusDot} aria-hidden />
              Status &middot; Submitted
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={s.reviewSubmission}>Review my submission</Button>
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
          const count = s.goalsByCategory[cat].length;
          const done = count > 0;
          const active = index === s.step;
          return (
            <StepButton
              key={cat}
              title={cat}
              hint={done ? `${count} goal${count === 1 ? '' : 's'}` : 'Not started'}
              active={active}
              done={done}
              doneColor={categoryColour[cat]}
              activeBg={categoryTint[cat]}
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
          activeBg="var(--ink)"
          activeText="var(--surface)"
          mark={'\u2605'}
          onClick={() => s.setStep(REVIEW_STEP)}
        />
      </div>

      <div className={styles.twoPane}>
        <div className={styles.formSide}>
          {isReview ? (
            <GoalReviewStep s={s} onSchedule={() => setScheduleOpen(true)} />
          ) : (
            <GoalCategoryStep s={s} />
          )}

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

      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        attendees={attendees}
        scheduling={calendar.scheduling}
        onSchedule={calendar.schedule}
      />
    </div>
  );
}

function StepButton({
  title,
  hint,
  active,
  done,
  doneColor,
  activeBg,
  activeText,
  mark,
  onClick,
  showBar = false,
}: {
  title: string;
  hint: string;
  active: boolean;
  done: boolean;
  doneColor?: string;
  activeBg?: string;
  activeText?: string;
  mark: string;
  onClick: () => void;
  showBar?: boolean;
}) {
  const dotBg = done
    ? (doneColor ?? 'var(--teal)')
    : active
      ? 'var(--ink)'
      : 'rgba(20, 17, 50, 0.08)';
  const dotFg = done || active ? 'var(--surface)' : 'var(--text-muted)';
  // When the active tab sits on a dark fill (Review step) the label text is inverted for contrast.
  const textColor = active ? activeText : undefined;
  return (
    <>
      <button
        type="button"
        className={styles.step}
        onClick={onClick}
        style={{ background: active ? (activeBg ?? 'var(--status-neutral-bg)') : 'transparent' }}
      >
        <span className={styles.stepDot} style={{ background: dotBg, color: dotFg }}>
          {mark}
        </span>
        <span>
          <span className={styles.stepTitle} style={{ display: 'block', color: textColor }}>
            {title}
          </span>
          <span className={styles.stepHint} style={{ color: textColor }}>
            {hint}
          </span>
        </span>
      </button>
      {showBar && <span className={styles.stepBar} />}
    </>
  );
}
