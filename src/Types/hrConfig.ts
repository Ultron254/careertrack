import type { GoalCategory, ReviewStage } from './domain';

export type ReminderOffset = '14d' | '7d' | '3d' | '1d' | 'due';

export type EscalationRule =
  'notify_manager' | 'notify_people_team' | 'auto_extend' | 'flag_record';

export type AdHocCondition = 'specific_employee' | 'department' | 'circumstance';

export interface HrConfig {
  categories: {
    category: GoalCategory;
    // 0 to 100.
    defaultWeightPct: number;
    enabled: boolean;
  }[];
  // self and manager stages are mandatory; the API rejects attempts to disable them.
  reviewStages: {
    stage: ReviewStage;
    enabled: boolean;
    locked: boolean;
  }[];
  reminders: {
    offset: ReminderOffset;
    enabled: boolean;
  }[];
  escalations: {
    rule: EscalationRule;
    enabled: boolean;
  }[];
  adHocGoals: {
    enabled: boolean;
    conditions: {
      condition: AdHocCondition;
      enabled: boolean;
    }[];
  };
  cyclePhases: {
    name: string;
    startsOn: string;
    endsOn: string;
  }[];
}
