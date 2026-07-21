import type { YearEvaluation } from '@/api/schemas/evaluation';

const categoryScores = [
  { category: 'Client', score: 3.4 },
  { category: 'Company', score: 2.8 },
  { category: 'People', score: 3.5 },
  { category: 'Financial', score: 2.6 },
] as YearEvaluation['categories'];

export const yearEvaluations: YearEvaluation[] = [
  {
    year: 2026,
    score: 3.2,
    yoyLabel: '▲ +0.3 vs 2025',
    narrative:
      'Strong momentum on Client and People goals; your Financial goal was returned and needs a measurable target. Overall you are tracking above last year at this point in the cycle.',
    categories: categoryScores,
  },
  {
    year: 2025,
    score: 2.9,
    yoyLabel: '▲ +0.2 vs 2024',
    narrative:
      'A solid year: you met most goals with standout client delivery. Company-category goals were lighter; consider a thought-leadership goal next cycle.',
    categories: categoryScores,
  },
  {
    year: 2024,
    score: 2.7,
    yoyLabel: 'baseline',
    narrative:
      'Your first full cycle on CareerTrack. Goals were well-distributed; ratings improved through the year as check-ins became consistent.',
    categories: categoryScores,
  },
];
