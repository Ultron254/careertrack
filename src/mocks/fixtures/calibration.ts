import type { CalibrationRow } from '@/api/schemas/teamAppraisal';

// Baseline calibration rows for the Client Service cohort. Everyone except
// Amara is already settled; her row goes live from the team-appraisal record
// the moment a manager starts working it. Figures mirror the product spec.
export const calibrationBaseline: CalibrationRow[] = [
  {
    userId: 'u-amara',
    name: 'Amara Koech',
    jobTitle: 'Account Manager',
    self: null,
    manager: null,
    final: null,
    stage: 'self',
    live: true,
  },
  {
    userId: 'u-kevin',
    name: 'Kevin Njoroge',
    jobTitle: 'Senior AE',
    self: 3.2,
    manager: 3.0,
    final: 3.0,
    stage: 'done',
    live: false,
  },
  {
    userId: 'u-sana',
    name: 'Sana Patel',
    jobTitle: 'Account Executive',
    self: 2.8,
    manager: 2.8,
    final: 2.8,
    stage: 'done',
    live: false,
  },
  {
    userId: 'u-grace',
    name: 'Grace Achieng',
    jobTitle: 'Account Executive',
    self: 3.5,
    manager: 3.0,
    final: null,
    stage: 'discussion',
    live: false,
  },
  {
    userId: 'u-brian',
    name: 'Brian Kimani',
    jobTitle: 'Junior AE',
    self: 2.4,
    manager: 2.6,
    final: 2.6,
    stage: 'done',
    live: false,
  },
];
