import { useMemo, useState } from 'react';
import { useUser, useDepartments } from '@/api/queries/org';
import { useCycles, useGoals } from '@/api/queries/goals';
import { useAppraisal, useSaveAppraisal, useSubmitAppraisal } from '@/api/queries/appraisals';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import type { Cycle, Rating } from '@/types/domain';

function pickActiveCycle(cycles: Cycle[]): Cycle | undefined {
  const live = cycles.find((c) => c.state === 'open' || c.state === 'closing');
  return live ?? [...cycles].sort((a, b) => b.year - a.year)[0];
}

export function useEmployeeProfile(userId: string) {
  const toast = useToast();
  const userQuery = useUser(userId);
  const departmentsQuery = useDepartments();
  const cyclesQuery = useCycles();

  const activeCycle = cyclesQuery.data ? pickActiveCycle(cyclesQuery.data) : undefined;
  const goalsQuery = useGoals(activeCycle?.id, userId);

  // The subject's own self-appraisal — gives the reviewer the self-rating for context.
  const appraisalQuery = useAppraisal(activeCycle?.id, userId);

  const saveAppraisal = useSaveAppraisal(activeCycle?.id ?? '', userId);
  const submitAppraisal = useSubmitAppraisal(activeCycle?.id ?? '', userId);

  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const department = departmentsQuery.data?.find((d) => d.id === userQuery.data?.departmentId);

  const rated = Object.values(ratings);
  const overall = rated.length
    ? Math.round((rated.reduce((sum, value) => sum + value, 0) / rated.length) * 10) / 10
    : null;

  const setRating = (goalId: string, rating: Rating) =>
    setRatings((prev) => ({ ...prev, [goalId]: rating }));
  const setComment = (goalId: string, comment: string) =>
    setComments((prev) => ({ ...prev, [goalId]: comment }));

  const submitRating = () => {
    if (!activeCycle || rated.length === 0) return;
    const overallRating = Math.max(1, Math.min(4, Math.round(overall ?? 1))) as Rating;
    saveAppraisal.mutate(
      {
        perGoalRatings: ratings,
        perGoalComments: comments,
        overallRating,
        overallComment: '',
        growthAreas: [],
      },
      {
        onSuccess: () =>
          submitAppraisal.mutate(undefined, {
            onSuccess: () => toast('Rating submitted'),
            onError: (submitError) =>
              toast(
                submitError instanceof ApiError ? submitError.message : 'That rating did not submit.',
                'error',
              ),
          }),
        onError: (saveError) =>
          toast(saveError instanceof ApiError ? saveError.message : 'That rating did not save.', 'error'),
      },
    );
  };

  return {
    user: userQuery.data,
    department,
    cycleYear: activeCycle?.year,
    goals,
    ratings,
    comments,
    overall,
    selfOverall: appraisalQuery.data?.overallRating ?? null,
    setRating,
    setComment,
    submitRating,
    canSubmit: rated.length > 0 && !!activeCycle,
    submitting: saveAppraisal.isPending || submitAppraisal.isPending,
    isPending: userQuery.isPending || cyclesQuery.isPending || goalsQuery.isPending,
    isError: userQuery.isError || goalsQuery.isError,
    error: userQuery.error ?? goalsQuery.error,
    refetch: () => {
      void userQuery.refetch();
      void goalsQuery.refetch();
    },
  };
}
