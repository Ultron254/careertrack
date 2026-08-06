import { describe, expect, it } from 'vitest';
import { calibrationScore, distributionOf } from './calibrationModel';

describe('calibration distribution', () => {
  const rows = [
    { self: 3.2, manager: 3.0, final: 3.0 }, // counts as 3
    { self: 2.8, manager: 2.8, final: null }, // manager stands in → 3
    { self: 3.5, manager: null, final: null }, // self stands in → 4
    { self: null, manager: null, final: null }, // nothing yet → excluded
  ];

  it('prefers final, then manager, then self', () => {
    expect(calibrationScore(rows[0])).toBe(3.0);
    expect(calibrationScore(rows[1])).toBe(2.8);
    expect(calibrationScore(rows[2])).toBe(3.5);
    expect(calibrationScore(rows[3])).toBeNull();
  });

  it('buckets rounded scores and skips unrated people', () => {
    const { bands, average } = distributionOf(rows);
    expect(bands.find((band) => band.rating === 3)?.count).toBe(2);
    expect(bands.find((band) => band.rating === 4)?.count).toBe(1);
    expect(bands.reduce((sum, band) => sum + band.count, 0)).toBe(3);
    expect(average).toBeCloseTo((3.0 + 2.8 + 3.5) / 3);
  });

  it('handles an empty cohort', () => {
    const { bands, average } = distributionOf([]);
    expect(average).toBeNull();
    expect(bands.every((band) => band.count === 0)).toBe(true);
  });
});
