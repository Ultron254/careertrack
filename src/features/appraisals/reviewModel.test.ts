import { describe, expect, it } from 'vitest';
import type { FinalRating, Rating } from '@/types/domain';
import {
  bestScore,
  demoManagerRating,
  finalOf,
  fromServerStage,
  projectedAverage,
  resolveMidpoint,
  toServerStage,
} from './reviewModel';

describe('stage mapping', () => {
  it('round-trips every server stage', () => {
    for (const stage of ['manager', 'discussion', 'acknowledge', 'done'] as const) {
      expect(toServerStage(fromServerStage(stage))).toBe(stage);
    }
  });

  it('maps the local read-only Self view onto the manager stage', () => {
    expect(toServerStage('Self')).toBe('manager');
  });
});

describe('finals', () => {
  const finals: Record<string, FinalRating> = {
    'g-1': { value: 3, status: 'locked' },
  };

  it('falls back to an open final for unseen goals', () => {
    expect(finalOf(finals, 'g-2')).toEqual({ value: null, status: 'open' });
    expect(finalOf(finals, 'g-1').status).toBe('locked');
  });

  it('meets the parties in the middle when the People Team resolves a flag', () => {
    expect(resolveMidpoint(4, 3, 2)).toBe(3);
    expect(resolveMidpoint(null, 3, 2)).toBe(3); // falls back to the self-rating
    expect(resolveMidpoint(1, 2, 1)).toBe(1); // never leaves the 1..4 scale
  });
});

describe('projected average', () => {
  const goals = [{ id: 'g-1' }, { id: 'g-2' }];
  const selfOf = () => 2 as Rating;

  it('prefers agreed finals, then manager ratings, then self-ratings', () => {
    const finals: Record<string, FinalRating> = { 'g-1': { value: 4, status: 'locked' } };
    const managerRatings: Record<string, Rating> = { 'g-2': 3 };
    expect(bestScore('g-1', finals, managerRatings, selfOf)).toBe(4);
    expect(bestScore('g-2', finals, managerRatings, selfOf)).toBe(3);
    expect(bestScore('g-2', {}, {}, selfOf)).toBe(2);
    expect(projectedAverage(goals, finals, managerRatings, selfOf)).toBe(3.5);
  });

  it('returns zero with no goals', () => {
    expect(projectedAverage([], {}, {}, selfOf)).toBe(0);
  });
});

describe('demo manager rating', () => {
  it('is stable, stays on the scale and never matches the self-rating', () => {
    for (const goalId of ['g-1', 'g-2', 'goal-abc', 'goal-xyz']) {
      for (const self of [1, 2, 3, 4] as Rating[]) {
        const rating = demoManagerRating(goalId, self);
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(4);
        expect(rating).not.toBe(self);
        expect(demoManagerRating(goalId, self)).toBe(rating);
      }
    }
  });
});
