import { describe, expect, it } from 'vitest';
import type { Cycle } from '@/types/domain';
import { pickActiveCycle } from './useActiveCycle';

const cycle = (year: number, state: Cycle['state']): Cycle => ({
  id: `c-${year}`,
  year,
  state,
  opensAt: `${year}-01-01T00:00:00Z`,
  closesAt: `${year}-12-31T23:59:00Z`,
  categoryWeights: { Client: 30, Company: 20, People: 30, Financial: 20 },
  enabledReviewStages: ['self', 'manager'],
  createdAt: `${year}-01-01T00:00:00Z`,
  updatedAt: `${year}-01-01T00:00:00Z`,
});

describe('pickActiveCycle', () => {
  it('prefers the open cycle', () => {
    const cycles = [cycle(2024, 'closed'), cycle(2025, 'closed'), cycle(2026, 'open')];
    expect(pickActiveCycle(cycles)?.year).toBe(2026);
  });

  it('prefers a closing cycle when none is open', () => {
    const cycles = [cycle(2025, 'closed'), cycle(2026, 'closing')];
    expect(pickActiveCycle(cycles)?.year).toBe(2026);
  });

  it('falls back to the most recent cycle by year', () => {
    const cycles = [cycle(2024, 'closed'), cycle(2026, 'closed'), cycle(2025, 'closed')];
    expect(pickActiveCycle(cycles)?.year).toBe(2026);
  });

  it('returns undefined for an empty list', () => {
    expect(pickActiveCycle([])).toBeUndefined();
  });
});
