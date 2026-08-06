import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Components/icons/Icon';
import { useFocusTrap } from '@/Components/ui/useFocusTrap';
import styles from './EmployeeGuide.module.css';

/* The employee guide panel from the design sheet: a five-section explainer of
   the performance management system that opens over the dashboard. The design
   pages show the first cards of each list; the remaining SWOT quadrants and
   SMART criteria follow the same voice to complete each framework. */

type GuideTab = 'welcome' | 'swot' | 'smart' | 'principles' | 'development';

const tabs: { id: GuideTab; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'swot', label: 'SWOT analysis' },
  { id: 'smart', label: 'SMART goals' },
  { id: 'principles', label: 'Setting goals' },
  { id: 'development', label: 'Development' },
];

type Accent = 'teal' | 'blue' | 'orange' | 'gold' | 'ink';

const platformCan = [
  'Set and update your performance goals.',
  'Track progress against agreed objectives.',
  'Complete self-assessments and performance reviews.',
  'Receive feedback from your manager and colleagues.',
  'Identify learning and development opportunities.',
  'Keep a record of your achievements and career development.',
];

interface SwotQuadrant {
  letter: string;
  title: string;
  body: string;
  chips: string[];
  accent: Accent;
}

const swotQuadrants: SwotQuadrant[] = [
  {
    letter: 'S',
    title: 'Strengths',
    body: 'The skills, knowledge, experience and qualities that let you perform effectively — the value you consistently bring.',
    chips: [
      'Strong communication',
      'Exceeding targets',
      'Technical expertise',
      'Problem-solving',
      'Adaptability',
    ],
    accent: 'teal',
  },
  {
    letter: 'W',
    title: 'Weaknesses',
    body: 'Areas you’d like to improve. Naming development needs helps you and your manager find the right support, coaching or training.',
    chips: [
      'Time management',
      'Public speaking',
      'New systems',
      'Delegation',
      'Complex assignments',
    ],
    accent: 'orange',
  },
  {
    letter: 'O',
    title: 'Opportunities',
    body: 'Openings that can grow your development and performance — learning, advancement, mentoring or new responsibilities.',
    chips: [
      'Training & certification',
      'Cross-functional projects',
      'Mentoring',
      'New responsibilities',
    ],
    accent: 'blue',
  },
  {
    letter: 'T',
    title: 'Threats',
    body: 'Pressures that could hold performance back — shifting priorities, tight resources or competing demands. Flag them early so they can be planned around.',
    chips: ['Shifting priorities', 'Resource constraints', 'Tight deadlines'],
    accent: 'gold',
  },
];

interface SmartCriterion {
  letter: string;
  title: string;
  body: string;
  example: string;
  accent: Accent;
}

const smartCriteria: SmartCriterion[] = [
  {
    letter: 'S',
    title: 'Specific',
    body: 'Clearly define what you intend to achieve. Describe the expected outcome and avoid ambiguity.',
    example: 'Improve customer response times by streamlining the support ticket process.',
    accent: 'teal',
  },
  {
    letter: 'M',
    title: 'Measurable',
    body: 'Identify indicators that let you track progress and know when the goal is achieved.',
    example: 'Reduce average customer response time from 24 hours to 12 hours.',
    accent: 'blue',
  },
  {
    letter: 'A',
    title: 'Achievable',
    body: 'Keep the goal realistic and attainable with your resources and skills, while still stretching you.',
    example:
      'Implement improvements using existing systems, collaboration and available resources.',
    accent: 'orange',
  },
  {
    letter: 'R',
    title: 'Relevant',
    body: 'Make sure the goal supports your department’s and the organisation’s priorities, so your effort moves the wider mission.',
    example: 'Faster response times directly support this year’s client experience objectives.',
    accent: 'gold',
  },
  {
    letter: 'T',
    title: 'Time-bound',
    body: 'Attach a clear timeframe so progress can be paced, reviewed and celebrated.',
    example: 'Reach the 12 hour response target by the end of the third quarter.',
    accent: 'ink',
  },
];

const goalPrinciples = [
  'Align your goals with your role, department and organisational priorities.',
  'Focus on outcomes rather than routine activities.',
  'Include measurable performance indicators wherever possible.',
  'Set realistic yet challenging objectives.',
  'Discuss and agree your goals with your manager.',
  'Update your progress and record key achievements through the cycle.',
  'Review and adjust goals to reflect changes in business priorities.',
];

// Number chips on the setting-goals list cycle through the brand accents.
const principleAccents: Accent[] = ['teal', 'blue', 'orange', 'gold'];

function WelcomePanel({ onStartTour }: { onStartTour: () => void }) {
  return (
    <>
      <p className={styles.lead}>
        Welcome to the Performance Management System. It gives you a structured way to set goals,
        monitor progress, receive feedback and take part in reviews across the performance cycle — a
        shared space where you and your manager work toward individual, team and organisational
        success.
      </p>
      <span className={styles.kicker}>Through this platform you can</span>
      <ul className={styles.checklist}>
        {platformCan.map((item) => (
          <li key={item} className={styles.checkItem}>
            <span className={styles.checkIcon} aria-hidden="true">
              <Icon name="check" size={11} />
            </span>
            {item}
          </li>
        ))}
      </ul>
      <button type="button" className={styles.tourLaunch} onClick={onStartTour}>
        <Icon name="sparkle" size={14} />
        Take a guided tour of the app
      </button>
    </>
  );
}

function SwotPanel() {
  return (
    <>
      <p className={styles.lead}>
        A self-assessment tool to evaluate your current performance and plan your growth. Reflect
        honestly on each quadrant to shape a meaningful development plan.
      </p>
      {swotQuadrants.map((quadrant) => (
        <article key={quadrant.letter} className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.badge} data-accent={quadrant.accent}>
              {quadrant.letter}
            </span>
            <h3 className={styles.cardTitle}>{quadrant.title}</h3>
          </div>
          <p className={styles.cardBody}>{quadrant.body}</p>
          <div className={styles.chips}>
            {quadrant.chips.map((chip) => (
              <span key={chip} className={styles.chip} data-accent={quadrant.accent}>
                {chip}
              </span>
            ))}
          </div>
        </article>
      ))}
    </>
  );
}

function SmartPanel() {
  return (
    <>
      <p className={styles.lead}>
        A framework for clear, measurable, achievable goals aligned to departmental priorities.
        Every goal you set should meet these five criteria.
      </p>
      {smartCriteria.map((criterion) => (
        <article key={criterion.letter} className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.badge} data-accent={criterion.accent}>
              {criterion.letter}
            </span>
            <h3 className={styles.cardTitle}>{criterion.title}</h3>
          </div>
          <p className={styles.cardBody}>{criterion.body}</p>
          <p className={styles.example} data-accent={criterion.accent}>
            <strong>Example.</strong> {criterion.example}
          </p>
        </article>
      ))}
    </>
  );
}

function PrinciplesPanel() {
  return (
    <>
      <p className={styles.lead}>
        When entering your goals into the system, keep these principles in mind so your objectives
        stay meaningful and aligned.
      </p>
      <ol className={styles.principles}>
        {goalPrinciples.map((principle, index) => (
          <li key={principle} className={styles.principle}>
            <span
              className={styles.principleNum}
              data-accent={principleAccents[index % principleAccents.length]}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {principle}
          </li>
        ))}
      </ol>
    </>
  );
}

function DevelopmentPanel() {
  return (
    <>
      <article className={styles.note}>
        <h3 className={styles.noteTitle}>An ongoing process</h3>
        <p className={styles.cardBody}>
          Performance management is continuous, not a once-a-year event. Regularly review your
          goals, seek constructive feedback, document achievements and take part in development
          opportunities.
        </p>
      </article>
      <article className={styles.note}>
        <p className={styles.cardBody}>
          Open communication between you and your manager supports continuous improvement,
          strengthens performance and promotes career growth. Engaging with the system contributes
          to a culture of accountability, learning, collaboration and excellence.
        </p>
      </article>
      <div className={styles.closing}>
        <h3 className={styles.closingTitle}>
          Here’s to your growth <span aria-hidden="true">🌱</span>
        </h3>
        <p className={styles.closingBody}>
          Thank you for your commitment to continuous improvement. We wish you every success as you
          work toward your goals and the organisation’s mission.
        </p>
      </div>
    </>
  );
}

interface EmployeeGuideProps {
  onClose: () => void;
  onStartTour: () => void;
}

export function EmployeeGuide({ onClose, onStartTour }: EmployeeGuideProps) {
  const [tab, setTab] = useState<GuideTab>('welcome');
  const panelRef = useFocusTrap<HTMLElement>(true, onClose);

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Employee guide"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <span className={styles.eyebrow}>Employee guide</span>
          <h2 className={styles.title}>Performance Management System</h2>
          <p className={styles.sub}>
            Grow your career while aligning your work to what the organisation is aiming for.
          </p>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close guide">
            <Icon name="close" size={13} />
          </button>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Guide sections">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              className={styles.tab}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className={`${styles.body} scroll`} role="tabpanel">
          {tab === 'welcome' && <WelcomePanel onStartTour={onStartTour} />}
          {tab === 'swot' && <SwotPanel />}
          {tab === 'smart' && <SmartPanel />}
          {tab === 'principles' && <PrinciplesPanel />}
          {tab === 'development' && <DevelopmentPanel />}
        </div>

        <footer className={styles.foot}>
          <span className={styles.footIcon} aria-hidden="true">
            <Icon name="chat" size={15} />
          </span>
          <div className={styles.footText}>
            <strong>Need a hand?</strong>
            <span>Your People Team is one message away</span>
          </div>
          {/* Shared People Team inbox; a real address arrives with the backend. */}
          <a className={styles.contact} href="mailto:people.team@oxygene.africa">
            Contact
          </a>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
