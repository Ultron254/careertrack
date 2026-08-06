import { useMemo, useState } from 'react';
import { useToast } from '@/Components/ui/Toast';
import { router } from '@/Lib/router';
import type { User } from '@/Types/domain';
import type { ManagerReviewProps } from './ManagerReview';

export type ReviewOutcome = 'pending' | 'approved' | 'returned';

export const knownStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Returned'];

export interface QueueRow {
  userId: string;
  user: User | undefined;
  departmentName: string;
  goalCount: number;
  status: string;
  overdue: boolean;
  // Goals still awaiting a decision, so bulk actions can report their reach.
  pendingGoals: number;
}

export function useManagerReview(props: ManagerReviewProps) {
  const toast = useToast();

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of props.users) map.set(user.id, user);
    return map;
  }, [props.users]);

  const allRows = props.queue;

  const statusOptions = useMemo(
    () => ['All', ...Array.from(new Set(allRows.map((row) => row.status)))],
    [allRows],
  );

  const [statusFilter, setStatusFilter] = useState<string>(props.initialStatus);

  const rows =
    statusFilter === 'All' ? allRows : allRows.filter((row) => row.status === statusFilter);

  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const resolvedActiveId = activeUserId ?? rows[0]?.userId ?? null;
  const activeRow = rows.find((row) => row.userId === resolvedActiveId);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkComment, setBulkComment] = useState('');
  const [outcome, setOutcome] = useState<ReviewOutcome>('pending');
  const [bulkPending, setBulkPending] = useState(false);

  const goals = resolvedActiveId ? (props.goalsBySubject[resolvedActiveId] ?? []) : [];

  const selectedIds = rows.filter((row) => selected[row.userId]).map((row) => row.userId);
  const allSelected = rows.length > 0 && rows.every((row) => selected[row.userId]);

  const toggleSelect = (userId: string) =>
    setSelected((current) => ({ ...current, [userId]: !current[userId] }));

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      setSelected(Object.fromEntries(rows.map((row) => [row.userId, true])));
    }
  };

  const openReview = (userId: string) => {
    setActiveUserId(userId);
    setOutcome('pending');
  };

  const runBulk = (decision: 'approved' | 'returned') => {
    if (selectedIds.length === 0) return;
    if (decision === 'returned' && !bulkComment.trim()) {
      toast('Add a shared comment before returning.', 'error');
      return;
    }
    // Counted before the request lands so the toast matches what it touched.
    const affected = rows
      .filter((row) => selected[row.userId])
      .reduce((sum, row) => sum + row.pendingGoals, 0);
    setBulkPending(true);
    router.post(
      '/reviews/bulk',
      { subjectIds: selectedIds, decision, comment: bulkComment.trim() },
      {
        onSuccess: () => {
          toast(
            decision === 'approved'
              ? `${affected} goals approved`
              : `${affected} goals returned to HR`,
          );
          setSelected({});
          setBulkComment('');
        },
        onError: (errors) => toast(messageFor(errors), 'error'),
        onFinish: () => setBulkPending(false),
      },
    );
  };

  const decideActive = (decision: 'approved' | 'returned', comment: string) => {
    if (!resolvedActiveId) return;
    setBulkPending(true);
    router.post(
      '/reviews/bulk',
      { subjectIds: [resolvedActiveId], decision, comment: comment.trim() },
      {
        onSuccess: () => setOutcome(decision),
        onError: (errors) => toast(messageFor(errors), 'error'),
        onFinish: () => setBulkPending(false),
      },
    );
  };

  return {
    rows,
    statusOptions,
    statusFilter,
    setStatusFilter,
    activeRow,
    activeUserId: resolvedActiveId,
    openReview,
    selected,
    selectedCount: selectedIds.length,
    allSelected,
    toggleSelect,
    toggleAll,
    bulkComment,
    setBulkComment,
    runBulk,
    bulkPending,
    goals,
    usersById,
    outcome,
    decideActive,
    reset: () => setOutcome('pending'),
  };
}

function messageFor(errors: Record<string, string | undefined>): string {
  return Object.values(errors)[0] ?? 'That action did not complete. Try again.';
}
