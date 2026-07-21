import type { Dashboard } from '@/api/schemas/dashboard';
import type { Role } from '@/types/domain';

// daysLeft is null here; the handler fills it in from the active cycle so the
// counter keeps moving without anyone editing fixtures.

export const dashboards: Record<Role, Dashboard> = {
  employee: {
    banner: {
      kicker: 'Goal setting · closing soon',
      title: 'Hi Amara 👋 one goal needs attention',
      subtitle:
        'Your Financial goal was returned with a comment. Edit & resubmit before the window closes.',
      cta: 'Fix returned goal',
      daysLeft: null,
      target: '/goals/setup',
    },
    kpis: [
      { label: 'Goals on track', value: '3/4', delta: '+1', deltaTone: 'positive', sub: 'this cycle', accent: 'teal' },
      { label: 'Avg self-rating', value: '3', delta: null, deltaTone: 'muted', sub: 'of 4', accent: 'blue' },
      { label: 'Feedback', value: '6', delta: '+2', deltaTone: 'positive', sub: 'received', accent: 'orange' },
      { label: 'Weight', value: '100%', delta: null, deltaTone: 'muted', sub: 'complete', accent: 'gold' },
    ],
    statusDonut: {
      title: 'Goal status',
      segments: [
        { label: 'Approved', share: 50, accent: 'teal' },
        { label: 'Under review', share: 25, accent: 'gold' },
        { label: 'Returned', share: 25, accent: 'orange' },
      ],
    },
    trend: { title: 'My progress', sub: '2026', points: [35, 42, 48, 55, 63, 72], labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'] },
    categoryBars: {
      title: 'Weight by category',
      bars: [
        { label: 'Client', valueLabel: '30', heightPct: 100, accent: 'teal' },
        { label: 'Co.', valueLabel: '20', heightPct: 66, accent: 'blue' },
        { label: 'People', valueLabel: '30', heightPct: 100, accent: 'orange' },
        { label: 'Fin.', valueLabel: '20', heightPct: 66, accent: 'gold' },
      ],
    },
    list: {
      title: 'My goals',
      linkLabel: 'Open goals',
      target: '/goals',
      rows: [
        { id: 'g-amara-client-2026', avatarUserId: null, chip: 'Client', title: 'Client retention & growth', meta: 'Weight 30% · Dec 2026', status: 'Approved', statusTone: 'approved', accent: 'teal' },
        { id: 'g-amara-company-2026', avatarUserId: null, chip: 'Company', title: 'Develop 2 case studies', meta: 'Weight 20% · Dec 2026', status: 'Under Review', statusTone: 'review', accent: 'blue' },
        { id: 'g-amara-people-2026', avatarUserId: null, chip: 'People', title: 'Team development & onboarding', meta: 'Weight 30% · Dec 2026', status: 'Approved', statusTone: 'approved', accent: 'orange' },
        { id: 'g-amara-financial-2026', avatarUserId: null, chip: 'Financial', title: 'Revenue growth & upselling', meta: 'Weight 20% · Dec 2026', status: 'Returned', statusTone: 'returned', accent: 'gold' },
      ],
    },
    side: {
      title: 'Goal status',
      rows: [
        { label: 'Approved', count: '2', pct: 50, accent: 'teal' },
        { label: 'Under review', count: '1', pct: 25, accent: 'gold' },
        { label: 'Returned', count: '1', pct: 25, accent: 'orange' },
      ],
    },
    promo: { title: 'Request peer feedback', subtitle: 'Great input makes your appraisal richer.', cta: 'Ask a colleague', target: '/feedback' },
  },

  manager: {
    banner: {
      kicker: 'Reviews · action needed',
      title: '3 goals awaiting your review',
      subtitle: 'One review is past its SLA. Approve or return with comments to keep your team moving.',
      cta: 'Review team goals',
      daysLeft: null,
      target: '/reviews',
    },
    kpis: [
      { label: 'Reviews pending', value: '3', delta: null, deltaTone: 'negative', sub: '1 overdue', accent: 'orange' },
      { label: 'Approved', value: '2', delta: null, deltaTone: 'muted', sub: 'of 6', accent: 'teal' },
      { label: 'Team avg', value: '3', delta: null, deltaTone: 'positive', sub: 'rating', accent: 'blue' },
      { label: 'Appraisals', value: '4/6', delta: null, deltaTone: 'muted', sub: 'year-end', accent: 'gold' },
    ],
    statusDonut: {
      title: 'Submission status',
      segments: [
        { label: 'Approved', share: 33, accent: 'teal' },
        { label: 'Under review', share: 50, accent: 'gold' },
        { label: 'Returned', share: 17, accent: 'orange' },
      ],
    },
    trend: { title: 'Team avg rating', sub: '2026', points: [2.6, 2.7, 2.8, 2.9, 3.0, 3.0], labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'] },
    categoryBars: {
      title: 'Reviews by state',
      bars: [
        { label: 'Appr.', valueLabel: '2', heightPct: 40, accent: 'teal' },
        { label: 'Rev.', valueLabel: '3', heightPct: 60, accent: 'gold' },
        { label: 'Ret.', valueLabel: '1', heightPct: 20, accent: 'orange' },
        { label: 'New', valueLabel: '0', heightPct: 4, accent: 'blue' },
      ],
    },
    list: {
      title: 'My team',
      linkLabel: 'Open reviews',
      target: '/reviews',
      rows: [
        { id: 'row-amara', avatarUserId: 'u-amara', chip: null, title: 'Amara Koech', meta: 'Account team', status: 'Under Review', statusTone: 'review', accent: 'gold' },
        { id: 'row-kevin', avatarUserId: 'u-kevin', chip: null, title: 'Kevin Njoroge', meta: 'Account team', status: 'Submitted', statusTone: 'submitted', accent: 'blue' },
        { id: 'row-sana', avatarUserId: 'u-sana', chip: null, title: 'Sana Patel', meta: 'Account team', status: 'Approved', statusTone: 'approved', accent: 'teal' },
        { id: 'row-grace', avatarUserId: 'u-grace', chip: null, title: 'Grace Achieng', meta: 'Account team', status: 'Approved', statusTone: 'approved', accent: 'teal' },
      ],
    },
    side: {
      title: 'Submission status',
      rows: [
        { label: 'Approved', count: '2', pct: 33, accent: 'teal' },
        { label: 'Under review', count: '3', pct: 50, accent: 'gold' },
        { label: 'Returned', count: '1', pct: 17, accent: 'orange' },
      ],
    },
    promo: { title: 'Start appraisals', subtitle: '0 of 6 manager appraisals complete.', cta: 'Begin now', target: '/appraisals' },
  },

  people_team: {
    banner: {
      kicker: '2026 cycle · live',
      title: '87% of the org has set goals',
      subtitle:
        '44 employees still haven’t submitted, with 5 days left. 4 goals await your return-loop review.',
      cta: 'Configure cycle',
      daysLeft: null,
      target: '/settings?tab=config',
    },
    kpis: [
      { label: 'Submission rate', value: '87%', delta: '+9', deltaTone: 'positive', sub: '298/342', accent: 'teal' },
      { label: 'Review SLA', value: '71%', delta: '-4', deltaTone: 'negative', sub: 'within 14d', accent: 'orange' },
      { label: 'Meets+ (3 to 4)', value: '47%', delta: '+3', deltaTone: 'positive', sub: 'of org', accent: 'blue' },
      { label: 'Return loop', value: '4', delta: null, deltaTone: 'muted', sub: 'awaiting PT', accent: 'gold' },
    ],
    statusDonut: {
      title: 'Org submission',
      segments: [
        { label: 'Submitted', share: 87, accent: 'teal' },
        { label: 'Pending', share: 13, accent: 'orange' },
      ],
    },
    trend: { title: 'Submission rate', sub: 'vs last cycle', points: [40, 58, 66, 74, 81, 87], labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'Now'] },
    categoryBars: {
      title: 'By department',
      bars: [
        { label: 'Client', valueLabel: '93', heightPct: 93, accent: 'teal' },
        { label: 'Creat.', valueLabel: '79', heightPct: 79, accent: 'orange' },
        { label: 'Digital', valueLabel: '94', heightPct: 94, accent: 'blue' },
        { label: 'Media', valueLabel: '81', heightPct: 81, accent: 'gold' },
      ],
    },
    list: {
      title: 'Returned goals for People Team review',
      linkLabel: 'Open config',
      target: '/settings?tab=config',
      rows: [
        { id: 'ret-amara', avatarUserId: 'u-amara', chip: null, title: 'Amara Koech', meta: 'Financial · returned', status: 'Return-loop', statusTone: 'returned', accent: 'gold' },
        { id: 'ret-tom', avatarUserId: 'u-tom', chip: null, title: 'Tom Barasa', meta: 'Company · returned', status: 'Return-loop', statusTone: 'returned', accent: 'blue' },
        { id: 'ret-faith', avatarUserId: 'u-faith', chip: null, title: 'Faith Chebet', meta: 'People · returned', status: 'Return-loop', statusTone: 'returned', accent: 'orange' },
        { id: 'ret-kevin', avatarUserId: 'u-kevin', chip: null, title: 'Kevin Njoroge', meta: 'Client · returned', status: 'Return-loop', statusTone: 'returned', accent: 'teal' },
      ],
    },
    side: {
      title: 'Submission by dept',
      rows: [
        { label: 'Client Service', count: '93%', pct: 93, accent: 'teal' },
        { label: 'Creative', count: '79%', pct: 79, accent: 'orange' },
        { label: 'Digital', count: '94%', pct: 94, accent: 'blue' },
        { label: 'PR & Media', count: '81%', pct: 81, accent: 'gold' },
      ],
    },
    promo: { title: 'Configure the cycle', subtitle: 'Tailor categories, reminders and escalation.', cta: 'Open config', target: '/settings?tab=config' },
  },

  admin: {
    banner: {
      kicker: 'System · all healthy',
      title: '342 users across 6 departments',
      subtitle: 'Manage users, roles, org structure and system configuration from here.',
      cta: 'Open config',
      daysLeft: null,
      target: '/settings?tab=config',
    },
    kpis: [
      { label: 'Active users', value: '342', delta: null, deltaTone: 'muted', sub: 'total', accent: 'teal' },
      { label: 'Line managers', value: '28', delta: null, deltaTone: 'muted', sub: 'assigned', accent: 'blue' },
      { label: 'People Team', value: '5', delta: null, deltaTone: 'muted', sub: 'active', accent: 'orange' },
      { label: 'Departments', value: '6', delta: null, deltaTone: 'muted', sub: 'configured', accent: 'gold' },
    ],
    statusDonut: {
      title: 'Roles',
      segments: [
        { label: 'Employees', share: 88, accent: 'teal' },
        { label: 'Managers', share: 8, accent: 'blue' },
        { label: 'HR + Exec', share: 4, accent: 'orange' },
      ],
    },
    trend: { title: 'Active users', sub: '2026', points: [280, 300, 318, 330, 338, 342], labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'] },
    categoryBars: {
      title: 'Logins by dept',
      bars: [
        { label: 'Client', valueLabel: '96', heightPct: 96, accent: 'teal' },
        { label: 'Digital', valueLabel: '92', heightPct: 92, accent: 'blue' },
        { label: 'Creat.', valueLabel: '84', heightPct: 84, accent: 'orange' },
        { label: 'Media', valueLabel: '88', heightPct: 88, accent: 'gold' },
      ],
    },
    list: {
      title: 'Recent user activity',
      linkLabel: 'Manage users',
      target: '/people',
      rows: [
        { id: 'act-amara', avatarUserId: 'u-amara', chip: null, title: 'Amara Koech', meta: 'Account team', status: 'Under Review', statusTone: 'review', accent: 'gold' },
        { id: 'act-kevin', avatarUserId: 'u-kevin', chip: null, title: 'Kevin Njoroge', meta: 'Account team', status: 'Submitted', statusTone: 'submitted', accent: 'blue' },
        { id: 'act-sana', avatarUserId: 'u-sana', chip: null, title: 'Sana Patel', meta: 'Account team', status: 'Approved', statusTone: 'approved', accent: 'teal' },
        { id: 'act-grace', avatarUserId: 'u-grace', chip: null, title: 'Grace Achieng', meta: 'Account team', status: 'Approved', statusTone: 'approved', accent: 'teal' },
      ],
    },
    side: {
      title: 'Roles',
      rows: [
        { label: 'Employees', count: '301', pct: 88, accent: 'teal' },
        { label: 'Managers', count: '28', pct: 8, accent: 'blue' },
        { label: 'People Team', count: '13', pct: 4, accent: 'orange' },
      ],
    },
    promo: { title: 'System configuration', subtitle: 'Categories, cycle and reminder rules.', cta: 'Open config', target: '/settings?tab=config' },
  },
};
