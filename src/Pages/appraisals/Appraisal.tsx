import { usePage } from '@/Context/SharedPropsContext';
import type {
  Appraisal as AppraisalRecord,
  Cycle,
  Department,
  FeedbackRequest,
  FeedbackResponse,
  Goal,
  TeamAppraisal,
  User,
} from '@/Types/domain';
import type { CalibrationRow } from '@/Types/teamAppraisal';
import { AppraisalCalibration } from './AppraisalCalibration';
import { EmployeeCycle } from './EmployeeCycle';
import { ManagerAppraisalFlow } from './ManagerAppraisalFlow';

// Everything the personal appraisal cycle works from. The record is the same
// team-appraisal row the manager and People Team views mutate, so all three
// personas stay in step.
export interface SelfAppraisalData {
  cycle: Cycle | null;
  goals: Goal[];
  appraisal: AppraisalRecord | null;
  record: TeamAppraisal | null;
  users: User[];
  departments: Department[];
  received: FeedbackResponse[];
  sentRequests: FeedbackRequest[];
}

// One direct report's appraisal as the line manager sees it.
export interface TeamReviewData {
  report: User;
  goals: Goal[];
  record: TeamAppraisal;
}

// The People Team's calibration view: the cohort table plus the one live
// record they can open and mediate.
export interface CalibrationData {
  teamName: string;
  rows: CalibrationRow[];
  record: TeamAppraisal;
  goals: Goal[];
  year: number;
}

export interface AppraisalProps {
  self: SelfAppraisalData;
  // Only line managers get a team slice.
  team: TeamReviewData[] | null;
  // Only the People Team and admins get the calibration slice.
  calibration: CalibrationData | null;
}

export function Appraisal({ self, team, calibration }: AppraisalProps) {
  const { props } = usePage();
  const role = props.auth.user?.role;

  // People Team and admins get the calibration and oversight view instead of
  // a personal self-appraisal.
  if ((role === 'people_team' || role === 'admin') && calibration) {
    return <AppraisalCalibration calibration={calibration} users={self.users} />;
  }
  // Line managers also rate and sign off their team, so they get the fuller
  // flow that wraps this personal cycle alongside the team-rating stages.
  if (role === 'manager' && team) {
    return <ManagerAppraisalFlow self={self} team={team} />;
  }

  return <EmployeeCycle self={self} />;
}
