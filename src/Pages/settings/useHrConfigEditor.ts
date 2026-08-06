import { useState } from 'react';
import { router } from '@/Lib/router';
import { useToast } from '@/Components/ui/Toast';
import type { HrConfig } from '@/Types/hrConfig';
import type { GoalCategory, ReviewStage } from '@/Types/domain';
import type { AdHocCondition, EscalationRule, ReminderOffset } from '@/Types/hrConfig';

// The whole configuration is edited as one local draft and saved in a single
// write — weights, stages and phases only make sense together.
export function useHrConfigEditor(config: HrConfig) {
  const toast = useToast();
  const [draft, setDraft] = useState<HrConfig>(config);
  const [saving, setSaving] = useState(false);

  const totalWeightPct = draft.categories
    .filter((c) => c.enabled)
    .reduce((sum, c) => sum + c.defaultWeightPct, 0);

  const setCategoryWeight = (category: GoalCategory, weight: number) =>
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.category === category ? { ...c, defaultWeightPct: weight } : c,
      ),
    }));

  const toggleCategory = (category: GoalCategory) =>
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.category === category ? { ...c, enabled: !c.enabled } : c,
      ),
    }));

  const toggleReviewStage = (stage: ReviewStage) =>
    setDraft((prev) => ({
      ...prev,
      reviewStages: prev.reviewStages.map((s) =>
        s.stage === stage && !s.locked ? { ...s, enabled: !s.enabled } : s,
      ),
    }));

  const toggleReminder = (offset: ReminderOffset) =>
    setDraft((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.offset === offset ? { ...r, enabled: !r.enabled } : r,
      ),
    }));

  const toggleEscalation = (rule: EscalationRule) =>
    setDraft((prev) => ({
      ...prev,
      escalations: prev.escalations.map((e) =>
        e.rule === rule ? { ...e, enabled: !e.enabled } : e,
      ),
    }));

  const toggleAdHoc = () =>
    setDraft((prev) => ({
      ...prev,
      adHocGoals: { ...prev.adHocGoals, enabled: !prev.adHocGoals.enabled },
    }));

  const toggleAdHocCondition = (condition: AdHocCondition) =>
    setDraft((prev) => ({
      ...prev,
      adHocGoals: {
        ...prev.adHocGoals,
        conditions: prev.adHocGoals.conditions.map((c) =>
          c.condition === condition ? { ...c, enabled: !c.enabled } : c,
        ),
      },
    }));

  const setPhaseDate = (index: number, field: 'startsOn' | 'endsOn', value: string) =>
    setDraft((prev) => ({
      ...prev,
      cyclePhases: prev.cyclePhases.map((phase, i) =>
        i === index ? { ...phase, [field]: value } : phase,
      ),
    }));

  const save = () => {
    if (totalWeightPct !== 100) {
      toast('Category weights must total 100 percent before saving.', 'error');
      return;
    }
    setSaving(true);
    router.put(
      '/hr-config',
      { ...draft },
      {
        onSuccess: () => toast('Configuration saved'),
        onError: (errors) =>
          toast(Object.values(errors)[0] ?? 'That change did not save.', 'error'),
        onFinish: () => setSaving(false),
      },
    );
  };

  return {
    draft,
    totalWeightPct,
    setCategoryWeight,
    toggleCategory,
    toggleReviewStage,
    toggleReminder,
    toggleEscalation,
    toggleAdHoc,
    toggleAdHocCondition,
    setPhaseDate,
    save,
    saving,
  };
}
