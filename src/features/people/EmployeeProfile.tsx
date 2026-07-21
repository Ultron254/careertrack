import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { CategoryChip, StatusBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/icons/Icon';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { categoryColour } from '@/components/ui/accent';
import type { Rating } from '@/types/domain';
import { useEmployeeProfile } from './useEmployeeProfile';
import styles from './People.module.css';

const ratingValues: Rating[] = [1, 2, 3, 4];

export function EmployeeProfile() {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const profile = useEmployeeProfile(userId);

  if (profile.isPending) return <ViewSkeleton />;
  if (profile.isError || !profile.user) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={profile.error} onRetry={profile.refetch} />
      </div>
    );
  }

  const { user } = profile;

  return (
    <div className={`view ${styles.page}`}>
      <button type="button" className={styles.back} onClick={() => navigate('/people')}>
        <Icon name="chevronLeft" size={15} />
        Back to People
      </button>

      <div className={`grain ${styles.cover}`}>
        <div className={styles.coverRow}>
          <Avatar
            userId={user.id}
            name={user.name}
            avatarUrl={user.avatarUrl}
            size={76}
          />
          <div style={{ flex: 1 }}>
            <div className={styles.coverName}>{user.name}</div>
            <div className={styles.coverMeta}>
              {user.jobTitle}
              {profile.department ? ` \u00B7 ${profile.department.name}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.profileGrid}>
        <div className={`card ${styles.panel}`}>
          <div className={styles.panelTitle}>{`Goals`}</div>
          <div className={styles.goalList}>
            {profile.goals.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
                No goals for the active cycle yet.
              </p>
            )}
            {profile.goals.map((goal) => (
              <div
                key={goal.id}
                className={styles.goalCard}
                style={{ borderLeftColor: categoryColour[goal.category] }}
              >
                <div className={styles.goalHead}>
                  <CategoryChip category={goal.category} />
                  <span className={styles.goalWeight}>Weight {goal.weight}%</span>
                  <span className={styles.goalStatus}>
                    <StatusBadge status={goal.status} />
                  </span>
                </div>
                <div className={styles.goalTitle}>{goal.title}</div>
                <div className={styles.rateRow}>
                  <span className={styles.rateLabel}>Rate:</span>
                  {ratingValues.map((value) => {
                    const selected = profile.ratings[goal.id] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={styles.rateButton}
                        data-on={selected}
                        style={selected ? { background: categoryColour[goal.category] } : undefined}
                        onClick={() => profile.setRating(goal.id, value)}
                      >
                        {value}
                      </button>
                    );
                  })}
                  <input
                    className={styles.rateComment}
                    placeholder="Add a comment"
                    value={profile.comments[goal.id] ?? ''}
                    onChange={(event) => profile.setComment(goal.id, event.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.side}>
          <div className={`card ${styles.sideCard}`}>
            <div className={styles.panelTitle} style={{ fontSize: 16, marginBottom: 12 }}>
              Overall
            </div>
            <div className={styles.overallValue}>
              <span className={styles.overallNumber}>{profile.overall ?? '\u2014'}</span>
              <span className={styles.overallScale}>/ 4.0 manager rating</span>
            </div>
            <p className={styles.overallNote}>
              Rate each goal above, then submit. The employee sees the result once the cycle closes.
            </p>
            <button
              type="button"
              className={styles.submitRating}
              onClick={profile.submitRating}
              disabled={!profile.canSubmit || profile.submitting}
            >
              {profile.submitting ? 'Submitting rating' : 'Submit rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
