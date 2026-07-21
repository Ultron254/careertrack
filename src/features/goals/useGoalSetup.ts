import { useMemo, useState } from 'react';
import { useCreateGoal, useDeleteGoal, useGoals, useSubmitGoals, useUpdateGoal } from '@/api/queries/goals';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import type { Goal, GoalCategory } from '@/types/domain';
import { categoryOrder } from './goalCopy';
import { checkSubmittable } from './weightRules';
import { useActiveCycle } from './useActiveCycle';

export interface GoalForm {
  title: string;
  description: string;
  outcomes: string;
  weight: string;
  targetDate: string;
  isStretch: boolean;
}

const blankForm = (targetDate: string): GoalForm => ({
  title: '',
  description: '',
  outcomes: '',
  weight: '',
  targetDate,
  isStretch: false,
});

// Total steps: one per category, then the review step at index 4.
export const REVIEW_STEP = categoryOrder.length;

export function useGoalSetup() {
  const toast = useToast();
  const { activeCycle, isPending: cyclePending } = useActiveCycle();
  const goalsQuery = useGoals(activeCycle?.id);

  const cycleId = activeCycle?.id ?? '';
  const defaultTarget = activeCycle ? activeCycle.closesAt.slice(0, 10) : '';

  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalForm>(() => blankForm(defaultTarget));
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const createGoal = useCreateGoal(cycleId);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const submitGoals = useSubmitGoals(cycleId);

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const currentCategory: GoalCategory | null =
    step < REVIEW_STEP ? categoryOrder[step] : null;

  const goalsByCategory = useMemo(() => {
    const map = {} as Record<GoalCategory, Goal[]>;
    for (const category of categoryOrder) {
      map[category] = goals.filter((goal) => goal.category === category);
    }
    return map;
  }, [goals]);

  const check = checkSubmittable(goals);

  const resetForm = () => {
    setForm(blankForm(defaultTarget));
    setEditingId(null);
  };

  const goToStep = (index: number) => {
    setStep(index);
    resetForm();
  };

  const setField = <K extends keyof GoalForm>(key: K, value: GoalForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      description: goal.description,
      outcomes: goal.outcomes,
      weight: String(goal.weight),
      targetDate: goal.targetDate,
      isStretch: goal.isStretch,
    });
  };

  const saveGoal = () => {
    if (!currentCategory || !form.title.trim()) return;
    const payload = {
      cycleId,
      category: currentCategory,
      title: form.title.trim(),
      description: form.description.trim(),
      outcomes: form.outcomes.trim(),
      weight: Number(form.weight) || 0,
      targetDate: form.targetDate || defaultTarget,
      isStretch: form.isStretch,
      privateNote: null,
    };

    if (editingId) {
      updateGoal.mutate(
        { goalId: editingId, changes: payload },
        {
          onSuccess: () => {
            toast('Goal updated');
            resetForm();
          },
          onError: (error) => toast(messageFor(error), 'error'),
        },
      );
    } else {
      createGoal.mutate(payload, {
        onSuccess: () => {
          toast('Goal added');
          resetForm();
        },
        onError: (error) => toast(messageFor(error), 'error'),
      });
    }
  };

  const removeGoal = (goal: Goal) => {
    deleteGoal.mutate(goal.id, {
      onSuccess: () => toast('Goal deleted'),
      onError: (error) => toast(messageFor(error), 'error'),
    });
    if (editingId === goal.id) resetForm();
  };

  const setProgress = (goal: Goal, progress: number) =>
    updateGoal.mutate({ goalId: goal.id, changes: { progress } });

  const saveNote = (goal: Goal, privateNote: string) =>
    updateGoal.mutate({ goalId: goal.id, changes: { privateNote } });

  const toggleNote = (goalId: string) =>
    setOpenNotes((current) => ({ ...current, [goalId]: !current[goalId] }));

  const saveDraft = () => toast('Draft saved');

  const submit = () => {
    submitGoals.mutate(undefined, {
      onSuccess: () => {
        setSubmitted(true);
        toast('Goals submitted');
      },
      onError: (error) => toast(messageFor(error), 'error'),
    });
  };

  return {
    activeCycle,
    isPending: cyclePending || goalsQuery.isPending,
    isError: goalsQuery.isError,
    error: goalsQuery.error,
    refetch: goalsQuery.refetch,
    step,
    setStep: goToStep,
    next: () => goToStep(Math.min(REVIEW_STEP, step + 1)),
    prev: () => goToStep(Math.max(0, step - 1)),
    currentCategory,
    goalsByCategory,
    goals,
    check,
    form,
    setField,
    editingId,
    startEdit,
    saveGoal,
    removeGoal,
    cancelEdit: resetForm,
    setProgress,
    openNotes,
    toggleNote,
    saveNote,
    saveDraft,
    submit,
    submitting: submitGoals.isPending,
    submitted,
    reviewSubmission: () => setSubmitted(false),
    saving: createGoal.isPending || updateGoal.isPending,
  };
}

function messageFor(error: unknown): string {
  return error instanceof ApiError ? error.message : 'That did not save. Try again.';
}
