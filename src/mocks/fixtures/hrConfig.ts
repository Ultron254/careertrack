import type { HrConfig } from '@/api/schemas/hrConfig';

export const hrConfig: HrConfig = {
  categories: [
    { category: 'Client', defaultWeightPct: 30, enabled: true },
    { category: 'Company', defaultWeightPct: 20, enabled: true },
    { category: 'People', defaultWeightPct: 30, enabled: true },
    { category: 'Financial', defaultWeightPct: 20, enabled: true },
  ],
  reviewStages: [
    { stage: 'self', enabled: true, locked: true },
    { stage: 'manager', enabled: true, locked: true },
    { stage: 'final', enabled: true, locked: false },
    { stage: 'peer', enabled: true, locked: false },
  ],
  reminders: [
    { offset: '14d', enabled: true },
    { offset: '7d', enabled: true },
    { offset: '3d', enabled: true },
    { offset: '1d', enabled: true },
    { offset: 'due', enabled: false },
  ],
  escalations: [
    { rule: 'notify_manager', enabled: true },
    { rule: 'notify_people_team', enabled: true },
    { rule: 'auto_extend', enabled: false },
    { rule: 'flag_record', enabled: true },
  ],
  adHocGoals: {
    enabled: true,
    conditions: [
      { condition: 'specific_employee', enabled: true },
      { condition: 'department', enabled: true },
      { condition: 'circumstance', enabled: false },
    ],
  },
  cyclePhases: [
    { name: 'Goal setting', startsOn: '2026-07-03', endsOn: '2026-07-30' },
    { name: 'Manager review', startsOn: '2026-07-31', endsOn: '2026-08-14' },
    { name: 'Mid-year check-in', startsOn: '2026-08-15', endsOn: '2026-08-31' },
    { name: 'Year-end appraisal', startsOn: '2026-12-01', endsOn: '2026-12-20' },
  ],
};
