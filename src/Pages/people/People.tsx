import { router } from '@/Lib/router';
import { Avatar } from '@/Components/ui/Avatar';
import { StatusBadge } from '@/Components/ui/Badge';
import type { DirectoryEntry } from '@/Types/people';
import type { Department, User } from '@/Types/domain';
import { usePeople } from './usePeople';
import styles from './People.module.css';

export interface PeopleProps {
  directory: DirectoryEntry[];
  departments: Department[];
  users: User[];
}

export function People(props: PeopleProps) {
  const { groups } = usePeople(props);

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
              onClick={() => router.visit(`/people/${group.manager!.id}`)}
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
                onClick={() => router.visit(`/people/${member.user.id}`)}
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
