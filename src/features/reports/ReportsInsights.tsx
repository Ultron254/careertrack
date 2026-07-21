import { Icon } from '@/components/icons/Icon';
import { accentColour } from '@/components/ui/accent';
import type { Report } from '@/api/schemas/report';
import styles from './Reports.module.css';

export function ReportsInsights({ insights }: { insights: Report['insights'] }) {
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
          {insights.cards.map((card) => (
            <div
              key={card.tag}
              className={styles.aiCard}
              style={{ borderTopColor: accentColour[card.accent] }}
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
            </div>
          ))}
        </div>
        <div className={styles.aiPrompts}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            Ask CareerTrack AI:
          </span>
          {insights.prompts.map((prompt) => (
            <button key={prompt} type="button" className={styles.aiPrompt}>
              {prompt}
            </button>
          ))}
        </div>
        <div className={styles.aiDisclaimer}>
          AI summaries are generated from aggregated, anonymised cycle data. Always review before
          acting.
        </div>
      </div>
    </div>
  );
}
