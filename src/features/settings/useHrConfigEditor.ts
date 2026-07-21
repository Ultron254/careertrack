import { useEffect, useState } from 'react';
import { useHrConfig, useSaveHrConfig } from '@/api/queries/hrConfig';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import type { HrConfig } from '@/api/schemas/hrConfig';
import type { GoalCategory, ReviewStage } from '@/types/domain';
import type { AdHocCondition, EscalationRule, ReminderOffset } from '@/api/schemas/hrConfig';

export function useHrConfigEditor() {
  const toast = useToast();
  const query = useHrConfig();
  const saveConfig = useSaveHrConfig();
  const [draft, setDraft] = useState<HrConfig | null>(null);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  const totalWeightPct = draft
    ? draft.categories.filter((c) => c.enabled).reduce((sum, c) => sum + c.defaultWeightPct, 0)
    : 0;

  const setCategoryWeight = (category: GoalCategory, weight: number) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            categories: prev.categories.map((c) =>
              c.category === category ? { ...c, defaultWeightPct: weight } : c,
            ),
          }
        : prev,
    );

  const toggleCategory = (category: GoalCategory) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            categories: prev.categories.map((c) =>
              c.category === category ? { ...c, enabled: !c.enabled } : c,
            ),
          }
        : prev,
    );

  const toggleReviewStage = (stage: ReviewStage) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            reviewStages: prev.reviewStages.map((s) =>
              s.stage === stage && !s.locked ? { ...s, enabled: !s.enabled } : s,
            ),
          }
        : prev,
    );

  const toggleReminder = (offset: ReminderOffset) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            reminders: prev.reminders.map((r) =>
              r.offset === offset ? { ...r, enabled: !r.enabled } : r,
            ),
          }
        : prev,
    );

  const toggleEscalation = (rule: EscalationRule) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            escalations: prev.escalations.map((e) =>
              e.rule === rule ? { ...e, enabled: !e.enabled } : e,
            ),
          }
        : prev,
    );

  const toggleAdHoc = () =>
    setDraft((prev) =>
      prev ? { ...prev, adHocGoals: { ...prev.adHocGoals, enabled: !prev.adHocGoals.enabled } } : prev,
    );

  const toggleAdHocCondition = (condition: AdHocCondition) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            adHocGoals: {
              ...prev.adHocGoals,
              conditions: prev.adHocGoals.conditions.map((c) =>
                c.condition === condition ? { ...c, enabled: !c.enabled } : c,
              ),
            },
          }
        : prev,
    );

  const setPhaseDate = (index: number, field: 'startsOn' | 'endsOn', value: string) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            cyclePhases: prev.cyclePhases.map((phase, i) =>
              i === index ? { ...phase, [field]: value } : phase,
            ),
          }
        : prev,
    );

  const save = () => {
    if (!draft) return;
    if (totalWeightPct !== 100) {
      toast('Category weights must total 100 percent before saving.', 'error');
      return;
    }
    saveConfig.mutate(draft, {
      onSuccess: () => toast('Configuration saved'),
      onError: (error) =>
        toast(error instanceof ApiError ? error.message : 'That change did not save.', 'error'),
    });
  };

  return {
    draft,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
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
    saving: saveConfig.isPending,
  };
}
