import { useMemo, useState } from 'react';
import {
  useFeedbackReceived,
  useFeedbackRequests,
  useRespondToFeedback,
  useSendFeedbackRequests,
} from '@/api/queries/feedback';
import { useUsers } from '@/api/queries/org';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/authProvider';
import { useToast } from '@/components/ui/Toast';
import type { Rating, User } from '@/types/domain';

export type FeedbackTab = 'inbox' | 'sent' | 'received';
export type FeedbackTemplate = 'full' | 'quick' | 'project';

export const templateNames: Record<FeedbackTemplate, string> = {
  full: 'Full review',
  quick: 'Quick note',
  project: 'Project specific',
};

export const templateOptions: { id: FeedbackTemplate; name: string; desc: string }[] = [
  { id: 'full', name: 'Full review', desc: 'Strengths, growth areas and an overall rating' },
  { id: 'quick', name: 'Quick note', desc: 'Just strengths and one growth area' },
  { id: 'project', name: 'Project specific', desc: 'Feedback on a particular piece of work' },
];

export interface ComposerState {
  peerIds: string[];
  template: FeedbackTemplate;
  message: string;
  dueDate: string;
  includesRating: boolean;
}

const emptyComposer: ComposerState = {
  peerIds: [],
  template: 'full',
  message: '',
  dueDate: '',
  includesRating: true,
};

export function useFeedback() {
  const toast = useToast();
  const { user } = useAuth();
  const inboxQuery = useFeedbackRequests('inbox');
  const sentQuery = useFeedbackRequests('sent');
  const receivedQuery = useFeedbackReceived();
  const usersQuery = useUsers();

  const sendRequests = useSendFeedbackRequests();
  const respond = useRespondToFeedback();

  const [tab, setTab] = useState<FeedbackTab>('inbox');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState<ComposerState>(emptyComposer);
  const [respondId, setRespondId] = useState<string | null>(null);

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of usersQuery.data ?? []) map.set(u.id, u);
    return map;
  }, [usersQuery.data]);

  const peers = (usersQuery.data ?? []).filter((u) => u.id !== user?.id);

  const inbox = inboxQuery.data ?? [];
  const sent = useMemo(() => sentQuery.data ?? [], [sentQuery.data]);
  const received = receivedQuery.data ?? [];

  // Received responses join back to the request to reveal who wrote them.
  const requestPeerById = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of sent) map.set(req.id, req.peerId);
    return map;
  }, [sent]);

  const respondRequest = respondId ? inbox.find((r) => r.id === respondId) ?? null : null;

  const toggleComposerPeer = (peerId: string) =>
    setComposer((c) => ({
      ...c,
      peerIds: c.peerIds.includes(peerId)
        ? c.peerIds.filter((id) => id !== peerId)
        : [...c.peerIds, peerId],
    }));

  const setComposerField = <K extends keyof ComposerState>(key: K, value: ComposerState[K]) =>
    setComposer((c) => ({ ...c, [key]: value }));

  const openComposer = () => {
    setComposer(emptyComposer);
    setComposerOpen(true);
  };

  const send = () => {
    if (composer.peerIds.length === 0) return;
    sendRequests.mutate(
      {
        peerIds: composer.peerIds,
        template: composer.template,
        message: composer.message.trim(),
        dueDate: composer.dueDate || null,
        includesRating: composer.includesRating,
      },
      {
        onSuccess: (created) => {
          toast(`Feedback requested from ${created.length} ${created.length > 1 ? 'people' : 'person'}`);
          setComposerOpen(false);
          setComposer(emptyComposer);
          setTab('sent');
        },
        onError: (error) => toast(messageFor(error), 'error'),
      },
    );
  };

  const submitResponse = (body: { strengths: string; growthAreas: string; rating: Rating | null }) => {
    if (!respondId || !body.strengths.trim()) return;
    respond.mutate(
      { requestId: respondId, ...body },
      {
        onSuccess: () => {
          toast('Feedback sent');
          setRespondId(null);
        },
        onError: (error) => toast(messageFor(error), 'error'),
      },
    );
  };

  return {
    isPending: inboxQuery.isPending || sentQuery.isPending || usersQuery.isPending,
    isError: inboxQuery.isError || usersQuery.isError,
    error: inboxQuery.error ?? usersQuery.error,
    refetch: () => {
      inboxQuery.refetch();
      sentQuery.refetch();
      receivedQuery.refetch();
    },
    tab,
    setTab,
    usersById,
    peers,
    inbox,
    sent,
    received,
    receivedPending: receivedQuery.isPending,
    requestPeerById,
    composerOpen,
    openComposer,
    closeComposer: () => setComposerOpen(false),
    composer,
    toggleComposerPeer,
    setComposerField,
    send,
    sending: sendRequests.isPending,
    respondId,
    respondRequest,
    openRespond: setRespondId,
    closeRespond: () => setRespondId(null),
    submitResponse,
    responding: respond.isPending,
  };
}

function messageFor(error: unknown): string {
  return error instanceof ApiError ? error.message : 'That did not send. Try again.';
}
