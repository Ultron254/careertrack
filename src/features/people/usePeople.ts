import { useMemo } from 'react';
import { useDepartments, useDirectory, useUsers } from '@/api/queries/org';
import type { Department, GoalStatus, User } from '@/types/domain';

export interface DirectoryMember {
  user: User;
  cycleStatus: GoalStatus;
}

export interface DirectoryGroup {
  department: Department;
  manager: User | undefined;
  members: DirectoryMember[];
}

export function usePeople() {
  const directoryQuery = useDirectory();
  const usersQuery = useUsers();
  const departmentsQuery = useDepartments();

  const groups: DirectoryGroup[] = useMemo(() => {
    const directory = directoryQuery.data;
    const users = usersQuery.data;
    const departments = departmentsQuery.data;
    if (!directory || !users || !departments) return [];

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
  }, [directoryQuery.data, usersQuery.data, departmentsQuery.data]);

  return {
    groups,
    isPending: directoryQuery.isPending || usersQuery.isPending || departmentsQuery.isPending,
    isError: directoryQuery.isError || usersQuery.isError || departmentsQuery.isError,
    error: directoryQuery.error ?? usersQuery.error ?? departmentsQuery.error,
    refetch: () => {
      void directoryQuery.refetch();
      void usersQuery.refetch();
      void departmentsQuery.refetch();
    },
  };
}
