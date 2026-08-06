// Shared primitives used across the Types files. These all live in the
// domain model; re-exported here so each area file can pull neighbours
// from one place.
export type {
  Role,
  GoalCategory,
  GoalStatus,
  CycleState,
  ReviewStage,
  Rating,
  IsoDateTime,
  IsoDate,
} from './domain';
