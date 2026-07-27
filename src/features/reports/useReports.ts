import { useMemo, useState } from 'react';
import {
  useExportReport,
  useReport,
  useReportSchedule,
  useSaveReportSchedule,
} from '@/api/queries/insights';
import { useDepartments, useUsers } from '@/api/queries/org';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/authProvider';
import { useToast } from '@/components/ui/Toast';
import type { Role } from '@/types/domain';
import type { ReportScope } from '@/api/schemas/report';

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
  employee: [{ scope: 'me', label: 'My report', note: 'You are viewing your own individual report.' }],
  manager: [
    { scope: 'me', label: 'My report', note: 'You are viewing your own individual report.' },
    { scope: 'member', label: 'A team member', note: 'Individual report for a selected team member.', needsSubject: true },
    { scope: 'team', label: 'Whole team', note: 'Aggregated report across your whole team.' },
  ],
  people_team: [
    { scope: 'me', label: 'My report', note: 'You are viewing your own individual report.' },
    { scope: 'employee', label: 'An employee', note: 'Individual report for any employee.', needsSubject: true, subjectKind: 'person' },
    { scope: 'dept', label: 'A department', note: 'Department level report across all its members.', needsSubject: true, subjectKind: 'department' },
    { scope: 'org', label: 'Whole organisation', note: 'Organisation wide report. Individuals appear only in aggregate.' },
  ],
  admin: [
    { scope: 'org', label: 'Whole organisation', note: 'Organisation wide report. Individuals appear only in aggregate.' },
    { scope: 'dept', label: 'A department', note: 'Department level report across all its members.', needsSubject: true, subjectKind: 'department' },
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

export function useReports() {
  const toast = useToast();
  const { role } = useAuth();
  const scopeOptions = scopesByRole[role];

  const [scope, setScope] = useState<ReportScope>(scopeOptions[0].scope);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [savedView, setSavedView] = useState('all');

  const activeScope = scopeOptions.find((s) => s.scope === scope) ?? scopeOptions[0];
  const reportQuery = useReport(activeScope.scope, activeScope.needsSubject ? subjectId : undefined);
  const usersQuery = useUsers();
  const departmentsQuery = useDepartments();

  const exportReport = useExportReport();
  const scheduleQuery = useReportSchedule();
  const saveSchedule = useSaveReportSchedule();

  const subjectKind = activeScope.subjectKind ?? 'person';
  const subjectChoices = useMemo(
    () => (subjectKind === 'department' ? departmentsQuery.data ?? [] : usersQuery.data ?? []),
    [subjectKind, departmentsQuery.data, usersQuery.data],
  );

  // Picking a new scope drops any subject held for the previous one, so we
  // never send a person id to a department report or vice versa.
  const changeScope = (next: ReportScope) => {
    setScope(next);
    setSubjectId(undefined);
  };

  const runExport = (format: (typeof exportFormats)[number]['format']) => {
    exportReport.mutate(
      { format, scope: activeScope.scope },
      {
        onSuccess: (result) => toast(`Report exported as ${result.format.toUpperCase()}`),
        onError: (error) =>
          toast(
            error instanceof ApiError ? error.message : 'That export did not run. Try again.',
            'error',
          ),
      },
    );
  };

  const setFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    const enabled = scheduleQuery.data?.enabled ?? true;
    saveSchedule.mutate({ frequency, enabled }, { onError: () => toast('Schedule did not save.', 'error') });
  };

  const toggleSchedule = () => {
    const current = scheduleQuery.data;
    saveSchedule.mutate(
      { frequency: current?.frequency ?? 'weekly', enabled: !(current?.enabled ?? false) },
      {
        onSuccess: (next) => toast(next.enabled ? 'Scheduled export on' : 'Scheduled export off'),
        onError: () => toast('Schedule did not save.', 'error'),
      },
    );
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
    report: reportQuery.data,
    isPending: reportQuery.isPending,
    isFetching: reportQuery.isFetching,
    isError: reportQuery.isError,
    error: reportQuery.error,
    refetch: reportQuery.refetch,
    runExport,
    exporting: exportReport.isPending,
    schedule: scheduleQuery.data,
    setFrequency,
    toggleSchedule,
  };
}
