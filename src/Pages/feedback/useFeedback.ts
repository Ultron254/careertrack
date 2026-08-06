import { useMemo, useState } from 'react';
import { useForm } from '@/Hooks/useForm';
import { usePage } from '@/Context/SharedPropsContext';
import { useToast } from '@/Components/ui/Toast';
import type { FeedbackTemplate, User } from '@/Types/domain';
import type { PeerFeedbackProps } from './PeerFeedback';

export type FeedbackTab = 'inbox' | 'sent' | 'received';
export type { FeedbackTemplate };

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

const emptyComposer = {
  peerIds: [] as string[],
  template: 'full' as FeedbackTemplate,
  message: '',
  dueDate: '',
  includesRating: true,
};

// Validation errors come back one message per field; the first one is the
// story worth telling in a toast.
export const messageFor = (errors: Record<string, string | undefined>): string =>
  Object.values(errors)[0] ?? 'That did not send. Try again.';

export function useFeedback({ inbox, sent, received, users }: PeerFeedbackProps) {
  const toast = useToast();
  const { props } = usePage();
  const me = props.auth.user;

  const [tab, setTab] = useState<FeedbackTab>('inbox');
  const [composerOpen, setComposerOpen] = useState(false);
  const [respondId, setRespondId] = useState<string | null>(null);

  const form = useForm(emptyComposer);

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const peers = users.filter((u) => u.id !== me?.id);

  // Received responses join back to the request to reveal who wrote them.
  const requestPeerById = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of sent) map.set(req.id, req.peerId);
    return map;
  }, [sent]);

  const respondRequest = respondId ? (inbox.find((r) => r.id === respondId) ?? null) : null;

  const toggleComposerPeer = (peerId: string) =>
    form.setData(
      'peerIds',
      form.data.peerIds.includes(peerId)
        ? form.data.peerIds.filter((id) => id !== peerId)
        : [...form.data.peerIds, peerId],
    );

  const openComposer = () => {
    form.reset();
    form.clearErrors();
    setComposerOpen(true);
  };

  const send = () => {
    if (form.data.peerIds.length === 0) return;
    const count = form.data.peerIds.length;
    form.transform((d) => ({
      peerIds: d.peerIds,
      template: d.template,
      message: d.message.trim(),
      dueDate: d.dueDate || null,
      includesRating: d.includesRating,
    }));
    form.post('/feedback/requests', {
      onSuccess: () => {
        toast(`Feedback requested from ${count} ${count > 1 ? 'people' : 'person'}`);
        setComposerOpen(false);
        form.reset();
        setTab('sent');
      },
      onError: (errors) => toast(messageFor(errors), 'error'),
    });
  };

  return {
    tab,
    setTab,
    usersById,
    peers,
    inbox,
    sent,
    received,
    requestPeerById,
    composerOpen,
    openComposer,
    closeComposer: () => setComposerOpen(false),
    composer: form.data,
    toggleComposerPeer,
    setComposerField: form.setData,
    send,
    sending: form.processing,
    respondId,
    respondRequest,
    openRespond: setRespondId,
    closeRespond: () => setRespondId(null),
  };
}
