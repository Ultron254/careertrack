import { useAuth } from '@/auth/authProvider';
import { AppraisalCalibration } from './AppraisalCalibration';
import { EmployeeCycle } from './EmployeeCycle';
import { ManagerAppraisalFlow } from './ManagerAppraisalFlow';

export function Appraisal({ selfOnly = false }: { selfOnly?: boolean }) {
  const { role } = useAuth();

  // `selfOnly` renders just the personal appraisal cycle — the manager flow
  // uses it for its own "My appraisal" tab, so we skip the role routing there.
  if (!selfOnly) {
    // People Team and admins get the calibration and oversight view instead of
    // a personal self-appraisal.
    if (role === 'people_team' || role === 'admin') {
      return <AppraisalCalibration />;
    }
    // Line managers also rate and sign off their team, so they get the fuller
    // flow that wraps this personal cycle alongside the team-rating stages.
    if (role === 'manager') {
      return <ManagerAppraisalFlow />;
    }
  }

  return <EmployeeCycle />;
}