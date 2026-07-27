import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCycles } from '@/api/queries/goals';
import { Avatar } from '@/components/ui/Avatar';
import { BrandWatermark } from '@/components/ui/BrandWatermark';
import { ratingColour, ratingLabels } from '@/components/ui/accent';
import type { Rating } from '@/types/domain';
import styles from './AppraisalCalibration.module.css';

// The demo cycle-stage control walks the cohort forward one stage at a time. It
// only drives the live row (Amara) below; Reset drops back to the start.
const stageFlow = ['Self', 'Manager', 'Discussion', 'Acknowledge', 'Done'] as const;
type Stage = (typeof stageFlow)[number];

type BadgeKind = 'neutral' | 'discussion' | 'acknowledge' | 'locked';

// How Amara's live appraisal presents at each point in the cycle.
const liveStageBadge: Record<Stage, { label: string; kind: BadgeKind }> = {
  Self: { label: 'Self-appraisal', kind: 'neutral' },
  Manager: { label: 'Line manager', kind: 'neutral' },
  Discussion: { label: 'Discussion', kind: 'discussion' },
  Acknowledge: { label: 'Acknowledge', kind: 'acknowledge' },
  Done: { label: 'Locked', kind: 'locked' },
};

// --- Dummy calibration cohort ------------------------------------------------
// The appraisals API does not yet expose cross-team self/manager/final ratings,
// so the Client Service cohort is stubbed with the figures from the spec. Each
// person's `score` feeds both the distribution chart and the team average.
// Amara is the live row the People Team can open and work; everyone else is
// already settled. Replace with real appraisal aggregates once the endpoint lands.
type CohortRow = {
  userId: string;
  name: string;
  title: string;
  self: number | null;
  manager: number | null;
  final: number | null;
  score: number;
  live: boolean;
  badge?: { label: string; kind: BadgeKind };
};

const cohort: CohortRow[] = [
  { userId: 'u-amara', name: 'Amara Koech', title: 'Account Manager', self: null, manager: 3.1, final: 2.6, score: 2.6, live: true },
  { userId: 'u-kevin', name: 'Kevin Njoroge', title: 'Senior AE', self: 3.2, manager: 3.0, final: 3.0, score: 3.0, live: false, badge: { label: 'Locked', kind: 'locked' } },
  { userId: 'u-sana', name: 'Sana Patel', title: 'Account Executive', self: 2.8, manager: 2.8, final: 2.8, score: 2.8, live: false, badge: { label: 'Locked', kind: 'locked' } },
  { userId: 'u-grace', name: 'Grace Achieng', title: 'Account Executive', self: 3.5, manager: 3.0, final: null, score: 3.0, live: false, badge: { label: 'Discussion', kind: 'discussion' } },
  { userId: 'u-david', name: 'David Otieno', title: 'Client Service Director', self: 3.0, manager: 2.9, final: 2.6, score: 2.6, live: false, badge: { label: 'Locked', kind: 'locked' } },
];

const fmt = (value: number | null) => (value === null ? '—' : value.toFixed(1));

function StageBadge({ label, kind }: { label: string; kind: BadgeKind }) {
  return (
    <span className={styles.stageBadge} data-kind={kind}>
      {kind === 'discussion' && <span className={styles.flag} aria-hidden="true" />}
      {label}
    </span>
  );
}

export function AppraisalCalibration() {
  const navigate = useNavigate();
  const cyclesQuery = useCycles();
  const [cohortStage, setCohortStage] = useState<Stage>('Self');
  const [openLive, setOpenLive] = useState(false);

  const cycles = cyclesQuery.data ?? [];
  const activeCycle =
    cycles.find((cycle) => cycle.state === 'open' || cycle.state === 'closing') ??
    [...cycles].sort((a, b) => b.year - a.year)[0];
  const year = activeCycle?.year ?? new Date().getFullYear();

  // Distribution across the four rating bands, from each person's rounded score.
  const ratings: Rating[] = [1, 2, 3, 4];
  const distribution = ratings.map((rating) => ({
    rating,
    count: cohort.filter((row) => Math.round(row.score) === rating).length,
  }));
  const peak = Math.max(1, ...distribution.map((entry) => entry.count));
  const teamAverage = cohort.reduce((sum, row) => sum + row.score, 0) / cohort.length;

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.stageBar}>
        <div className={styles.stageBarLabel}>
          <span className={styles.stagePen} aria-hidden="true" />
          Demo · cycle stage
        </div>
        <div className={styles.segmented} role="tablist" aria-label="Cycle stage">
          {stageFlow.map((stage) => (
            <button
              key={stage}
              type="button"
              role="tab"
              aria-selected={cohortStage === stage}
              className={styles.segment}
              data-on={cohortStage === stage}
              onClick={() => setCohortStage(stage)}
            >
              {stage}
            </button>
          ))}
        </div>
        <button type="button" className={styles.resetButton} onClick={() => setCohortStage('Self')}>
          <span className={styles.resetIcon} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className={`oxy-plate oxy-wash grain ${styles.banner}`}>
        <div className={styles.bannerScrim} />
        <div className={styles.bannerBody}>
          <div className={styles.bannerKicker}>{year} appraisal cycle · People Team</div>
          <h1 className={styles.bannerTitle}>Calibration &amp; oversight</h1>
          <p className={styles.bannerSub}>
            Monitor progress across the team, calibrate ratings for fairness, mediate disagreements
            and lock completed appraisals.
          </p>
        </div>
        <BrandWatermark />
      </div>

      <div className={`card ${styles.chartCard}`}>
        <div className={styles.chartHead}>
          <div className={styles.chartTitleRow}>
            <span className={styles.cardTitle}>Rating calibration · Client Service</span>
            <span className={styles.chartHint}>Compare ratings across the team for fairness</span>
          </div>
          <div className={styles.teamAverage}>
            Team average <strong>{teamAverage.toFixed(1)}</strong>
          </div>
        </div>
        <div className={styles.chart}>
          {distribution.map((entry) => (
            <div key={entry.rating} className={styles.chartCol}>
              <span className={styles.chartCount}>{entry.count}</span>
              <div
                className={styles.chartBar}
                style={{
                  height: `${Math.max(6, (entry.count / peak) * 150)}px`,
                  background: ratingColour[entry.rating],
                }}
              />
              <span className={styles.chartLabel}>{ratingLabels[entry.rating]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`card ${styles.tableCard}`}>
        <div className={styles.cardTitle}>Team appraisals</div>
        <div className={styles.tableSub}>
          {cohort.length} people · click Open to work Amara&rsquo;s live appraisal
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th className={styles.numCol}>Self</th>
                <th className={styles.numCol}>Mgr</th>
                <th className={styles.numCol}>Final</th>
                <th>Stage</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {cohort.map((row) => {
                const badge = row.live ? liveStageBadge[cohortStage] : row.badge;
                return (
                  <tr key={row.userId} data-live={row.live}>
                    <td>
                      <div className={styles.person}>
                        <Avatar userId={row.userId} name={row.name} avatarUrl={null} size={34} />
                        <div className={styles.personText}>
                          <span className={styles.personName}>{row.name}</span>
                          <span className={styles.personMeta}>{row.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.numCol}>{fmt(row.self)}</td>
                    <td className={styles.numCol}>{fmt(row.manager)}</td>
                    <td className={`${styles.numCol} ${styles.finalCell}`}>{fmt(row.final)}</td>
                    <td>{badge && <StageBadge label={badge.label} kind={badge.kind} />}</td>
                    <td className={styles.actionCell}>
                      {row.live && (
                        <button
                          type="button"
                          className={styles.openButton}
                          onClick={() => setOpenLive((open) => !open)}
                        >
                          {openLive ? 'Hide' : 'Open'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {openLive && (
          <div className={styles.livePanel}>
            <div>
              <div className={styles.livePanelTitle}>Amara&rsquo;s live appraisal</div>
              <p className={styles.livePanelText}>
                Self-rating pending · manager average {fmt(3.1)} · provisional final {fmt(2.6)}.
                Review each goal, resolve the discussion note, then lock the final rating.
              </p>
            </div>
            <button
              type="button"
              className={styles.livePanelButton}
              onClick={() => navigate('/people/u-amara')}
            >
              Open full appraisal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
