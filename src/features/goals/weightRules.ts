import type { Goal } from '@/types/domain';
import { categoryOrder } from './goalCopy';

// Submission rules for a cycle's goals. Kept pure and separate so they can be
// unit tested and so the wizard and the review step share one source of truth.

export const totalWeight = (goals: Pick<Goal, 'weight'>[]): number =>
  goals.reduce((sum, goal) => sum + goal.weight, 0);

export const everyCategoryHasAGoal = (goals: Pick<Goal, 'category'>[]): boolean =>
  categoryOrder.every((category) => goals.some((goal) => goal.category === category));

export interface SubmitCheck {
  canSubmit: boolean;
  weightsBalanced: boolean;
  categoriesComplete: boolean;
  total: number;
}

export function checkSubmittable(goals: Pick<Goal, 'weight' | 'category'>[]): SubmitCheck {
  const total = totalWeight(goals);
  const weightsBalanced = total === 100;
  const categoriesComplete = everyCategoryHasAGoal(goals);
  return {
    total,
    weightsBalanced,
    categoriesComplete,
    canSubmit: weightsBalanced && categoriesComplete,
  };
}
