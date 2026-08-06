import type { GoalCategory } from './domain';

// On-request yearly summary shown inside My Goals. Advisory only; it never
// replaces the formal appraisal.
export interface YearEvaluation {
  year: number;
  // 0 to 4.
  score: number;
  yoyLabel: string;
  narrative: string;
  categories: {
    category: GoalCategory;
    // 0 to 4.
    score: number;
  }[];
}
