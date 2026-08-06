import { useState } from 'react';
import { LogoMark, OxygeneMark } from '@/components/ui/Logo';
import styles from './OnboardingCarousel.module.css';

interface Step {
  illustration: string;
  gradient: string;
  tag: string;
  title: string;
  body: string;
}

// The five onboarding emoji are a deliberate design choice, kept as is. Copy
// keeps the design's warmth with its en dashes rewritten.
const steps: Step[] = [
  {
    illustration: '/illustrations/sign-in.svg',
    gradient: 'var(--grad-panel)',
    tag: '\uD83D\uDC4B Welcome',
    title: 'Welcome to CareerTrack',
    body: "The CareerTrack System is a structured, collaborative space to set goals, track progress, receive feedback and take part in reviews, aligning your growth with the organisation's objectives.",
  },
  {
    illustration: '/illustrations/rating.svg',
    gradient: 'var(--grad-client)',
    tag: '\uD83D\uDD0D SWOT',
    title: 'Start with a SWOT',
    body: 'Reflect honestly on your Strengths, Weaknesses, Opportunities and Threats. This self-assessment shapes a meaningful development plan and grounds the goals you set.',
  },
  {
    illustration: '/illustrations/target.svg',
    gradient: 'var(--grad-people)',
    tag: '\uD83C\uDFAF SMART goals',
    title: 'Set SMART goals',
    body: 'Make every goal Specific, Measurable, Achievable, Relevant and Time-bound, aligned to your role and departmental priorities and focused on outcomes over activity.',
  },
  {
    illustration: '/illustrations/chat.svg',
    gradient: 'var(--grad-company)',
    tag: '\uD83D\uDCAC Feedback',
    title: 'Feedback that flows',
    body: 'Open a two-way conversation with your manager to strengthen your performance. Align on your goals, request input from colleagues, and carry it into your review.',
  },
  {
    illustration: '/illustrations/growth.svg',
    gradient: 'var(--grad-financial)',
    tag: '\uD83C\uDF31 Keep growing',
    title: 'A continuous journey',
    body: 'Performance management is ongoing, not once a year. Review goals, document achievements and keep developing. Tap the help button any time to re-open this guide.',
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
      <div className={`${styles.visual} oxy-wash grain`} style={{ background: step.gradient }}>
        <div className={styles.brandLockup}>
          <span className={styles.brandMark}>
            <LogoMark size={18} monochrome />
          </span>
          <span className={styles.brandWordmark}>
            CareerTrack
            <small>by Oxygene</small>
          </span>
        </div>
        <button type="button" className={styles.skip} onClick={onDone}>
          Skip intro
        </button>
        <div
          className={styles.illustration}
          style={{ backgroundImage: `url('${step.illustration}')` }}
        />
        <div className={styles.visualCaption}>{step.tag}</div>
      </div>
      <div className={`${styles.panel} oxy-wash-soft`}>
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
          <div className={styles.panelFooter}>
            <OxygeneMark size={15} tone="var(--text-muted)" />
            <span>Built for Oxygene teams across Africa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
