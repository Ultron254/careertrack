import { router } from '@/Lib/router';
import { Avatar } from '@/Components/ui/Avatar';
import { CategoryChip, StatusBadge } from '@/Components/ui/Badge';
import { Icon } from '@/Components/icons/Icon';
import { ErrorState } from '@/Components/ui/States';
import { categoryColour } from '@/Components/ui/accent';
import type { Appraisal, Cycle, Department, Goal, Rating, User } from '@/Types/domain';
import { useEmployeeProfile } from './useEmployeeProfile';
import styles from './People.module.css';

export interface EmployeeProfileProps {
  // Null when the URL names nobody we know; the page keeps its own fallback.
  user: User | null;
  departments: Department[];
  activeCycle: Cycle | null;
  goals: Goal[];
  appraisal: Appraisal | null;
}

const ratingValues: Rating[] = [1, 2, 3, 4];

export function EmployeeProfile(props: EmployeeProfileProps) {
  const profile = useEmployeeProfile(props);

  if (!profile.user) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState message="No user with that id." />
      </div>
    );
  }

  const { user } = profile;

  return (
    <div className={`view ${styles.page}`}>
      <button type="button" className={styles.back} onClick={() => router.visit('/people')}>
        <Icon name="chevronLeft" size={15} />
        Back to People
      </button>

      <div className={`oxy-plate oxy-wash grain ${styles.cover}`}>
        <div className={styles.coverScrim} />
        <div className={styles.coverRow}>
          <Avatar userId={user.id} name={user.name} avatarUrl={user.avatarUrl} size={76} />
          <div style={{ flex: 1 }}>
            <div className={styles.coverName}>{user.name}</div>
            <div className={styles.coverMeta}>
              {user.jobTitle}
              {profile.department ? ` \u00B7 ${profile.department.name}` : ''}
            </div>
          </div>
          <a className={styles.messageButton} href={`mailto:${user.email}`}>
            Message
          </a>
        </div>
      </div>

      <div className={styles.profileGrid}>
        <div className={`card ${styles.panel}`}>
          <div className={styles.panelTitle}>
            {profile.cycleYear ? `${profile.cycleYear} goals` : 'Goals'}
          </div>
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
              <span className={styles.overallNumber}>{profile.selfOverall ?? '\u2014'}</span>
              <span className={styles.overallScale}>of 4</span>
              <span className={styles.overallScale}>/ 4.0 self-rating</span>
            </div>
            <p className={styles.overallNote}>
              Manager rating pending. Complete each goal above, then submit the appraisal.
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

          {/* dummy activity summary — replace with a real activity feed from the API */}
          <div className={`card ${styles.sideCard}`}>
            <div
              className={styles.activityIllustration}
              style={{ backgroundImage: "url('/illustrations/chat.svg')" }}
            />
            <div className={styles.panelTitle} style={{ fontSize: 16, marginBottom: 6 }}>
              Recent activity
            </div>
            <p className={styles.activityMeta}>
              Submitted goals · 3 days ago · 6 peer reviews received
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
