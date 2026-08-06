import type { FinalRating, Goal, IsoDateTime, Rating, TeamAppraisalStage } from '@/Types/domain';
import { formatDistanceToNow, isToday } from 'date-fns';
import { ratingLabels } from '@/Components/ui/accent';

// Pure helpers behind the manager appraisal flow. Kept free of React so the
// stage/rating arithmetic is unit-testable.

// The manager walks a report's appraisal through these stages. "Self" is the
// report's own submission (read-only context); the rest are the manager's work.
export const stageFlow = ['Self', 'Manager', 'Discussion', 'Acknowledge', 'Done'] as const;
export type Stage = (typeof stageFlow)[number];

export const stageTone: Record<Stage, string> = {
  Self: 'var(--blue)',
  Manager: 'var(--gold)',
  Discussion: 'var(--orange)',
  Acknowledge: 'var(--teal)',
  Done: 'var(--ink)',
};

// The API keeps a four-stage machine; "Self" is a purely local reading view
// that leaves the persisted stage untouched.
export function toServerStage(stage: Stage): TeamAppraisalStage {
  switch (stage) {
    case 'Self':
    case 'Manager':
      return 'manager';
    case 'Discussion':
      return 'discussion';
    case 'Acknowledge':
      return 'acknowledge';
    case 'Done':
      return 'done';
  }
}

export function fromServerStage(stage: TeamAppraisalStage): Stage {
  switch (stage) {
    case 'manager':
      return 'Manager';
    case 'discussion':
      return 'Discussion';
    case 'acknowledge':
      return 'Acknowledge';
    case 'done':
      return 'Done';
  }
}

export const openFinal: FinalRating = { value: null, status: 'open' };

export const finalOf = (finals: Record<string, FinalRating>, goalId: string): FinalRating =>
  finals[goalId] ?? openFinal;

const clampRating = (value: number): Rating =>
  Math.min(4, Math.max(1, Math.round(value))) as Rating;

// When the People Team mediates a flagged goal they meet the parties in the
// middle: the proposed (or self) number averaged with the peer view.
export function resolveMidpoint(proposed: number | null, self: Rating, peer: Rating): Rating {
  return clampRating(((proposed ?? self) + peer) / 2);
}

// The number a goal contributes to the projected overall: the agreed final if
// there is one, else the manager's rating, else the report's self-rating.
export function bestScore(
  goalId: string,
  finals: Record<string, FinalRating>,
  managerRatings: Record<string, Rating>,
  selfOf: (goalId: string) => Rating,
): number {
  return finalOf(finals, goalId).value ?? managerRatings[goalId] ?? selfOf(goalId);
}

export function projectedAverage(
  goals: Pick<Goal, 'id'>[],
  finals: Record<string, FinalRating>,
  managerRatings: Record<string, Rating>,
  selfOf: (goalId: string) => Rating,
): number {
  if (!goals.length) return 0;
  return (
    goals.reduce((sum, goal) => sum + bestScore(goal.id, finals, managerRatings, selfOf), 0) /
    goals.length
  );
}

export function ratingWord(value: number): string {
  return ratingLabels[clampRating(value)];
}

export const firstNameOf = (name: string) => name.split(' ')[0];

// How a collected signature reads on the acknowledgement tiles.
export const signedWhen = (iso: IsoDateTime) =>
  isToday(new Date(iso)) ? 'today' : formatDistanceToNow(new Date(iso), { addSuffix: true });

// --- Dummy appraisal context -------------------------------------------------
// The appraisals API does not yet return a report's submitted self-ratings, the
// per-goal comments they wrote, or the advisory peer input a manager sees while
// rating. We derive a stable stand-in from each goal id so the numbers stay put
// between renders. Replace with the real submitted appraisal + peer records.
const peerPool = [
  { name: 'Sana Patel', dept: 'Client Service' },
  { name: 'Grace Achieng', dept: 'Client Service' },
  { name: 'Kevin Njoroge', dept: 'Digital' },
  { name: 'Faith Chebet', dept: 'Creative' },
] as const;

const peerQuotes = [
  'Dependable partner on shared accounts — always shares context early.',
  'Brought real structure to our last pitch and kept everyone on track.',
  'Generous with feedback and quick to unblock the wider team.',
  'Client-ready work, though timelines occasionally slipped under pressure.',
] as const;

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

export interface GoalContext {
  selfRating: Rating;
  selfComment: string;
  // Advisory peer input only exists where a peer actually commented, so this
  // is null on the goals nobody weighed in on.
  peer: { name: string; dept: string; quote: string; rating: Rating } | null;
}

export function goalContext(goalId: string): GoalContext {
  const h = hashId(goalId);
  const selfRating = (((h >>> 2) % 3) + 2) as Rating; // 2..4, people rate themselves kindly
  const peerRating = clampRating(selfRating + ((h >>> 5) % 3) - 1);
  const hasPeer = (h >>> 2) % 2 === 0; // roughly half the goals attract a peer comment
  return {
    selfRating,
    selfComment: 'Delivered against this consistently and kept stakeholders informed throughout.',
    peer: hasPeer
      ? {
          ...peerPool[h % peerPool.length],
          quote: peerQuotes[(h >>> 4) % peerQuotes.length],
          rating: peerRating,
        }
      : null,
  };
}

// The line manager's per-goal ratings only exist once they have actually rated
// in their own view. When the employee-side demo runs ahead of that, this
// stands in a stable manager number per goal that deliberately diverges from
// the self-rating so the alignment discussion has something to align. Replace
// with the real manager ratings once the backend exposes them to the subject.
export function demoManagerRating(goalId: string, self: Rating): Rating {
  const h = hashId(goalId);
  const offset = [2, 1, -1, -2][(h >>> 6) % 4];
  const value = clampRating(self + offset);
  return value === self ? clampRating(self - Math.sign(offset)) : value;
}
