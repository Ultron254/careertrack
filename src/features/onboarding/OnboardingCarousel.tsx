import { useState } from 'react';
import styles from './OnboardingCarousel.module.css';

interface Step {
  illustration: string;
  gradient: string;
  tag: string;
  title: string;
  body: string;
}

// The four onboarding emoji are a deliberate design choice, kept as is. Copy
// keeps the design's warmth with its en dashes rewritten.
const steps: Step[] = [
  {
    illustration: '/illustrations/goal-setting.svg',
    gradient: 'var(--grad-client)',
    tag: '\uD83C\uDFAF Set goals',
    title: 'Set goals you believe in',
    body: 'A friendly step by step flow across Client, Company, People and Financial. Save drafts and submit when every section is complete.',
  },
  {
    illustration: '/illustrations/chat.svg',
    gradient: 'var(--grad-people)',
    tag: '\uD83D\uDCAC Get feedback',
    title: 'Feedback that flows',
    body: 'Request input from any colleague and carry it into your appraisal. Managers comment, and the conversation stays yours.',
  },
  {
    illustration: '/illustrations/growth.svg',
    gradient: 'var(--grad-company)',
    tag: '\uD83D\uDCC8 Track progress',
    title: 'See your growth',
    body: 'Log check-ins on every goal and watch progress build through the year, with clear 1 to 4 appraisals at review time.',
  },
  {
    illustration: '/illustrations/calendar.svg',
    gradient: 'var(--grad-financial)',
    tag: '\uD83D\uDDD3\uFE0F Stay on cycle',
    title: 'Never miss a milestone',
    body: 'Cycle reminders, calendar sync and gentle nudges keep goal setting and reviews on track, pressure free.',
  },
];

export function OnboardingCarousel({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const next = () => (isLast ? onDone() : setIndex((value) => value + 1));
  const back = () => setIndex((value) => Math.max(0, value - 1));

  return (
    <div className={styles.gate}>
      <div className={`${styles.visual} grain`} style={{ background: step.gradient }}>
        <button type="button" className={styles.skip} onClick={onDone}>
          Skip intro
        </button>
        <div
          className={styles.illustration}
          style={{ backgroundImage: `url('${step.illustration}')` }}
        />
      </div>
      <div className={styles.panel}>
        <div className={styles.content}>
          <div className={styles.stepLabel}>
            Step {index + 1} of {steps.length}
          </div>
          <div className={styles.tag}>{step.tag}</div>
          <h2 className={styles.title}>{step.title}</h2>
          <p className={styles.body}>{step.body}</p>
          <div className={styles.controls}>
            <div className={styles.dots}>
              {steps.map((_, i) => (
                <span key={i} className={styles.dot} data-active={i === index} />
              ))}
            </div>
            <button
              type="button"
              className={styles.back}
              onClick={back}
              style={{ opacity: index === 0 ? 0 : 1 }}
              disabled={index === 0}
            >
              Back
            </button>
            <button type="button" className={styles.next} onClick={next}>
              {isLast ? 'Enter CareerTrack' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
