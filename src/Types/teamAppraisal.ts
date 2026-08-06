import type { FinalRating, Rating, SignatureParty, TeamAppraisalStage } from './domain';

export type {
  TeamAppraisal,
  TeamAppraisalStage,
  FinalRating,
  FinalRatingStatus,
  SignatureParty,
} from './domain';

export type SignaturePartyInput = SignatureParty;

// Draft the manager saves as they work; signatures only move through the
// dedicated sign endpoint.
export interface TeamAppraisalDraft {
  stage: TeamAppraisalStage;
  // Keyed by goal id.
  managerRatings: Record<string, Rating>;
  evidence: Record<string, string>;
  overallComment: string;
  finals: Record<string, FinalRating>;
}

// One row in the People Team calibration table. The backend aggregates the
// self, manager and final scores per person for the requested cycle.
export interface CalibrationRow {
  userId: string;
  name: string;
  jobTitle: string;
  self: number | null;
  manager: number | null;
  final: number | null;
  stage: 'self' | 'manager' | 'discussion' | 'acknowledge' | 'done';
  // True when the appraisal is still being worked and can be opened live.
  live: boolean;
}

export interface Calibration {
  cycleId: string;
  teamName: string;
  rows: CalibrationRow[];
}
