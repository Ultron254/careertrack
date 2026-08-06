import { describe, expect, it } from 'vitest';
import type { Goal } from '@/Types/domain';
import { checkSubmittable, everyCategoryHasAGoal, totalWeight } from './weightRules';

type GoalShape = Pick<Goal, 'weight' | 'category'>;

const fullSet: GoalShape[] = [
  { category: 'Client', weight: 30 },
  { category: 'Company', weight: 20 },
  { category: 'People', weight: 30 },
  { category: 'Financial', weight: 20 },
];

describe('weight rules', () => {
  it('sums the weights', () => {
    expect(totalWeight(fullSet)).toBe(100);
    expect(totalWeight([])).toBe(0);
  });

  it('requires a goal in every category', () => {
    expect(everyCategoryHasAGoal(fullSet)).toBe(true);
    expect(everyCategoryHasAGoal(fullSet.slice(0, 3))).toBe(false);
  });

  it('allows submission only when weights total 100 and categories are complete', () => {
    expect(checkSubmittable(fullSet).canSubmit).toBe(true);
  });

  it('blocks submission when weights do not total 100', () => {
    const overweight = fullSet.map((goal) =>
      goal.category === 'Client' ? { ...goal, weight: 40 } : goal,
    );
    const result = checkSubmittable(overweight);
    expect(result.total).toBe(110);
    expect(result.weightsBalanced).toBe(false);
    expect(result.canSubmit).toBe(false);
  });

  it('blocks submission when a category has no goal', () => {
    const result = checkSubmittable([
      { category: 'Client', weight: 50 },
      { category: 'Company', weight: 50 },
    ]);
    expect(result.categoriesComplete).toBe(false);
    expect(result.canSubmit).toBe(false);
  });
});
