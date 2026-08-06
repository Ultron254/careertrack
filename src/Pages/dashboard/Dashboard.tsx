import { useState } from 'react';
import { usePage } from '@/Context/SharedPropsContext';
import { router } from '@/Lib/router';
import { DonutChart } from '@/Components/charts/DonutChart';
import { TrendChart } from '@/Components/charts/TrendChart';
import { Avatar } from '@/Components/ui/Avatar';
import { Card } from '@/Components/ui/Card';
import { StatusBadge } from '@/Components/ui/Badge';
import { CategoryChip } from '@/Components/ui/Badge';
import { accentColour, accentGradient } from '@/Components/ui/accent';
import type { GoalCategory } from '@/Types/domain';
import type { Dashboard as DashboardData } from '@/Types/dashboard';
import { BrandWatermark } from '@/Components/ui/BrandWatermark';
import { KpiCard } from '@/Components/ui/KpiCard';
import styles from './Dashboard.module.css';

const categories: GoalCategory[] = ['Client', 'Company', 'People', 'Financial'];
const isCategory = (value: string | null): value is GoalCategory =>
  value !== null && (categories as string[]).includes(value);

export interface DashboardProps {
  dashboard: DashboardData;
}

export function Dashboard({ dashboard }: DashboardProps) {
  const { props } = usePage();
  const navigate = (to: string) => router.visit(to);

  // Local-only until the Outlook/calendar integration ships; a real build would
  // read this from the user's connected-accounts state.
  const [calendarDismissed, setCalendarDismissed] = useState(false);

  const { banner, kpis, statusDonut, trend, categoryBars, list, side, promo } = dashboard;
  const firstName = props.auth.user?.name.split(' ')[0] ?? 'there';
  const bannerTitle = banner.title.replace('{firstName}', firstName);
  const topStatus = [...statusDonut.segments].sort((a, b) => b.share - a.share)[0];

  return (
    <div className={`${styles.page} view`}>
      <section className={`${styles.banner} oxy-plate oxy-wash grain`}>
        <div className={styles.bannerScrim} />
        <div className={styles.bannerInner}>
          <div className={styles.bannerText}>
            <div className={styles.bannerKicker}>{banner.kicker}</div>
            <h2 className={styles.bannerTitle}>{bannerTitle}</h2>
            <p className={styles.bannerSub}>{banner.subtitle}</p>
          </div>
          <div className={styles.bannerAside}>
            {banner.daysLeft !== null && (
              <div className={styles.daysLeft}>
                <div className={styles.daysNum}>{String(banner.daysLeft).padStart(2, '0')}</div>
                <div className={styles.daysLabel}>days left</div>
              </div>
            )}
            <button
              type="button"
              className={styles.bannerCta}
              onClick={() => navigate(banner.target)}
            >
              {banner.cta}
            </button>
          </div>
        </div>
        <BrandWatermark />
      </section>

      <div className={styles.kpis}>
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            kpi={kpi}
            hint={kpi.hint}
            onClick={kpi.target ? () => navigate(kpi.target!) : undefined}
          />
        ))}
      </div>

      <div className={styles.charts}>
        <Card className={styles.donutCard}>
          <h3 className={styles.cardTitle}>{statusDonut.title}</h3>
          <div className={styles.donutRow}>
            <DonutChart
              size={148}
              segments={statusDonut.segments.map((segment) => ({
                share: segment.share,
                accent: segment.accent,
                label: segment.label,
                detail: segment.detail,
              }))}
              centerValue={topStatus ? `${topStatus.share}%` : undefined}
              centerLabel={topStatus?.label}
              onSegmentClick={
                statusDonut.segments.some((s) => s.target)
                  ? (index) => {
                      const target = statusDonut.segments[index]?.target;
                      if (target) navigate(target);
                    }
                  : undefined
              }
            />
            <div className={styles.legend}>
              {statusDonut.segments.map((segment) => {
                const clickable = !!segment.target;
                return (
                  <button
                    key={segment.label}
                    type="button"
                    className={styles.legendRow}
                    data-clickable={clickable || undefined}
                    title={segment.detail}
                    onClick={clickable ? () => navigate(segment.target!) : undefined}
                    disabled={!clickable}
                  >
                    <span
                      className={styles.swatch}
                      style={{ background: accentColour[segment.accent] }}
                    />
                    <span className={styles.legendLabel}>{segment.label}</span>
                    <span className={styles.legendValue}>{segment.share}%</span>
                    {clickable && (
                      <span className={styles.legendChev} aria-hidden>
                        ›
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>{trend.title}</h3>
            <span className={styles.cardMeta}>{trend.sub}</span>
          </div>
          <TrendChart points={trend.points} labels={trend.labels} showValues />
        </Card>

        <Card className={styles.chartCard}>
          <h3 className={styles.cardTitle}>{categoryBars.title}</h3>
          <div className={styles.bars}>
            {categoryBars.bars.map((bar) => {
              const height = Math.max(6, bar.heightPct);
              const clickable = !!bar.target;
              return (
                <button
                  key={bar.label}
                  type="button"
                  className={styles.barCol}
                  data-clickable={clickable || undefined}
                  onClick={clickable ? () => navigate(bar.target!) : undefined}
                  disabled={!clickable}
                >
                  <div className={styles.barTrack}>
                    {bar.detail && <span className={styles.barTip}>{bar.detail}</span>}
                    <div
                      className={styles.bar}
                      style={{ height: `${height}%`, background: accentGradient[bar.accent] }}
                    />
                    <span
                      className={styles.barValue}
                      style={{ bottom: `calc(${height}% + 6px)`, color: accentColour[bar.accent] }}
                    >
                      {bar.valueLabel}
                    </span>
                  </div>
                  <span className={styles.barLabel}>{bar.label}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className={styles.bottom}>
        <Card className={styles.listCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.listTitle}>{list.title}</h3>
            <button type="button" className={styles.link} onClick={() => navigate(list.target)}>
              {list.linkLabel}
            </button>
          </div>
          <div className={styles.rows}>
            {list.rows.map((row) => (
              <div
                key={row.id}
                className={styles.row}
                style={{ borderLeftColor: accentColour[row.accent] }}
              >
                {row.avatarUserId && (
                  <Avatar userId={row.avatarUserId} name={row.title} size={34} />
                )}
                {isCategory(row.chip) && <CategoryChip category={row.chip} />}
                <div className={styles.rowText}>
                  <div className={styles.rowTitle}>{row.title}</div>
                  <div className={styles.rowMeta}>{row.meta}</div>
                </div>
                <StatusBadge status={row.status} tone={row.statusTone} />
              </div>
            ))}
          </div>
        </Card>

        <div className={styles.side}>
          <div className={`${styles.promo} oxy-wash-light grain`}>
            <div className={styles.promoText}>
              <h3 className={styles.promoTitle}>{promo.title}</h3>
              <p className={styles.promoSub}>{promo.subtitle}</p>
              <button
                type="button"
                className={styles.promoCta}
                onClick={() => navigate(promo.target)}
              >
                {promo.cta}
              </button>
            </div>
            <BrandWatermark tone="light" />
          </div>
          {!calendarDismissed && (
            <Card className={styles.connectCard}>
              <h3 className={styles.connectTitle}>Connect your calendar</h3>
              <p className={styles.connectSub}>
                Sync check-ins and review meetings with Outlook so you never miss a cycle milestone.
              </p>
              <div className={styles.connectActions}>
                <button
                  type="button"
                  className={styles.connectCta}
                  onClick={() => navigate('/calendar')}
                >
                  Connect calendar
                </button>
                <button
                  type="button"
                  className={styles.connectDismiss}
                  onClick={() => setCalendarDismissed(true)}
                >
                  Remind me later
                </button>
              </div>
            </Card>
          )}
          <Card className={styles.sideCard}>
            <h3 className={styles.cardTitle}>{side.title}</h3>
            {side.rows.map((row) => {
              const clickable = !!row.target;
              return (
                <button
                  key={row.label}
                  type="button"
                  className={styles.sideRow}
                  data-clickable={clickable || undefined}
                  onClick={clickable ? () => navigate(row.target!) : undefined}
                  disabled={!clickable}
                >
                  <div className={styles.sideRowHead}>
                    <span className={styles.sideLabel}>{row.label}</span>
                    <span className={styles.sideCount}>{row.count}</span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${row.pct}%`, background: accentColour[row.accent] }}
                    />
                  </div>
                </button>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
