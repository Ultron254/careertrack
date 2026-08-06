import type { CalibrationRow } from '@/Types/teamAppraisal';
import type { Rating } from '@/Types/domain';

type ScoredRow = Pick<CalibrationRow, 'self' | 'manager' | 'final'>;

// The score a person contributes to the distribution chart: the final rating
// once agreed, otherwise the manager's view, otherwise their self-rating.
export function calibrationScore(row: ScoredRow): number | null {
  return row.final ?? row.manager ?? row.self;
}

export function distributionOf(rows: ScoredRow[]) {
  const scores = rows.map(calibrationScore).filter((score): score is number => score !== null);
  const ratings: Rating[] = [1, 2, 3, 4];
  return {
    bands: ratings.map((rating) => ({
      rating,
      count: scores.filter((score) => Math.round(score) === rating).length,
    })),
    average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
  };
}
