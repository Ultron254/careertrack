import { Avatar } from '@/Components/ui/Avatar';
import { Icon } from '@/Components/icons/Icon';
import { StatusBadge } from '@/Components/ui/Badge';
import { EmptyState } from '@/Components/ui/States';
import type { Goal, GoalComment, User } from '@/Types/domain';
import { useManagerReview, type QueueRow } from './useManagerReview';
import { ReviewQueue } from './ReviewQueue';
import { ReviewGoalCard } from './ReviewGoalCard';
import { ReviewDecisionPanel } from './ReviewDecisionPanel';
import styles from './ManagerReview.module.css';

export interface ManagerReviewProps {
  // The manager's review queue, one row per team member.
  queue: QueueRow[];
  // Each member's goals for the cycle under review.
  goalsBySubject: Record<string, Goal[]>;
  // The comment thread behind every goal in the queue.
  commentsByGoal: Record<string, GoalComment[]>;
  users: User[];
  // Resolved from the ?status= deep link; the chips take over from there.
  initialStatus: string;
}

export function ManagerReview(props: ManagerReviewProps) {
  const review = useManagerReview(props);

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
          {review.goals.length === 0 ? (
            <EmptyState
              title="No goals submitted"
              body="This person has not submitted goals for the current cycle yet."
            />
          ) : (
            review.goals.map((goal, index) => (
              <ReviewGoalCard
                key={goal.id}
                goal={goal}
                comments={props.commentsByGoal[goal.id] ?? []}
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
