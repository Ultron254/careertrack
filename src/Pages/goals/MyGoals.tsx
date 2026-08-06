import { Button } from '@/Components/ui/Button';
import { Icon } from '@/Components/icons/Icon';
import { EmptyState } from '@/Components/ui/States';
import { router } from '@/Lib/router';
import {
  statusFilters,
  statusFilterLabels,
  useMyGoals,
  type StatusFilter,
  type YearGroup,
} from './useMyGoals';
import { YearGoalGroup } from './YearGoalGroup';
import styles from './MyGoals.module.css';

export interface MyGoalsProps {
  // Every cycle newest first, each carrying the user's goals for that year.
  groups: YearGroup[];
  // Resolved from the ?status= deep link; the chips take over from there.
  initialStatus: StatusFilter;
}

export function MyGoals(props: MyGoalsProps) {
  const g = useMyGoals(props);

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>My performance goals</div>
          <h1 className={styles.title}>{g.userName}'s goals</h1>
        </div>
        <div className={styles.search}>
          <span className={styles.searchIcon}>
            <Icon name="search" size={16} />
          </span>
          <input
            className={styles.searchInput}
            value={g.query}
            onChange={(event) => g.setQuery(event.target.value)}
            placeholder="Search goals"
            aria-label="Search goals"
          />
        </div>
        <Button onClick={() => router.visit('/goals/setup')}>Set / edit goals</Button>
      </div>

      <div className={styles.filters}>
        <span className={styles.filterLabel}>Years</span>
        {g.yearChips.map((year) => {
          const on = g.activeYears.includes(year);
          return (
            <button
              key={year}
              type="button"
              className={styles.yearChip}
              data-on={on}
              onClick={() => g.toggleYear(year)}
            >
              <span className={styles.checkbox}>{on ? '\u2713' : ''}</span>
              {year}
            </button>
          );
        })}
        <span className={styles.divider} />
        {statusFilters.map((status) => (
          <button
            key={status}
            type="button"
            className={styles.statusChip}
            data-on={g.statusFilter === status}
            onClick={() => g.setStatusFilter(status)}
          >
            {statusFilterLabels[status]}
          </button>
        ))}
      </div>

      {!g.hasAnyGoals ? (
        <EmptyState
          title="No goals yet"
          body="Set your goals across the four categories. Save drafts as you go and submit once every section is complete."
          action={<Button onClick={() => router.visit('/goals/setup')}>Set your first goal</Button>}
        />
      ) : (
        g.visibleGroups.map((group) => <YearGoalGroup key={group.year} group={group} />)
      )}
    </div>
  );
}
