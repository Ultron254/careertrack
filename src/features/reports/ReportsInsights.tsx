import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { useAuth } from '@/auth/authProvider';
import { routeAccess } from '@/auth/roles';
import { accentColour } from '@/components/ui/accent';
import type { Report } from '@/api/schemas/report';
import styles from './Reports.module.css';

// Route an insight to the most relevant screen the current role can actually
// reach, so a card never drills into a 403.
function targetFor(text: string, role: string): string | undefined {
  const l = text.toLowerCase();
  const has = (path: string) => routeAccess[role as keyof typeof routeAccess]?.includes(path);
  if (l.includes('appraisal') && has('/appraisals')) return '/appraisals';
  if (l.includes('return') && has('/reviews')) return '/reviews?status=Returned';
  if ((l.includes('review') || l.includes('sla') || l.includes('turnaround')) && has('/reviews'))
    return '/reviews';
  if (l.includes('feedback') && has('/feedback')) return '/feedback';
  if ((l.includes('goal') || l.includes('weight')) && has('/goals')) return '/goals';
  if (
    (l.includes('member') ||
      l.includes('manager') ||
      l.includes('department') ||
      l.includes('user') ||
      l.includes('team') ||
      l.includes('submit')) &&
    has('/people')
  )
    return '/people';
  if (has('/people')) return '/people';
  if (has('/goals')) return '/goals';
  return undefined;
}

export function ReportsInsights({ insights }: { insights: Report['insights'] }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [answer, setAnswer] = useState<{ prompt: string; body: string } | null>(null);

  // The assistant is a mock: it composes a concise answer from the same cycle
  // insight already on screen, so the prompt does something real and grounded
  // without a live model. The backend can swap this for a streamed response.
  const ask = (prompt: string) => {
    const lead = insights.cards[0]?.text ?? '';
    setAnswer({ prompt, body: `${insights.headline} ${lead}`.trim() });
  };

  return (
    <div className={`card ${styles.aiPanel}`}>
      <div className={styles.aiHead}>
        <span className={styles.aiMark}>
          <Icon name="sparkle" size={19} />
        </span>
        <div style={{ flex: 1 }}>
          <div className={styles.aiTitle}>AI insights</div>
          <div className={styles.aiSub}>{insights.sub}</div>
        </div>
        <span className={styles.aiLive}>
          <span className={styles.aiLiveDot} />
          Live
        </span>
      </div>
      <div className={styles.aiBody}>
        <div className={styles.aiHeadline}>
          <span aria-hidden>{'\u{1F4A1}'}</span>
          <div>{insights.headline}</div>
        </div>
        <div className={styles.aiCards}>
          {insights.cards.map((card) => {
            const target = targetFor(`${card.tag} ${card.text}`, role);
            return (
              <button
                key={card.tag}
                type="button"
                className={styles.aiCard}
                data-clickable={target ? true : undefined}
                style={{ borderTopColor: accentColour[card.accent] }}
                onClick={target ? () => navigate(target) : undefined}
                disabled={!target}
              >
                <div className={styles.aiCardTag} style={{ color: accentColour[card.accent] }}>
                  <span aria-hidden style={{ fontSize: 15 }}>
                    {card.emoji}
                  </span>
                  {card.tag}
                </div>
                <div className={styles.aiCardText}>{card.text}</div>
                <div className={styles.aiCardMetric}>
                  <span style={{ fontWeight: 600, color: accentColour[card.accent] }}>
                    {card.metric}
                  </span>
                  {card.metricLabel}
                </div>
                {target && <span className={styles.aiCardCue} aria-hidden>Open →</span>}
              </button>
            );
          })}
        </div>
        <div className={styles.aiPrompts}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            Ask CareerTrack AI:
          </span>
          {insights.prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className={styles.aiPrompt}
              data-on={answer?.prompt === prompt}
              onClick={() => ask(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        {answer && (
          <div className={styles.aiAnswer}>
            <div className={styles.aiAnswerHead}>
              <Icon name="sparkle" size={15} />
              {answer.prompt}
            </div>
            <p className={styles.aiAnswerBody}>{answer.body}</p>
          </div>
        )}
        <div className={styles.aiDisclaimer}>
          AI summaries are generated from aggregated, anonymised cycle data. Always review before
          acting.
        </div>
      </div>
    </div>
  );
}
