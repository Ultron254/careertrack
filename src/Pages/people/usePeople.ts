import { useMemo } from 'react';
import type { Department, GoalStatus, User } from '@/Types/domain';
import type { PeopleProps } from './People';

export interface DirectoryMember {
  user: User;
  cycleStatus: GoalStatus;
}

export interface DirectoryGroup {
  department: Department;
  manager: User | undefined;
  members: DirectoryMember[];
}

export function usePeople({ directory, users, departments }: PeopleProps) {
  const groups: DirectoryGroup[] = useMemo(() => {
    const userById = new Map(users.map((user) => [user.id, user]));
    const deptById = new Map(departments.map((dept) => [dept.id, dept]));

    return directory
      .map((entry) => {
        const department = deptById.get(entry.departmentId);
        if (!department) return null;
        return {
          department,
          manager: userById.get(entry.managerId),
          members: entry.members
            .map((member) => {
              const user = userById.get(member.userId);
              return user ? { user, cycleStatus: member.cycleStatus } : null;
            })
            .filter((member): member is DirectoryMember => member !== null),
        };
      })
      .filter((group): group is DirectoryGroup => group !== null);
  }, [directory, users, departments]);

  return { groups };
}
