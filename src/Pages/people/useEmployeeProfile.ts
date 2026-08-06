import { useState } from 'react';
import { router } from '@/Lib/router';
import { useToast } from '@/Components/ui/Toast';
import type { Rating } from '@/Types/domain';
import type { EmployeeProfileProps } from './EmployeeProfile';

export function useEmployeeProfile({
  user,
  departments,
  activeCycle,
  goals,
  appraisal,
}: EmployeeProfileProps) {
  const toast = useToast();

  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const department = departments.find((d) => d.id === user?.departmentId);

  const rated = Object.values(ratings);
  const overall = rated.length
    ? Math.round((rated.reduce((sum, value) => sum + value, 0) / rated.length) * 10) / 10
    : null;

  const setRating = (goalId: string, rating: Rating) =>
    setRatings((prev) => ({ ...prev, [goalId]: rating }));
  const setComment = (goalId: string, comment: string) =>
    setComments((prev) => ({ ...prev, [goalId]: comment }));

  // Save then submit in one gesture: the draft carries the ratings, the
  // submit locks them in. A save failure stops short of submitting.
  const submitRating = () => {
    if (!user || !activeCycle || rated.length === 0) return;
    const overallRating = Math.max(1, Math.min(4, Math.round(overall ?? 1))) as Rating;
    setSubmitting(true);
    router.put(
      `/cycles/${activeCycle.id}/appraisal`,
      {
        subjectId: user.id,
        perGoalRatings: ratings,
        perGoalComments: comments,
        overallRating,
        overallComment: '',
        growthAreas: [],
      },
      {
        onSuccess: () => {
          router.post(
            `/cycles/${activeCycle.id}/appraisal/submit`,
            { subjectId: user.id },
            {
              onSuccess: () => toast('Rating submitted'),
              onError: (errors) =>
                toast(messageFor(errors, 'That rating did not submit.'), 'error'),
              onFinish: () => setSubmitting(false),
            },
          );
        },
        onError: (errors) => {
          toast(messageFor(errors, 'That rating did not save.'), 'error');
          setSubmitting(false);
        },
      },
    );
  };

  return {
    user,
    department,
    cycleYear: activeCycle?.year,
    goals,
    ratings,
    comments,
    overall,
    selfOverall: appraisal?.overallRating ?? null,
    setRating,
    setComment,
    submitRating,
    canSubmit: rated.length > 0 && !!activeCycle,
    submitting,
  };
}

function messageFor(errors: Record<string, string | undefined>, fallback: string): string {
  return Object.values(errors)[0] ?? fallback;
}
