import { useForm } from '@/Hooks/useForm';
import { Modal } from '@/Components/ui/Modal';
import { Avatar } from '@/Components/ui/Avatar';
import { ratingLabels } from '@/Components/ui/accent';
import { useToast } from '@/Components/ui/Toast';
import type { Rating } from '@/Types/domain';
import { messageFor, templateNames, type useFeedback } from './useFeedback';
import styles from './PeerFeedback.module.css';

const ratingScale: Rating[] = [1, 2, 3, 4];

export function FeedbackRespond({ fb }: { fb: ReturnType<typeof useFeedback> }) {
  const toast = useToast();
  const request = fb.respondRequest;
  const requester = request ? fb.usersById.get(request.requesterId) : undefined;

  const form = useForm({
    strengths: '',
    growthAreas: '',
    rating: null as Rating | null,
  });

  const open = fb.respondId !== null;

  const submit = () => {
    if (!fb.respondId || !form.data.strengths.trim()) return;
    form.post(`/feedback/requests/${fb.respondId}/response`, {
      onSuccess: () => {
        toast('Feedback sent');
        fb.closeRespond();
      },
      onError: (errors) => toast(messageFor(errors), 'error'),
    });
  };

  return (
    <Modal open={open} onClose={fb.closeRespond} label="Give feedback">
      <div className={styles.modalHead}>
        <Avatar
          userId={request?.requesterId ?? 'peer'}
          name={requester?.name ?? 'Colleague'}
          avatarUrl={requester?.avatarUrl}
          size={46}
        />
        <div style={{ flex: 1 }}>
          <div className={styles.modalTitle} style={{ fontSize: 19 }}>
            Feedback for {requester?.name ?? 'a colleague'}
          </div>
          <div className={styles.receivedMeta}>
            {request ? templateNames[request.template] : ''}
          </div>
        </div>
        <button
          type="button"
          className={styles.modalClose}
          onClick={fb.closeRespond}
          aria-label="Close"
        >
          &#10005;
        </button>
      </div>

      <label
        className={`${styles.fieldLabel} ${styles.fieldLabelStrength}`}
        htmlFor="resp-strengths"
      >
        What do they do well?
      </label>
      <textarea
        id="resp-strengths"
        className={styles.textarea}
        rows={3}
        style={{ marginBottom: 16 }}
        value={form.data.strengths}
        onChange={(event) => form.setData('strengths', event.target.value)}
        placeholder="Specific strengths and examples"
      />

      <label className={`${styles.fieldLabel} ${styles.fieldLabelGrowth}`} htmlFor="resp-growth">
        Where can they grow?
      </label>
      <textarea
        id="resp-growth"
        className={styles.textarea}
        rows={3}
        style={{ marginBottom: 16 }}
        value={form.data.growthAreas}
        onChange={(event) => form.setData('growthAreas', event.target.value)}
        placeholder="Constructive, forward looking suggestions"
      />

      {request?.includesRating && (
        <>
          <label className={styles.fieldLabel}>Overall rating (optional)</label>
          <div className={styles.ratingScale}>
            {ratingScale.map((value) => (
              <button
                key={value}
                type="button"
                className={styles.ratingButton}
                data-on={form.data.rating === value}
                onClick={() => form.setData('rating', form.data.rating === value ? null : value)}
              >
                <span className={styles.ratingNum}>{value}</span>
                {ratingLabels[value]}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.primary} ${styles.primaryInk}`}
          disabled={!form.data.strengths.trim() || form.processing}
          onClick={submit}
        >
          Send feedback
        </button>
      </div>
    </Modal>
  );
}
