import { useEffect, useMemo, useState } from 'react';
import { useAppraisal, useSaveAppraisal, useSubmitAppraisal } from '@/api/queries/appraisals';
import { useCycles, useGoals } from '@/api/queries/goals';
import { useFeedbackReceived, useFeedbackRequests } from '@/api/queries/feedback';
import { useUsers } from '@/api/queries/org';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import { categoryOrder } from '@/components/ui/accent';
import type { GoalCategory, GrowthArea, Rating, User } from '@/types/domain';

const newGrowthId = () => `gr-${Math.random().toString(36).slice(2, 8)}`;

export type AppraisalPhase = 'intro' | 'goals' | 'growth' | 'overall';

export interface AppraisalSectionData {
  category: GoalCategory;
  weight: number;
  goals: { id: string; title: string }[];
  commentGoalId: string | null;
}

export function useSelfAppraisal() {
  const toast = useToast();
  const cyclesQuery = useCycles();
  const cycle = useMemo(() => {
    const cycles = cyclesQuery.data ?? [];
    return cycles.find((c) => c.state === 'open' || c.state === 'closing') ?? cycles[0];
  }, [cyclesQuery.data]);

  const goalsQuery = useGoals(cycle?.id);
  const appraisalQuery = useAppraisal(cycle?.id);
  const usersQuery = useUsers();
  const receivedQuery = useFeedbackReceived();
  const sentQuery = useFeedbackRequests('sent');

  const saveAppraisal = useSaveAppraisal(cycle?.id ?? '');
  const submitAppraisal = useSubmitAppraisal(cycle?.id ?? '');

  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [overallRating, setOverallRating] = useState<Rating | null>(null);
  const [overallComment, setOverallComment] = useState('');
  const [growthAreas, setGrowthAreas] = useState<GrowthArea[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<AppraisalPhase>('intro');
  const [goalStep, setGoalStep] = useState(0);

  const appraisal = appraisalQuery.data;

  // Seed local state once from the server draft, then edit locally until save.
  useEffect(() => {
    if (appraisal && !hydrated) {
      setRatings(appraisal.perGoalRatings);
      setComments(appraisal.perGoalComments);
      setOverallRating(appraisal.overallRating);
      setOverallComment(appraisal.overallComment);
      setGrowthAreas(appraisal.growthAreas);
      // Resume mid-flow if a draft already exists.
      if (appraisal.submittedAt) setPhase('overall');
      else if (Object.keys(appraisal.perGoalRatings).length > 0) setPhase('goals');
      setHydrated(true);
    }
  }, [appraisal, hydrated]);

  // Self-appraisal is against approved goals only (as the page copy states).
  const goals = useMemo(
    () => (goalsQuery.data ?? []).filter((goal) => goal.status === 'Approved'),
    [goalsQuery.data],
  );
  const sections: AppraisalSectionData[] = categoryOrder.map((category) => {
    const inCategory = goals.filter((goal) => goal.category === category);
    return {
      category,
      weight: cycle?.categoryWeights[category] ?? 0,
      goals: inCategory.map((goal) => ({ id: goal.id, title: goal.title })),
      commentGoalId: inCategory[0]?.id ?? null,
    };
  });

  const flatGoals = useMemo(
    () =>
      sections.flatMap((section) =>
        section.goals.map((goal) => ({
          ...goal,
          category: section.category,
          weight: section.weight,
        })),
      ),
    [sections],
  );

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of usersQuery.data ?? []) map.set(u.id, u);
    return map;
  }, [usersQuery.data]);

  const requestPeerById = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of sentQuery.data ?? []) map.set(req.id, req.peerId);
    return map;
  }, [sentQuery.data]);

  const ratedCount = goals.filter((goal) => ratings[goal.id]).length;
  const submitted = !!appraisal?.submittedAt;
  const currentGoal = flatGoals[goalStep] ?? null;

  const suggested = useMemo(() => {
    let weighted = 0;
    let totalWeight = 0;
    for (const section of sections) {
      for (const goal of section.goals) {
        const rating = ratings[goal.id];
        if (rating) {
          weighted += rating * section.weight;
          totalWeight += section.weight;
        }
      }
    }
    return totalWeight ? (weighted / totalWeight).toFixed(1) : null;
  }, [sections, ratings]);

  const draftBody = () => ({
    perGoalRatings: ratings,
    perGoalComments: comments,
    overallRating,
    overallComment,
    growthAreas,
  });

  const setGoalRating = (goalId: string, rating: Rating) =>
    setRatings((current) => ({ ...current, [goalId]: rating }));

  const setSectionComment = (goalId: string, value: string) =>
    setComments((current) => ({ ...current, [goalId]: value }));

  const addGrowthArea = () =>
    setGrowthAreas((current) => [
      ...current,
      { id: newGrowthId(), area: '', whyItMatters: '', competencies: '' },
    ]);

  const updateGrowthArea = (id: string, field: keyof GrowthArea, value: string) =>
    setGrowthAreas((current) =>
      current.map((area) => (area.id === id ? { ...area, [field]: value } : area)),
    );

  const removeGrowthArea = (id: string) =>
    setGrowthAreas((current) => current.filter((area) => area.id !== id));

  const saveDraft = () =>
    saveAppraisal.mutate(draftBody(), {
      onSuccess: () => toast('Draft saved'),
      onError: (error) => toast(messageFor(error), 'error'),
    });

  const canSubmit = ratedCount === goals.length && goals.length > 0 && overallRating !== null;

  const submit = () => {
    if (!canSubmit) return;
    saveAppraisal.mutate(draftBody(), {
      onSuccess: () =>
        submitAppraisal.mutate(undefined, {
          onSuccess: () => toast('Self appraisal submitted'),
          onError: (error) => toast(messageFor(error), 'error'),
        }),
      onError: (error) => toast(messageFor(error), 'error'),
    });
  };

  const start = () => {
    setGoalStep(0);
    setPhase('goals');
  };

  const nextGoal = () => {
    if (!currentGoal) return;
    if (!ratings[currentGoal.id]) {
      toast('Pick a rating before continuing.', 'error');
      return;
    }
    if (goalStep >= flatGoals.length - 1) {
      setPhase('growth');
      return;
    }
    setGoalStep((step) => step + 1);
  };

  const backGoal = () => {
    if (goalStep === 0) {
      setPhase('intro');
      return;
    }
    setGoalStep((step) => Math.max(0, step - 1));
  };

  const received = receivedQuery.data ?? [];
  const pendingPeers = (sentQuery.data ?? []).filter((r) => r.status === 'pending');

  return {
    isPending:
      cyclesQuery.isPending || goalsQuery.isPending || appraisalQuery.isPending,
    isError: cyclesQuery.isError || goalsQuery.isError || appraisalQuery.isError,
    error: cyclesQuery.error ?? goalsQuery.error ?? appraisalQuery.error,
    refetch: () => {
      goalsQuery.refetch();
      appraisalQuery.refetch();
    },
    cycle,
    sections,
    flatGoals,
    currentGoal,
    phase,
    setPhase,
    goalStep,
    start,
    nextGoal,
    backGoal,
    ratings,
    comments,
    setGoalRating,
    setSectionComment,
    overallRating,
    setOverallRating,
    overallComment,
    setOverallComment,
    growthAreas,
    addGrowthArea,
    updateGrowthArea,
    removeGrowthArea,
    ratedCount,
    totalGoals: goals.length,
    suggested,
    canSubmit,
    saveDraft,
    submit,
    saving: saveAppraisal.isPending,
    submitting: submitAppraisal.isPending,
    submitted,
    usersById,
    received,
    requestPeerById,
    pendingPeers,
  };
}

function messageFor(error: unknown): string {
  return error instanceof ApiError ? error.message : 'That did not save. Try again.';
}
