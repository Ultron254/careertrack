import type { PageResolver } from '@/Lib/page';
import type { EmployeeProfileProps } from '@/Pages/people/EmployeeProfile';
import type { PeopleProps } from '@/Pages/people/People';
import { pickActiveCycle } from '@/Pages/goals/useActiveCycle';
import { cycles } from './fixtures/cycles';
import { departments } from './fixtures/departments';
import { directory } from './fixtures/directory';
import { db } from './store';
// The profile's rating panel writes through '/cycles/:cycleId/appraisal',
// so landing straight on /people/:userId must register those actions too.
import './appraisals';

// Mock counterpart of PeopleController@index: the department directory with
// each member's precomputed cycle status, plus the people and departments
// the page joins them against.
export const peopleProps: PageResolver<PeopleProps> = () => ({
  directory,
  departments,
  users: db.users,
});

// Mock counterpart of PeopleController@show: the subject with everything the
// reviewer sees in one payload — their goals for the cycle under review and
// the self-appraisal that gives the manager rating its context. An unknown
// id resolves to a null subject and the page shows its not-found message.
export const employeeProfileProps: PageResolver<EmployeeProfileProps> = ({ params }) => {
  const user = db.users.find((candidate) => candidate.id === params.userId) ?? null;
  const activeCycle = pickActiveCycle(cycles) ?? null;
  return {
    user,
    departments,
    activeCycle,
    goals:
      user && activeCycle
        ? db.goals.filter((g) => g.cycleId === activeCycle.id && g.ownerId === user.id)
        : [],
    appraisal:
      user && activeCycle
        ? (db.appraisals.find((a) => a.cycleId === activeCycle.id && a.subjectId === user.id) ??
          null)
        : null,
  };
};
