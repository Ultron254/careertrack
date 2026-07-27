import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DonutChart } from '@/components/charts/DonutChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { KpiCard } from '@/components/ui/KpiCard';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/auth/authProvider';
import { routeAccess } from '@/auth/roles';
import { accentColour, toneColour } from '@/components/ui/accent';
import { ReportsInsights } from './ReportsInsights';
import { exportFormats, savedViews, useReports } from './useReports';
import styles from './Reports.module.css';

// Send a KPI card to the most relevant screen the current role can reach.
function kpiTarget(label: string, role: string): string | undefined {
  const l = label.toLowerCase();
  const has = (path: string) => routeAccess[role as keyof typeof routeAccess]?.includes(path);
  if (l.includes('appraisal') && has('/appraisals')) return '/appraisals';
  if (l.includes('approved') && has('/reviews')) return '/reviews?status=Approved';
  if (l.includes('return') && has('/reviews')) return '/reviews?status=Returned';
  if ((l.includes('review') || l.includes('sla') || l.includes('rating')) && has('/reviews'))
    return '/reviews';
  if (l.includes('feedback') && has('/feedback')) return '/feedback';
  if ((l.includes('goal') || l.includes('weight')) && has('/goals')) return '/goals';
  if (l.includes('rating') && has('/appraisals')) return '/appraisals';
  if (has('/people')) return '/people';
  if (has('/goals')) return '/goals';
  return undefined;
}

const exportTagColour: Record<string, string> = {
  PDF: 'var(--orange)',
  XLS: 'var(--teal)',
  CSV: 'var(--blue)',
  PPT: 'var(--gold)',
};

const freqOptions = ['daily', 'weekly', 'monthly'] as const;

export function Reports() {
  const r = useReports();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [exportOpen, setExportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (r.isPending) return <ViewSkeleton />;
  if (r.isError || !r.report) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={r.error} onRetry={r.refetch} />
      </div>
    );
  }

  const { report } = r;

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports &amp; Analytics</h1>
          <p className={styles.subtitle}>
            Visual performance data, tailored to your role. Generate a report and export it.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pill} onClick={() => setExportOpen((v) => !v)}>
            Export
          </button>
          {exportOpen && (
            <div className={`card ${styles.exportMenu}`}>
              {exportFormats.map((option) => (
                <button
                  key={option.format}
                  type="button"
                  className={styles.exportOption}
                  onClick={() => {
                    r.runExport(option.format);
                    setExportOpen(false);
                  }}
                >
                  <span
                    className={styles.exportTag}
                    style={{ background: exportTagColour[option.tag] }}
                  >
                    {option.tag}
                  </span>
                  <span>
                    <span className={styles.exportName}>{option.name}</span>
                    <span className={styles.exportDesc}>{option.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {r.scopeOptions.length > 1 && (
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Scope</span>
          {r.scopeOptions.map((option) => (
            <button
              key={option.scope}
              type="button"
              className={styles.pill}
              data-on={r.scope === option.scope}
              onClick={() => r.setScope(option.scope)}
            >
              {option.label}
            </button>
          ))}
          {r.needsSubject && (
            <select
              className={styles.select}
              value={r.subjectId ?? ''}
              onChange={(event) => r.setSubjectId(event.target.value || undefined)}
            >
              <option value="">
                {r.subjectKind === 'department' ? 'Select a department' : 'Select a person'}
              </option>
              {r.subjectChoices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className={styles.scopeNote}>
        <Icon name="info" size={16} />
        <span>{r.scopeNote}</span>
      </div>

      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>Saved views</span>
        {savedViews.map((view) => (
          <button
            key={view.id}
            type="button"
            className={styles.pill}
            data-on={r.savedView === view.id}
            onClick={() => r.setSavedView(view.id)}
          >
            <span className={styles.pillDot} style={{ background: view.accent }} />
            {view.label}
          </button>
        ))}
        <button
          type="button"
          className={styles.scheduleToggle}
          style={{ marginLeft: 'auto' }}
          onClick={() => setScheduleOpen((v) => !v)}
        >
          Schedule export
        </button>
      </div>

      {scheduleOpen && (
        <div className={`card ${styles.scheduleBar}`}>
          <div className={styles.scheduleTitle}>Auto email this report</div>
          <div className={styles.freqGroup}>
            {freqOptions.map((frequency) => (
              <button
                key={frequency}
                type="button"
                className={styles.freqButton}
                data-on={r.schedule?.frequency === frequency}
                onClick={() => r.setFrequency(frequency)}
              >
                {frequency[0].toUpperCase() + frequency.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>as PDF to you and HR</span>
          <button type="button" className={styles.scheduleToggle} onClick={r.toggleSchedule}>
            {r.schedule?.enabled ? 'Turn off schedule' : 'Turn on schedule'}
          </button>
        </div>
      )}

      <div className={styles.kpiRow}>
        {report.kpis.map((kpi) => {
          const target = kpi.target ?? kpiTarget(kpi.label, role);
          return (
            <KpiCard
              key={kpi.label}
              kpi={kpi}
              hint={kpi.hint ?? `Open ${kpi.label.toLowerCase()} for the full view`}
              onClick={target ? () => navigate(target) : undefined}
            />
          );
        })}
      </div>

      <ReportsInsights
        insights={report.insights}
        onRegenerate={() => void r.refetch()}
        regenerating={r.isFetching}
      />

      <div className={styles.chartRow}>
        <div className={`card ${styles.panel}`}>
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}>{report.categoryBars.title}</div>
            <span className={styles.panelSub}>{report.categoryBars.sub}</span>
          </div>
          <div className={styles.bars}>
            {report.categoryBars.bars.map((bar) => (
              <div
                key={bar.label}
                className={styles.barCol}
                title={`${bar.label}: ${bar.valueLabel}`}
              >
                <span className={styles.barValue} style={{ color: accentColour[bar.accent] }}>
                  {bar.valueLabel}
                </span>
                <div
                  className={styles.bar}
                  style={{ height: `${bar.heightPct}%`, background: accentColour[bar.accent] }}
                />
              </div>
            ))}
          </div>
          <div className={styles.barLabels}>
            {report.categoryBars.bars.map((bar) => (
              <span key={bar.label} className={styles.barLabel}>
                {bar.label}
              </span>
            ))}
          </div>
        </div>

        <div className={`card ${styles.donutPanel}`}>
          <div className={styles.donutTitle}>{report.statusDonut.title}</div>
          <DonutChart segments={report.statusDonut.segments} size={180} />
          <div className={styles.legend}>
            {report.statusDonut.segments.map((segment) => (
              <div key={segment.label} className={styles.legendRow}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: accentColour[segment.accent] }}
                />
                <span style={{ fontWeight: 600 }}>{segment.label}</span>
                <span className={styles.legendPct}>{segment.share}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={`card ${styles.panel}`}>
          <div className={styles.panelTitle} style={{ marginBottom: 6 }}>
            {report.trend.title}
          </div>
          <div className={styles.panelSub} style={{ margin: '0 0 20px' }}>
            {report.trend.sub}
          </div>
          <TrendChart points={report.trend.points} labels={report.trend.labels} showValues />
        </div>

        <div className={`card ${styles.panel}`}>
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}>{report.table.title}</div>
          </div>
          <div className={styles.tableHead}>
            <span>{report.table.columns[0]}</span>
            <span style={{ textAlign: 'center' }}>{report.table.columns[1]}</span>
            <span style={{ textAlign: 'center' }}>{report.table.columns[2]}</span>
            <span style={{ textAlign: 'right' }}>{report.table.columns[3]}</span>
          </div>
          {report.table.rows.map((row) => (
            <div key={row.name} className={styles.tableRow}>
              <div className={styles.tableName}>
                {row.avatarUserId && (
                  <Avatar userId={row.avatarUserId} name={row.name} size={28} />
                )}
                <span className={styles.tableNameText}>{row.name}</span>
              </div>
              <span className={styles.cellCenter}>{row.cells[0]}</span>
              <span className={styles.cellCenter}>{row.cells[1]}</span>
              <span className={styles.cellEnd} style={{ color: toneColour[row.lastCellTone] }}>
                {row.cells[2]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
