import type { Report } from '@/api/schemas/report';
import type { Role } from '@/types/domain';

const ratingSpread = [
  { label: 'Exceptional (4)', share: 14, accent: 'teal' },
  { label: 'Exceeds (3)', share: 33, accent: 'blue' },
  { label: 'Meets (2)', share: 43, accent: 'gold' },
  { label: 'Does not meet (1)', share: 10, accent: 'orange' },
] as const;

export const reports: Record<Role, Report> = {
  employee: {
    kpis: [
      {
        label: 'Goals on track',
        value: '3/4',
        delta: '+1',
        deltaTone: 'positive',
        sub: 'this cycle',
        accent: 'teal',
        hint: 'Open your goals to see what is on track',
        target: '/goals',
      },
      {
        label: 'Avg self-rating',
        value: '3',
        delta: null,
        deltaTone: 'muted',
        sub: 'of 4',
        accent: 'blue',
        hint: 'Continue or review your self appraisal',
        target: '/appraisals',
      },
      {
        label: 'Feedback received',
        value: '6',
        delta: '+2',
        deltaTone: 'positive',
        sub: 'this cycle',
        accent: 'orange',
        hint: 'Open feedback to read or request more',
        target: '/feedback',
      },
      {
        label: 'Weight complete',
        value: '100%',
        delta: null,
        deltaTone: 'muted',
        sub: 'across 4 goals',
        accent: 'gold',
        hint: 'Category weights already add to 100%',
        target: '/goals',
      },
    ],
    categoryBars: {
      title: 'My performance by category',
      sub: 'Self-rating · 1 to 4',
      bars: [
        { label: 'Client', valueLabel: '3', heightPct: 75, accent: 'teal' },
        { label: 'Company', valueLabel: '3', heightPct: 75, accent: 'blue' },
        { label: 'People', valueLabel: '3', heightPct: 75, accent: 'orange' },
        { label: 'Financial', valueLabel: '3', heightPct: 75, accent: 'gold' },
      ],
    },
    statusDonut: {
      title: 'My goal status',
      segments: [
        { label: 'Approved', share: 75, accent: 'teal' },
        { label: 'In progress', share: 25, accent: 'gold' },
      ],
    },
    trend: {
      title: 'My rating trend',
      sub: 'Self + manager, whole numbers',
      points: [2, 2, 3, 3, 3, 3],
      labels: ['24 H1', '24 H2', '25 H1', '25 H2', '26 H1', '26 H2'],
    },
    table: {
      title: 'My goals',
      columns: ['Goal', 'Weight', 'Status', 'Rating'],
      rows: [
        { name: 'Client retention & growth', avatarUserId: null, cells: ['30%', 'Approved', '3'], lastCellTone: 'positive' },
        { name: 'Case studies', avatarUserId: null, cells: ['20%', 'Approved', '3'], lastCellTone: 'info' },
        { name: 'Team development', avatarUserId: null, cells: ['30%', 'Approved', '3'], lastCellTone: 'positive' },
        { name: 'Revenue growth', avatarUserId: null, cells: ['20%', 'In progress', '2'], lastCellTone: 'caution' },
      ],
    },
    insights: {
      sub: 'Personalised to your goals',
      headline:
        'You’re on track in 3 of 4 categories. Your Financial goal has stalled at 0% with 5 days left; a quick check-in with David would unblock it.',
      cards: [
        { emoji: '📈', tag: 'Momentum', accent: 'teal', text: 'People & Client goals are progressing 20% faster than your last cycle.', metric: '+20%', metricLabel: 'vs 2025' },
        { emoji: '⚠️', tag: 'Risk', accent: 'orange', text: 'Financial goal returned and untouched for 6 days. Edit and resubmit soon.', metric: '6d', metricLabel: 'idle' },
        { emoji: '🎯', tag: 'Tip', accent: 'gold', text: 'Request one more peer review to strengthen your appraisal evidence.', metric: '6', metricLabel: 'reviews so far' },
      ],
      prompts: ['Summarise my progress', 'What should I prioritise?', 'Draft a check-in note'],
    },
  },

  manager: {
    kpis: [
      {
        label: 'Team avg rating',
        value: '3',
        delta: null,
        deltaTone: 'positive',
        sub: '6 reports',
        accent: 'blue',
        hint: 'Open appraisals to work through team ratings',
        target: '/appraisals',
      },
      {
        label: 'Goals approved',
        value: '92%',
        delta: null,
        deltaTone: 'muted',
        sub: 'of team goals',
        accent: 'teal',
        hint: 'See approved team goals in the review queue',
        target: '/reviews?status=Approved',
      },
      {
        label: 'Reviews on time',
        value: '5/6',
        delta: null,
        deltaTone: 'negative',
        sub: '1 overdue',
        accent: 'orange',
        hint: 'Clear the overdue review in your queue',
        target: '/reviews?status=Under Review',
      },
      {
        label: 'Appraisals done',
        value: '4/6',
        delta: null,
        deltaTone: 'muted',
        sub: 'year-end',
        accent: 'gold',
        hint: 'Continue year-end appraisals for your team',
        target: '/appraisals',
      },
    ],
    categoryBars: {
      title: 'Team performance by category',
      sub: 'Avg rating · 1 to 4',
      bars: [
        { label: 'Client', valueLabel: '3', heightPct: 75, accent: 'teal' },
        { label: 'Company', valueLabel: '3', heightPct: 75, accent: 'blue' },
        { label: 'People', valueLabel: '3', heightPct: 75, accent: 'orange' },
        { label: 'Financial', valueLabel: '3', heightPct: 75, accent: 'gold' },
      ],
    },
    statusDonut: { title: 'Team rating spread', segments: [...ratingSpread] },
    trend: {
      title: 'Team avg trend',
      sub: 'Cycle over cycle',
      points: [2, 3, 3, 3, 3, 3],
      labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
    },
    table: {
      title: 'My team',
      columns: ['Employee', 'Goals', 'Status', 'Rating'],
      rows: [
        { name: 'Amara Koech', avatarUserId: 'u-amara', cells: ['4', 'Approved', '3'], lastCellTone: 'positive' },
        { name: 'Kevin Njoroge', avatarUserId: 'u-kevin', cells: ['4', 'Review', '3'], lastCellTone: 'caution' },
        { name: 'Sana Patel', avatarUserId: 'u-sana', cells: ['5', 'Approved', '3'], lastCellTone: 'positive' },
        { name: 'Grace Achieng', avatarUserId: 'u-grace', cells: ['4', 'Approved', '3'], lastCellTone: 'info' },
        { name: 'Brian Kimani', avatarUserId: 'u-brian', cells: ['3', 'Draft', 'None'], lastCellTone: 'muted' },
      ],
    },
    insights: {
      sub: 'Across your team of 6',
      headline:
        'Team completion is healthy at 83%, but review turnaround is your bottleneck: 1 review is past SLA and 3 are pending, risking the cycle close date.',
      cards: [
        { emoji: '⏱️', tag: 'Bottleneck', accent: 'orange', text: 'Average review turnaround is 4.2 days, above the 2-day target.', metric: '4.2d', metricLabel: 'avg SLA' },
        { emoji: '🌟', tag: 'Standout', accent: 'teal', text: 'Sana Patel’s goals show the strongest client-value alignment on the team.', metric: '3', metricLabel: 'self-rating' },
        { emoji: '💬', tag: 'Action', accent: 'gold', text: '2 team members haven’t booked a goal-review meeting yet.', metric: '2', metricLabel: 'to nudge' },
      ],
      prompts: ['Who needs attention?', 'Summarise team goals', 'Draft review comments'],
    },
  },

  people_team: {
    kpis: [
      {
        label: 'Submission rate',
        value: '87%',
        delta: '+9',
        deltaTone: 'positive',
        sub: '298 / 342',
        accent: 'teal',
        hint: 'See who still needs to submit in People',
        target: '/people',
      },
      {
        label: 'Meets+ (3 to 4)',
        value: '47%',
        delta: '+3',
        deltaTone: 'positive',
        sub: 'of org',
        accent: 'blue',
        hint: 'Explore the rating distribution below',
        target: '/reports',
      },
      {
        label: 'Review SLA',
        value: '71%',
        delta: '-4',
        deltaTone: 'negative',
        sub: 'within 14 days',
        accent: 'orange',
        hint: 'Open reviews that are past SLA',
        target: '/reviews',
      },
      {
        label: 'Return loop',
        value: '4',
        delta: null,
        deltaTone: 'muted',
        sub: 'awaiting PT',
        accent: 'gold',
        hint: 'Returned goals waiting on People Team',
        target: '/people',
      },
    ],
    categoryBars: {
      title: 'Submission by department',
      sub: '% submitted',
      bars: [
        { label: 'Client Svc', valueLabel: '93%', heightPct: 93, accent: 'teal' },
        { label: 'Creative', valueLabel: '79%', heightPct: 79, accent: 'orange' },
        { label: 'Digital', valueLabel: '94%', heightPct: 94, accent: 'blue' },
        { label: 'Media', valueLabel: '81%', heightPct: 81, accent: 'gold' },
      ],
    },
    statusDonut: { title: 'Org rating distribution', segments: [...ratingSpread] },
    trend: {
      title: 'Submission trend',
      sub: 'Days into cycle',
      points: [0.4, 1.6, 2.5, 3.1, 3.4, 3.6],
      labels: ['D1', 'D5', 'D10', 'D15', 'D20', 'D25'],
    },
    table: {
      title: 'Departments',
      columns: ['Department', 'Submitted', 'Reviewed', 'Meets+'],
      rows: [
        { name: 'Client Service', avatarUserId: null, cells: ['93%', '82%', '62%'], lastCellTone: 'positive' },
        { name: 'Creative', avatarUserId: null, cells: ['79%', '61%', '41%'], lastCellTone: 'caution' },
        { name: 'Digital', avatarUserId: null, cells: ['94%', '88%', '54%'], lastCellTone: 'info' },
        { name: 'PR & Media Relations', avatarUserId: null, cells: ['81%', '70%', '44%'], lastCellTone: 'caution' },
        { name: 'Strategy & Planning', avatarUserId: null, cells: ['92%', '85%', '58%'], lastCellTone: 'positive' },
      ],
    },
    insights: {
      sub: 'Organisation-wide · 2026 cycle',
      headline:
        'Submission is up 9 points to 87%, but Creative lags at 79% and review SLA slipped to 71%. Targeted nudges to 2 departments could lift org completion above 95% before close.',
      cards: [
        { emoji: '📊', tag: 'Pattern', accent: 'blue', text: 'Departments with a kickoff meeting submit 22% faster on average.', metric: '+22%', metricLabel: 'with kickoff' },
        { emoji: '⚠️', tag: 'Risk', accent: 'orange', text: 'Creative & Media are below target with 44 employees still to submit.', metric: '44', metricLabel: 'outstanding' },
        { emoji: '🔁', tag: 'Flow', accent: 'gold', text: '4 returned goals await your review-loop sign-off, blocking edits.', metric: '4', metricLabel: 'in loop' },
      ],
      prompts: ['Who’s at risk of missing the deadline?', 'Draft a reminder to Creative', 'Explain the SLA dip'],
    },
  },

  admin: {
    kpis: [
      {
        label: 'Active users',
        value: '342',
        delta: null,
        deltaTone: 'muted',
        sub: 'total',
        accent: 'teal',
        hint: 'Browse everyone in the People directory',
        target: '/people',
      },
      {
        label: 'Weekly active',
        value: '96%',
        delta: '+4',
        deltaTone: 'positive',
        sub: 'since cycle open',
        accent: 'blue',
        hint: 'See adoption by department below',
        target: '/people',
      },
      {
        label: 'Unlinked managers',
        value: '2',
        delta: null,
        deltaTone: 'negative',
        sub: 'no reports',
        accent: 'orange',
        hint: 'Fix org structure for managers with no reports',
        target: '/people',
      },
      {
        label: 'Departments',
        value: '6',
        delta: null,
        deltaTone: 'muted',
        sub: 'configured',
        accent: 'gold',
        hint: 'Open HR configuration for departments',
        target: '/settings?tab=config',
      },
    ],
    categoryBars: {
      title: 'Adoption by department',
      sub: '% weekly active',
      bars: [
        { label: 'Client', valueLabel: '96', heightPct: 96, accent: 'teal' },
        { label: 'Digital', valueLabel: '92', heightPct: 92, accent: 'blue' },
        { label: 'Creat.', valueLabel: '84', heightPct: 84, accent: 'orange' },
        { label: 'Media', valueLabel: '88', heightPct: 88, accent: 'gold' },
      ],
    },
    statusDonut: {
      title: 'Roles',
      segments: [
        { label: 'Employees', share: 88, accent: 'teal' },
        { label: 'Managers', share: 8, accent: 'blue' },
        { label: 'HR + Exec', share: 4, accent: 'orange' },
      ],
    },
    trend: {
      title: 'Active users',
      sub: '2026',
      points: [280, 300, 318, 330, 338, 342],
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    },
    table: {
      title: 'Departments',
      columns: ['Department', 'Users', 'Weekly active', 'Managers'],
      rows: [
        { name: 'Client Service', avatarUserId: null, cells: ['96', '96%', '4'], lastCellTone: 'positive' },
        { name: 'Creative', avatarUserId: null, cells: ['58', '84%', '3'], lastCellTone: 'caution' },
        { name: 'Digital', avatarUserId: null, cells: ['74', '92%', '5'], lastCellTone: 'info' },
        { name: 'PR & Media Relations', avatarUserId: null, cells: ['62', '88%', '4'], lastCellTone: 'positive' },
        { name: 'Strategy & Planning', avatarUserId: null, cells: ['52', '91%', '3'], lastCellTone: 'positive' },
      ],
    },
    insights: {
      sub: 'System & adoption',
      headline:
        'Adoption is strong at 96% weekly active. No data-quality issues detected this cycle; 2 manager accounts have no direct reports assigned.',
      cards: [
        { emoji: '✅', tag: 'Health', accent: 'teal', text: 'All departments configured with categories and weightings.', metric: '100%', metricLabel: 'configured' },
        { emoji: '👥', tag: 'Adoption', accent: 'blue', text: 'Weekly active users up 4 points since cycle open.', metric: '96%', metricLabel: 'WAU' },
        { emoji: '⚙️', tag: 'Fix', accent: 'orange', text: '2 managers have no reportees linked, so reviews cannot route.', metric: '2', metricLabel: 'to resolve' },
      ],
      prompts: ['Any config gaps?', 'Show adoption by dept', 'List unassigned managers'],
    },
  },
};
