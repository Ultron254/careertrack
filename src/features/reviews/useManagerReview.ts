import { useMemo, useState } from 'react';
import { useBulkReview, useReviewQueue } from '@/api/queries/reviews';
import { useCycles, useGoals } from '@/api/queries/goals';
import { useDepartments, useUsers } from '@/api/queries/org';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import type { User } from '@/types/domain';

export type ReviewOutcome = 'pending' | 'approved' | 'returned';

export interface QueueRow {
  userId: string;
  user: User | undefined;
  departmentName: string;
  goalCount: number;
  status: string;
  overdue: boolean;
}

export function useManagerReview() {
  const toast = useToast();
  const queueQuery = useReviewQueue();
  const usersQuery = useUsers();
  const departmentsQuery = useDepartments();
  const cyclesQuery = useCycles();

  const cycle = useMemo(() => {
    const cycles = cyclesQuery.data ?? [];
    return cycles.find((c) => c.state === 'open' || c.state === 'closing') ?? cycles[0];
  }, [cyclesQuery.data]);

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of usersQuery.data ?? []) map.set(user.id, user);
    return map;
  }, [usersQuery.data]);

  const departmentName = (departmentId: string | null) =>
    (departmentsQuery.data ?? []).find((d) => d.id === departmentId)?.name ?? '';

  const rows: QueueRow[] = (queueQuery.data ?? []).map((item) => {
    const user = usersById.get(item.userId);
    return {
      userId: item.userId,
      user,
      departmentName: user ? departmentName(user.departmentId) : '',
      goalCount: item.goalCount,
      status: item.status,
      overdue: item.overdue,
    };
  });

  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const resolvedActiveId = activeUserId ?? rows[0]?.userId ?? null;
  const activeRow = rows.find((row) => row.userId === resolvedActiveId);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkComment, setBulkComment] = useState('');
  const [outcome, setOutcome] = useState<ReviewOutcome>('pending');

  const goalsQuery = useGoals(cycle?.id, resolvedActiveId ?? undefined);
  const bulkReview = useBulkReview();

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
    bulkReview.mutate(
      { subjectIds: selectedIds, decision, comment: bulkComment.trim() },
      {
        onSuccess: (result) => {
          toast(
            decision === 'approved'
              ? `${result.affected} goals approved`
              : `${result.affected} goals returned to HR`,
          );
          setSelected({});
          setBulkComment('');
        },
        onError: (error) => toast(messageFor(error), 'error'),
      },
    );
  };

  const decideActive = (decision: 'approved' | 'returned', comment: string) => {
    if (!resolvedActiveId) return;
    bulkReview.mutate(
      { subjectIds: [resolvedActiveId], decision, comment: comment.trim() },
      {
        onSuccess: () => setOutcome(decision),
        onError: (error) => toast(messageFor(error), 'error'),
      },
    );
  };

  return {
    isPending:
      queueQuery.isPending ||
      usersQuery.isPending ||
      departmentsQuery.isPending ||
      cyclesQuery.isPending,
    isError: queueQuery.isError || usersQuery.isError,
    error: queueQuery.error ?? usersQuery.error,
    refetch: () => {
      queueQuery.refetch();
      usersQuery.refetch();
    },
    rows,
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
    bulkPending: bulkReview.isPending,
    goals: goalsQuery.data ?? [],
    goalsPending: goalsQuery.isPending,
    usersById,
    outcome,
    decideActive,
    reset: () => setOutcome('pending'),
  };
}

function messageFor(error: unknown): string {
  return error instanceof ApiError ? error.message : 'That action did not complete. Try again.';
}
