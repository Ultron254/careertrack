import { useEffect, useMemo, useState } from 'react';
import { router } from '@/Lib/router';
import { useToast } from '@/Components/ui/Toast';
import { categoryOrder } from '@/Components/ui/accent';
import type { GoalCategory, GrowthArea, Rating, User } from '@/Types/domain';
import type { SelfAppraisalData } from './Appraisal';

const newGrowthId = () => `gr-${Math.random().toString(36).slice(2, 8)}`;

export interface AppraisalSectionData {
  category: GoalCategory;
  weight: number;
  goals: { id: string; title: string }[];
  commentGoalId: string | null;
}

export function useSelfAppraisal(self: SelfAppraisalData) {
  const toast = useToast();
  const { cycle, appraisal, users, departments, received, sentRequests } = self;

  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [overallRating, setOverallRating] = useState<Rating | null>(null);
  const [overallComment, setOverallComment] = useState('');
  const [growthAreas, setGrowthAreas] = useState<GrowthArea[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Seed local state once from the persisted draft, then edit locally until save.
  useEffect(() => {
    if (appraisal && !hydrated) {
      setRatings(appraisal.perGoalRatings);
      setComments(appraisal.perGoalComments);
      setOverallRating(appraisal.overallRating);
      setOverallComment(appraisal.overallComment);
      setGrowthAreas(appraisal.growthAreas);
      setHydrated(true);
    }
  }, [appraisal, hydrated]);

  // Self-appraisal is against approved goals only (as the page copy states).
  const goals = useMemo(
    () => self.goals.filter((goal) => goal.status === 'Approved'),
    [self.goals],
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
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const requestPeerById = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of sentRequests) map.set(req.id, req.peerId);
    return map;
  }, [sentRequests]);

  const ratedCount = goals.filter((goal) => ratings[goal.id]).length;
  const submitted = !!appraisal?.submittedAt;

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

  const saveDraft = () => {
    if (!cycle) return;
    setSaving(true);
    void router.put(`/cycles/${cycle.id}/appraisal`, draftBody(), {
      onSuccess: () => toast('Draft saved'),
      onError: (errors) => toast(messageFor(errors), 'error'),
      onFinish: () => setSaving(false),
    });
  };

  const canSubmit = ratedCount === goals.length && goals.length > 0 && overallRating !== null;

  const submit = () => {
    if (!canSubmit || !cycle) return;
    setSubmitting(true);
    void router.put(`/cycles/${cycle.id}/appraisal`, draftBody(), {
      onSuccess: () =>
        void router.post(
          `/cycles/${cycle.id}/appraisal/submit`,
          {},
          {
            onSuccess: () => toast('Self appraisal submitted'),
            onError: (errors) => toast(messageFor(errors), 'error'),
            onFinish: () => setSubmitting(false),
          },
        ),
      onError: (errors) => {
        toast(messageFor(errors), 'error');
        setSubmitting(false);
      },
    });
  };

  const pendingPeers = sentRequests.filter((r) => r.status === 'pending');

  return {
    cycle,
    sections,
    flatGoals,
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
    saving,
    submitting,
    submitted,
    usersById,
    departments,
    received,
    requestPeerById,
    pendingPeers,
  };
}

function messageFor(errors: Record<string, string | undefined>): string {
  return Object.values(errors).find(Boolean) ?? 'That did not save. Try again.';
}
