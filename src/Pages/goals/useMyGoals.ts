import { useState } from 'react';
import { usePage } from '@/Context/SharedPropsContext';
import type { Cycle, Goal, GoalStatus } from '@/Types/domain';
import type { YearEvaluation } from '@/Types/evaluation';
import type { MyGoalsProps } from './MyGoals';

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
  // The on-request AI summary for this year, when one exists.
  evaluation: YearEvaluation | null;
}

export const isStatusFilter = (value: string | null): value is StatusFilter =>
  value !== null && (statusFilters as string[]).includes(value);

export function useMyGoals({ groups, initialStatus }: MyGoalsProps) {
  const { props } = usePage();
  const { user } = props.auth;

  const [selectedYears, setSelectedYears] = useState<number[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [query, setQuery] = useState('');

  const allYears = groups.map((group) => group.year);
  const activeYears = selectedYears ?? allYears;

  const toggleYear = (year: number) =>
    setSelectedYears((current) => {
      const base = current ?? allYears;
      return base.includes(year) ? base.filter((y) => y !== year) : [...base, year];
    });

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
