import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { request } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { goalsSchema } from '@/api/schemas/goal';
import { useCycles } from '@/api/queries/goals';
import { useAuth } from '@/auth/authProvider';
import type { Cycle, Goal, GoalStatus } from '@/types/domain';

export type StatusFilter = 'All' | GoalStatus;

export const statusFilters: StatusFilter[] = [
  'All',
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Returned',
];

export interface YearGroup {
  year: number;
  cycle: Cycle;
  goals: Goal[];
}

export function useMyGoals() {
  const { user } = useAuth();
  const cyclesQuery = useCycles();
  const cycles = useMemo(
    () => [...(cyclesQuery.data ?? [])].sort((a, b) => b.year - a.year),
    [cyclesQuery.data],
  );

  const goalQueries = useQueries({
    queries: cycles.map((cycle) => ({
      queryKey: ['goals', cycle.id, 'me'],
      queryFn: () => request(goalsSchema, endpoints.goals.list(cycle.id)),
    })),
  });

  const [selectedYears, setSelectedYears] = useState<number[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [query, setQuery] = useState('');

  const allYears = cycles.map((cycle) => cycle.year);
  const activeYears = selectedYears ?? allYears;

  const toggleYear = (year: number) =>
    setSelectedYears((current) => {
      const base = current ?? allYears;
      const next = base.includes(year) ? base.filter((y) => y !== year) : [...base, year];
      return next;
    });

  const groups: YearGroup[] = cycles.map((cycle, index) => ({
    year: cycle.year,
    cycle,
    goals: goalQueries[index]?.data ?? [],
  }));

  const term = query.trim().toLowerCase();
  const visibleGroups = groups
    .filter((group) => activeYears.includes(group.year))
    .map((group) => ({
      ...group,
      goals: group.goals.filter((goal) => {
        if (statusFilter !== 'All' && goal.status !== statusFilter) return false;
        if (term && !`${goal.title} ${goal.description}`.toLowerCase().includes(term)) return false;
        return true;
      }),
    }));

  return {
    userName: user?.name ?? 'My',
    isPending: cyclesQuery.isPending || goalQueries.some((q) => q.isPending),
    isError: cyclesQuery.isError || goalQueries.some((q) => q.isError),
    error: cyclesQuery.error ?? goalQueries.find((q) => q.error)?.error,
    refetch: () => {
      cyclesQuery.refetch();
      goalQueries.forEach((q) => q.refetch());
    },
    yearChips: allYears,
    activeYears,
    toggleYear,
    statusFilter,
    setStatusFilter,
    query,
    setQuery,
    visibleGroups,
    hasAnyGoals: groups.some((group) => group.goals.length > 0),
  };
}
