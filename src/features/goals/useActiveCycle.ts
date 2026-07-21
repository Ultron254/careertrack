import { useCycles } from '@/api/queries/goals';
import type { Cycle } from '@/types/domain';

// The cycle currently accepting goals: the open or closing one, falling back to
// the most recent by year so the wizard always has a cycle to write against.
export function pickActiveCycle(cycles: Cycle[]): Cycle | undefined {
  const live = cycles.find((c) => c.state === 'open' || c.state === 'closing');
  if (live) return live;
  return [...cycles].sort((a, b) => b.year - a.year)[0];
}

export function useActiveCycle() {
  const query = useCycles();
  return { ...query, activeCycle: query.data ? pickActiveCycle(query.data) : undefined };
}
