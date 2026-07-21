import type { DirectoryEntry } from '@/api/schemas/people';

// Statuses here are the aggregate the backend would compute from each
// member's goals. They intentionally mirror the design's directory.
export const directory: DirectoryEntry[] = [
  {
    departmentId: 'd-client-service',
    managerId: 'u-david',
    members: [
      { userId: 'u-amara', cycleStatus: 'Under Review' },
      { userId: 'u-sana', cycleStatus: 'Approved' },
      { userId: 'u-grace', cycleStatus: 'Approved' },
    ],
  },
  {
    departmentId: 'd-creative',
    managerId: 'u-tom',
    members: [
      { userId: 'u-faith', cycleStatus: 'Returned' },
      { userId: 'u-brian', cycleStatus: 'Submitted' },
    ],
  },
  {
    departmentId: 'd-digital',
    managerId: 'u-lydia',
    members: [
      { userId: 'u-kevin', cycleStatus: 'Submitted' },
      { userId: 'u-nadia', cycleStatus: 'Approved' },
    ],
  },
  {
    departmentId: 'd-pr-media',
    managerId: 'u-peter',
    members: [
      { userId: 'u-ruth', cycleStatus: 'Approved' },
      { userId: 'u-ali', cycleStatus: 'Submitted' },
    ],
  },
  {
    departmentId: 'd-people',
    managerId: 'u-wanjiru',
    members: [
      { userId: 'u-wanjiru', cycleStatus: 'Approved' },
      { userId: 'u-peter', cycleStatus: 'Approved' },
    ],
  },
  {
    departmentId: 'd-exec',
    managerId: 'u-leila',
    members: [
      { userId: 'u-leila', cycleStatus: 'Approved' },
      { userId: 'u-james', cycleStatus: 'Approved' },
    ],
  },
];
