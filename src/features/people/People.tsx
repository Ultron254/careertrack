import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import { usePeople } from './usePeople';
import styles from './People.module.css';

export function People() {
  const { groups, isPending, isError, error, refetch } = usePeople();
  const navigate = useNavigate();

  if (isPending) return <ViewSkeleton />;
  if (isError) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className={`view ${styles.page}`}>
      {groups.map((group) => (
        <div key={group.department.id} className={`card ${styles.deptCard}`}>
          <div className={styles.deptHead}>
            <span className={styles.deptBar} style={{ background: group.department.colour }} />
            <span className={styles.deptName}>{group.department.name}</span>
            <span className={styles.deptCount}>{group.members.length} people</span>
          </div>

          {group.manager && (
            <button
              type="button"
              className={styles.managerRow}
              onClick={() => navigate(`/people/${group.manager!.id}`)}
            >
              <Avatar
                userId={group.manager.id}
                name={group.manager.name}
                avatarUrl={group.manager.avatarUrl}
                size={42}
              />
              <span className={styles.managerBody}>
                <span className={styles.managerName}>{group.manager.name}</span>
                <span className={styles.managerTag}>{group.manager.jobTitle}</span>
              </span>
              <span className={styles.managerBadge}>Line manager</span>
            </button>
          )}

          <div className={styles.memberGrid}>
            {group.members.map((member) => (
              <button
                key={member.user.id}
                type="button"
                className={styles.memberCard}
                onClick={() => navigate(`/people/${member.user.id}`)}
              >
                <Avatar
                  userId={member.user.id}
                  name={member.user.name}
                  avatarUrl={member.user.avatarUrl}
                  size={38}
                />
                <span className={styles.memberBody}>
                  <span className={styles.memberName}>{member.user.name}</span>
                  <span className={styles.memberRole}>{member.user.jobTitle}</span>
                </span>
                <StatusBadge status={member.cycleStatus} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
