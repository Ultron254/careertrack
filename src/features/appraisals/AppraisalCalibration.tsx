import { useNavigate } from 'react-router-dom';
import { useCycles } from '@/api/queries/goals';
import { useCalibration } from '@/api/queries/teamAppraisals';
import type { CalibrationRow } from '@/api/schemas/teamAppraisal';
import { Avatar } from '@/components/ui/Avatar';
import { BrandWatermark } from '@/components/ui/BrandWatermark';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { ratingColour, ratingLabels } from '@/components/ui/accent';
import { distributionOf } from './calibrationModel';
import styles from './AppraisalCalibration.module.css';

type BadgeKind = 'neutral' | 'discussion' | 'acknowledge' | 'locked';

const stageBadge: Record<CalibrationRow['stage'], { label: string; kind: BadgeKind }> = {
  self: { label: 'Self-appraisal', kind: 'neutral' },
  manager: { label: 'Line manager', kind: 'neutral' },
  discussion: { label: 'Discussion', kind: 'discussion' },
  acknowledge: { label: 'Acknowledge', kind: 'acknowledge' },
  done: { label: 'Locked', kind: 'locked' },
};

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

  const cycles = cyclesQuery.data ?? [];
  const activeCycle =
    cycles.find((cycle) => cycle.state === 'open' || cycle.state === 'closing') ??
    [...cycles].sort((a, b) => b.year - a.year)[0];
  const year = activeCycle?.year ?? new Date().getFullYear();

  const calibrationQuery = useCalibration(activeCycle?.id);

  if (cyclesQuery.isPending || calibrationQuery.isPending) return <ViewSkeleton />;
  if (cyclesQuery.isError || calibrationQuery.isError) {
    const failed = cyclesQuery.isError ? cyclesQuery : calibrationQuery;
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={failed.error} onRetry={failed.refetch} />
      </div>
    );
  }

  const { teamName, rows } = calibrationQuery.data;
  const { bands, average } = distributionOf(rows);
  const peak = Math.max(1, ...bands.map((entry) => entry.count));
  const liveRow = rows.find((row) => row.live);

  return (
    <div className={`view ${styles.page}`}>
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
            <span className={styles.cardTitle}>Rating calibration · {teamName}</span>
            <span className={styles.chartHint}>Compare ratings across the team for fairness</span>
          </div>
          <div className={styles.teamAverage}>
            Team average <strong>{average === null ? '—' : average.toFixed(1)}</strong>
          </div>
        </div>
        <div className={styles.chart}>
          {bands.map((entry) => (
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
          {rows.length} people
          {liveRow && ` · ${liveRow.name.split(' ')[0]}\u2019s appraisal is in flight`}
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
              {rows.map((row) => {
                const badge = stageBadge[row.stage];
                return (
                  <tr key={row.userId} data-live={row.live}>
                    <td>
                      <div className={styles.person}>
                        <Avatar userId={row.userId} name={row.name} avatarUrl={null} size={34} />
                        <div className={styles.personText}>
                          <span className={styles.personName}>{row.name}</span>
                          <span className={styles.personMeta}>{row.jobTitle}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.numCol}>{fmt(row.self)}</td>
                    <td className={styles.numCol}>{fmt(row.manager)}</td>
                    <td className={`${styles.numCol} ${styles.finalCell}`}>{fmt(row.final)}</td>
                    <td>
                      <StageBadge label={badge.label} kind={badge.kind} />
                    </td>
                    <td className={styles.actionCell}>
                      {row.live && (
                        <button
                          type="button"
                          className={styles.openButton}
                          onClick={() => navigate(`/people/${row.userId}`)}
                        >
                          Open
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {liveRow && (
          <div className={styles.livePanel}>
            <div>
              <div className={styles.livePanelTitle}>
                {liveRow.name.split(' ')[0]}&rsquo;s live appraisal
              </div>
              <p className={styles.livePanelText}>
                Self {fmt(liveRow.self)} · manager {fmt(liveRow.manager)} · final{' '}
                {fmt(liveRow.final)} · currently at the {stageBadge[liveRow.stage].label.toLowerCase()}{' '}
                stage. The line manager works the record; step in here if calibration stalls.
              </p>
            </div>
            <button
              type="button"
              className={styles.livePanelButton}
              onClick={() => navigate(`/people/${liveRow.userId}`)}
            >
              Open full appraisal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
