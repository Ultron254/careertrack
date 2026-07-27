import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { request } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { goalsSchema } from '@/api/schemas/goal';
import { useCycles } from '@/api/queries/goals';
import { useAuth } from '@/auth/authProvider';
import type { Cycle, Goal, GoalStatus } from '@/types/domain';

export type StatusFilter = 'All' | GoalStatus;

// The goals list only surfaces the states an employee acts on; Draft and
// Submitted still show under "All" but don't get their own chip.
export const statusFilters: StatusFilter[] = ['All', 'Approved', 'Under Review', 'Returned'];

// Design labels differ slightly from the stored status values.
export const statusFilterLabels: Record<StatusFilter, string> = {
  All: 'All',
  Draft: 'Draft',
  Submitted: 'Submitted',
  'Under Review': 'Under review',
  Approved: 'Approved',
  Returned: 'Returned',
};

export interface YearGroup {
  year: number;
  cycle: Cycle;
  goals: Goal[];
}

const isStatusFilter = (value: string | null): value is StatusFilter =>
  value !== null && (statusFilters as string[]).includes(value);

export function useMyGoals() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
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
  // Honour a ?status= deep link from the dashboard, then let the chips take over.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const fromUrl = searchParams.get('status');
    return isStatusFilter(fromUrl) ? fromUrl : 'All';
  });
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
