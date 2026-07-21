import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { useManagerReview } from './useManagerReview';
import { ReviewQueue } from './ReviewQueue';
import { ReviewGoalCard } from './ReviewGoalCard';
import { ReviewDecisionPanel } from './ReviewDecisionPanel';
import styles from './ManagerReview.module.css';

export function ManagerReview() {
  const review = useManagerReview();

  if (review.isPending) return <ViewSkeleton />;
  if (review.isError) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={review.error} onRetry={review.refetch} />
      </div>
    );
  }

  if (review.rows.length === 0) {
    return (
      <div className={`view ${styles.page}`}>
        <EmptyState
          title="Nothing to review"
          body="When your team submits their goals, they will appear here for approval."
        />
      </div>
    );
  }

  const subject = review.activeRow;
  const subjectName = subject?.user?.name ?? 'This person';

  return (
    <div className={`view ${styles.page}`}>
      <ReviewQueue review={review} />

      <div className={styles.breadcrumb}>
        <span>My team</span>
        <span aria-hidden>&#8250;</span>
        <span>Reviews</span>
        <span aria-hidden>&#8250;</span>
        <span className={styles.breadcrumbCurrent}>{subjectName}</span>
      </div>

      {subject && (
        <div className={`card ${styles.subjectCard}`}>
          <Avatar
            userId={subject.userId}
            name={subjectName}
            avatarUrl={subject.user?.avatarUrl}
            size={48}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className={styles.subjectName}>{subjectName} goals</div>
            <div className={styles.subjectMeta}>
              {subject.user?.jobTitle}
              {subject.departmentName ? ` \u00b7 ${subject.departmentName}` : ''}
            </div>
          </div>
          <StatusBadge status={subject.status} />
        </div>
      )}

      <div className={styles.notice}>
        <Icon name="info" size={18} />
        <span>
          You can comment on goals, not edit them. Approve the full submission, or return it with
          comments. Returns route to HR before {subjectName} can revise.
        </span>
      </div>

      <div className={styles.layout}>
        <div className={styles.goalColumn}>
          {review.goalsPending ? (
            <ViewSkeleton />
          ) : review.goals.length === 0 ? (
            <EmptyState
              title="No goals submitted"
              body="This person has not submitted goals for the current cycle yet."
            />
          ) : (
            review.goals.map((goal, index) => (
              <ReviewGoalCard
                key={goal.id}
                goal={goal}
                usersById={review.usersById}
                defaultOpen={index === 0}
              />
            ))
          )}
        </div>

        <ReviewDecisionPanel review={review} goals={review.goals} subjectName={subjectName} />
      </div>
    </div>
  );
}
