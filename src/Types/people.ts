import type { GoalStatus } from './domain';

// The People screen groups departments with each member's cycle status.
// The status is a server side aggregation of the member's goals, so the
// directory arrives precomputed rather than being joined in the browser.
export interface DirectoryEntry {
  departmentId: string;
  managerId: string;
  members: {
    userId: string;
    cycleStatus: GoalStatus;
  }[];
}
