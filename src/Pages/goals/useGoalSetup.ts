import { useMemo, useState } from 'react';
import { useToast } from '@/Components/ui/Toast';
import { useForm } from '@/Hooks/useForm';
import { router } from '@/Lib/router';
import type { Goal, GoalCategory } from '@/Types/domain';
import { categoryOrder } from './goalCopy';
import { checkSubmittable } from './weightRules';
import type { GoalSetupProps } from './GoalSetup';

export type GoalForm = {
  title: string;
  description: string;
  outcomes: string;
  weight: string;
  targetDate: string;
  isStretch: boolean;
};

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

export function useGoalSetup({ activeCycle, goals }: GoalSetupProps) {
  const toast = useToast();

  const cycleId = activeCycle?.id ?? '';
  const defaultTarget = activeCycle ? activeCycle.closesAt.slice(0, 10) : '';

  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const goalForm = useForm<GoalForm>(blankForm(defaultTarget));
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentCategory: GoalCategory | null = step < REVIEW_STEP ? categoryOrder[step] : null;

  const goalsByCategory = useMemo(() => {
    const map = {} as Record<GoalCategory, Goal[]>;
    for (const category of categoryOrder) {
      map[category] = goals.filter((goal) => goal.category === category);
    }
    return map;
  }, [goals]);

  const check = checkSubmittable(goals);

  const resetForm = () => {
    goalForm.setData(blankForm(defaultTarget));
    setEditingId(null);
  };

  const goToStep = (index: number) => {
    setStep(index);
    resetForm();
  };

  const setField = <K extends keyof GoalForm>(key: K, value: GoalForm[K]) =>
    goalForm.setData(key, value);

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id);
    goalForm.setData({
      title: goal.title,
      description: goal.description,
      outcomes: goal.outcomes,
      weight: String(goal.weight),
      targetDate: goal.targetDate,
      isStretch: goal.isStretch,
    });
  };

  const saveGoal = () => {
    const form = goalForm.data;
    if (!currentCategory || !form.title.trim()) return;
    goalForm.transform((data) => ({
      cycleId,
      category: currentCategory,
      title: data.title.trim(),
      description: data.description.trim(),
      outcomes: data.outcomes.trim(),
      weight: Number(data.weight) || 0,
      targetDate: data.targetDate || defaultTarget,
      isStretch: data.isStretch,
      privateNote: null,
    }));

    const options = {
      onSuccess: () => {
        toast(editingId ? 'Goal updated' : 'Goal added');
        resetForm();
      },
      onError: (errors: Record<string, string | undefined>) => toast(messageFor(errors), 'error'),
    };
    if (editingId) {
      goalForm.patch(`/goals/${editingId}`, options);
    } else {
      goalForm.post(`/cycles/${cycleId}/goals`, options);
    }
  };

  const removeGoal = (goal: Goal) => {
    router.delete(`/goals/${goal.id}`, {
      onSuccess: () => toast('Goal deleted'),
      onError: (errors) => toast(messageFor(errors), 'error'),
    });
    if (editingId === goal.id) resetForm();
  };

  const setProgress = (goal: Goal, progress: number) =>
    void router.patch(`/goals/${goal.id}`, { progress });

  const saveNote = (goal: Goal, privateNote: string) =>
    void router.patch(`/goals/${goal.id}`, { privateNote });

  const toggleNote = (goalId: string) =>
    setOpenNotes((current) => ({ ...current, [goalId]: !current[goalId] }));

  const saveDraft = () => toast('Draft saved');

  const submit = () => {
    setSubmitting(true);
    router.post(
      `/cycles/${cycleId}/goals/submit`,
      {},
      {
        onSuccess: () => {
          setSubmitted(true);
          toast('Goals submitted');
        },
        onError: (errors) => toast(messageFor(errors), 'error'),
        onFinish: () => setSubmitting(false),
      },
    );
  };

  return {
    activeCycle,
    step,
    setStep: goToStep,
    next: () => goToStep(Math.min(REVIEW_STEP, step + 1)),
    prev: () => goToStep(Math.max(0, step - 1)),
    currentCategory,
    goalsByCategory,
    goals,
    check,
    form: goalForm.data,
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
    submitting,
    submitted,
    reviewSubmission: () => setSubmitted(false),
    saving: goalForm.processing,
  };
}

function messageFor(errors: Record<string, string | undefined>): string {
  return Object.values(errors)[0] ?? 'That did not save. Try again.';
}
