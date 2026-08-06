import { useMemo, useState } from 'react';
import { router } from '@/Lib/router';
import { useAuth } from '@/Context/AuthContext';
import { useToast } from '@/Components/ui/Toast';
import type { Role } from '@/Types/domain';
import type { ReportScope } from '@/Types/report';
import type { ReportsProps } from './Reports';

interface ScopeOption {
  scope: ReportScope;
  label: string;
  note: string;
  needsSubject?: boolean;
  // Whether the subject to pick is a person or a whole department.
  subjectKind?: 'person' | 'department';
}

// Which report scopes each role can reach, and the note shown under the selector.
const scopesByRole: Record<Role, ScopeOption[]> = {
  employee: [
    { scope: 'me', label: 'My report', note: 'You are viewing your own individual report.' },
  ],
  manager: [
    { scope: 'me', label: 'My report', note: 'You are viewing your own individual report.' },
    {
      scope: 'member',
      label: 'A team member',
      note: 'Individual report for a selected team member.',
      needsSubject: true,
    },
    { scope: 'team', label: 'Whole team', note: 'Aggregated report across your whole team.' },
  ],
  people_team: [
    { scope: 'me', label: 'My report', note: 'You are viewing your own individual report.' },
    {
      scope: 'employee',
      label: 'An employee',
      note: 'Individual report for any employee.',
      needsSubject: true,
      subjectKind: 'person',
    },
    {
      scope: 'dept',
      label: 'A department',
      note: 'Department level report across all its members.',
      needsSubject: true,
      subjectKind: 'department',
    },
    {
      scope: 'org',
      label: 'Whole organisation',
      note: 'Organisation wide report. Individuals appear only in aggregate.',
    },
  ],
  admin: [
    {
      scope: 'org',
      label: 'Whole organisation',
      note: 'Organisation wide report. Individuals appear only in aggregate.',
    },
    {
      scope: 'dept',
      label: 'A department',
      note: 'Department level report across all its members.',
      needsSubject: true,
      subjectKind: 'department',
    },
  ],
};

export const savedViews = [
  { id: 'all', label: 'All departments', accent: 'var(--teal)' },
  { id: 'low', label: 'Below target', accent: 'var(--orange)' },
  { id: 'exec', label: 'Exec summary', accent: 'var(--blue)' },
];

export const exportFormats = [
  { format: 'pdf', tag: 'PDF', name: 'PDF document', desc: 'Formatted, print ready' },
  { format: 'xlsx', tag: 'XLS', name: 'Excel spreadsheet', desc: 'Raw data and pivots' },
  { format: 'csv', tag: 'CSV', name: 'CSV file', desc: 'Universal data export' },
  { format: 'pptx', tag: 'PPT', name: 'PowerPoint deck', desc: 'Exec ready slides' },
] as const;

export function useReports({ report, schedule, departments, users }: ReportsProps) {
  const toast = useToast();
  const { role } = useAuth();
  const scopeOptions = scopesByRole[role];

  const [scope, setScope] = useState<ReportScope>(scopeOptions[0].scope);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [savedView, setSavedView] = useState('all');
  // A regeneration is a visible beat while fresh insight copy is produced;
  // the text itself is part of the report payload.
  const [regenerating, setRegenerating] = useState(false);

  const activeScope = scopeOptions.find((s) => s.scope === scope) ?? scopeOptions[0];

  const subjectKind = activeScope.subjectKind ?? 'person';
  const subjectChoices = useMemo(
    () => (subjectKind === 'department' ? departments : users),
    [subjectKind, departments, users],
  );

  // Picking a new scope drops any subject held for the previous one, so we
  // never send a person id to a department report or vice versa.
  const changeScope = (next: ReportScope) => {
    setScope(next);
    setSubjectId(undefined);
  };

  const runExport = (format: (typeof exportFormats)[number]['format']) => {
    router.post(
      '/reports/export',
      { format, scope: activeScope.scope },
      {
        onSuccess: () => toast(`Report exported as ${format.toUpperCase()}`),
        onError: (errors) =>
          toast(Object.values(errors)[0] ?? 'That export did not run. Try again.', 'error'),
      },
    );
  };

  const setFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    router.put(
      '/reports/schedule',
      { frequency, enabled: schedule.enabled },
      {
        onError: () => toast('Schedule did not save.', 'error'),
      },
    );
  };

  const toggleSchedule = () => {
    const enabled = !schedule.enabled;
    router.put(
      '/reports/schedule',
      { frequency: schedule.frequency, enabled },
      {
        onSuccess: () => toast(enabled ? 'Scheduled export on' : 'Scheduled export off'),
        onError: () => toast('Schedule did not save.', 'error'),
      },
    );
  };

  const regenerate = () => {
    setRegenerating(true);
    window.setTimeout(() => setRegenerating(false), 400);
  };

  return {
    role,
    scopeOptions,
    scope: activeScope.scope,
    scopeNote: activeScope.note,
    needsSubject: !!activeScope.needsSubject,
    subjectKind,
    setScope: changeScope,
    subjectId,
    setSubjectId,
    subjectChoices,
    savedView,
    setSavedView,
    report,
    runExport,
    schedule,
    setFrequency,
    toggleSchedule,
    regenerate,
    regenerating,
  };
}
