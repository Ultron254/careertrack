import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/authProvider';
import { useDashboard } from '@/api/queries/insights';
import { DonutChart } from '@/components/charts/DonutChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryChip } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/States';
import { accentColour, accentGradient } from '@/components/ui/accent';
import type { GoalCategory } from '@/types/domain';
import { KpiCard } from '@/components/ui/KpiCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import styles from './Dashboard.module.css';

const categories: GoalCategory[] = ['Client', 'Company', 'People', 'Financial'];
const isCategory = (value: string | null): value is GoalCategory =>
  value !== null && (categories as string[]).includes(value);

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useDashboard();

  if (isPending) return <DashboardSkeleton />;
  if (isError) return <div className={styles.page}><ErrorState error={error} onRetry={() => refetch()} /></div>;

  const { banner, kpis, statusDonut, trend, categoryBars, list, side, promo } = data;
  const firstName = user?.name.split(' ')[0] ?? 'there';
  const bannerTitle = banner.title.replace('{firstName}', firstName);
  const topStatus = [...statusDonut.segments].sort((a, b) => b.share - a.share)[0];

  return (
    <div className={`${styles.page} view`}>
      <section className={`${styles.banner} grain`}>
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
            <button type="button" className={styles.bannerCta} onClick={() => navigate(banner.target)}>
              {banner.cta}
            </button>
          </div>
        </div>
      </section>

      <div className={styles.kpis}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className={styles.charts}>
        <Card className={styles.chartCard}>
          <h3 className={styles.cardTitle}>{statusDonut.title}</h3>
          <div className={styles.donutRow}>
            <DonutChart
              segments={statusDonut.segments}
              centerValue={topStatus ? `${topStatus.share}%` : undefined}
              centerLabel={topStatus?.label}
            />
            <div className={styles.legend}>
              {statusDonut.segments.map((segment) => (
                <div key={segment.label} className={styles.legendRow}>
                  <span className={styles.swatch} style={{ background: accentColour[segment.accent] }} />
                  <span className={styles.legendLabel}>{segment.label}</span>
                  <span className={styles.legendValue}>{segment.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>{trend.title}</h3>
            <span className={styles.cardMeta}>{trend.sub}</span>
          </div>
          <TrendChart points={trend.points} labels={trend.labels} />
        </Card>

        <Card className={styles.chartCard}>
          <h3 className={styles.cardTitle}>{categoryBars.title}</h3>
          <div className={styles.bars}>
            {categoryBars.bars.map((bar) => {
              const height = Math.max(6, bar.heightPct);
              return (
                <div key={bar.label} className={styles.barCol}>
                  <div className={styles.barTrack}>
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
                </div>
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
              <div key={row.id} className={styles.row} style={{ borderLeftColor: accentColour[row.accent] }}>
                {row.avatarUserId && <Avatar userId={row.avatarUserId} name={row.title} size={34} />}
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
          <div className={`${styles.promo} grain`}>
            <div className={styles.promoText}>
              <h3 className={styles.promoTitle}>{promo.title}</h3>
              <p className={styles.promoSub}>{promo.subtitle}</p>
              <button type="button" className={styles.promoCta} onClick={() => navigate(promo.target)}>
                {promo.cta}
              </button>
            </div>
          </div>
          <Card className={styles.sideCard}>
            <h3 className={styles.cardTitle}>{side.title}</h3>
            {side.rows.map((row) => (
              <div key={row.label} className={styles.sideRow}>
                <div className={styles.sideRowHead}>
                  <span className={styles.sideLabel}>{row.label}</span>
                  <span className={styles.sideCount}>{row.count}</span>
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${row.pct}%`, background: accentColour[row.accent] }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
