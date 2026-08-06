import type { GoalStatus } from './domain';

export type { ReviewDecision } from './domain';

// One row per direct report with a submission awaiting the manager.
export interface ReviewQueueItem {
  userId: string;
  goalCount: number;
  status: GoalStatus;
  overdue: boolean;
}
