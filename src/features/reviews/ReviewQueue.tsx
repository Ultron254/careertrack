import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import type { useManagerReview } from './useManagerReview';
import styles from './ManagerReview.module.css';

export function ReviewQueue({ review }: { review: ReturnType<typeof useManagerReview> }) {
  return (
    <div className={`card ${styles.queueCard}`}>
      <div className={styles.queueHead}>
        <div className={styles.queueTitle}>Review queue</div>
        <span className={styles.queueCount}>{review.rows.length} awaiting review</span>
        <button type="button" className={styles.selectAll} onClick={review.toggleAll}>
          <span className={styles.check} data-on={review.allSelected}>
            {review.allSelected ? '\u2713' : ''}
          </span>
          Select all
        </button>
      </div>

      {review.statusOptions.length > 1 && (
        <div className={styles.filterRow}>
          {review.statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              className={styles.filterChip}
              data-on={review.statusFilter === status}
              onClick={() => review.setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      <div className={styles.rows}>
        {review.rows.length === 0 && (
          <div className={styles.emptyRow}>No team members with that status.</div>
        )}
        {review.rows.map((row) => {
          const selected = !!review.selected[row.userId];
          const active = review.activeUserId === row.userId;
          return (
            <div
              key={row.userId}
              className={styles.row}
              data-active={active}
              data-selected={selected}
              role="button"
              tabIndex={0}
              onClick={() => review.openReview(row.userId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  review.openReview(row.userId);
                }
              }}
            >
              <span
                className={styles.check}
                data-on={selected}
                role="checkbox"
                aria-checked={selected}
                aria-label={`Select ${row.user?.name ?? 'team member'}`}
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  review.toggleSelect(row.userId);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    review.toggleSelect(row.userId);
                  }
                }}
              >
                {selected ? '\u2713' : ''}
              </span>
              <Avatar
                userId={row.userId}
                name={row.user?.name ?? 'Team member'}
                avatarUrl={row.user?.avatarUrl}
                size={34}
              />
              <div className={styles.rowBody}>
                <div className={styles.rowName}>{row.user?.name ?? 'Team member'}</div>
                <div className={styles.rowMeta}>
                  {row.user?.jobTitle}
                  {row.departmentName ? ` \u00b7 ${row.departmentName}` : ''} {'\u00b7'}{' '}
                  {row.goalCount} goals
                </div>
              </div>
              {row.overdue && <span className={styles.overdue}>SLA overdue</span>}
              <StatusBadge status={row.status} />
              <span className={styles.chev} aria-hidden>
                &#8250;
              </span>
            </div>
          );
        })}
      </div>

      {review.selectedCount > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{review.selectedCount} selected</span>
          <input
            className={styles.bulkInput}
            value={review.bulkComment}
            onChange={(event) => review.setBulkComment(event.target.value)}
            placeholder="Shared comment (applies to all selected)"
            aria-label="Shared bulk comment"
          />
          <button
            type="button"
            className={styles.bulkApprove}
            onClick={() => review.runBulk('approved')}
            disabled={review.bulkPending}
          >
            Approve all
          </button>
          <button
            type="button"
            className={styles.bulkReturn}
            onClick={() => review.runBulk('returned')}
            disabled={review.bulkPending}
          >
            Return all
          </button>
        </div>
      )}
    </div>
  );
}
