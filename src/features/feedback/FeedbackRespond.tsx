import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { ratingLabels } from '@/components/ui/accent';
import type { Rating } from '@/types/domain';
import { templateNames, type useFeedback } from './useFeedback';
import styles from './PeerFeedback.module.css';

const ratingScale: Rating[] = [1, 2, 3, 4];

export function FeedbackRespond({ fb }: { fb: ReturnType<typeof useFeedback> }) {
  const request = fb.respondRequest;
  const requester = request ? fb.usersById.get(request.requesterId) : undefined;

  const [strengths, setStrengths] = useState('');
  const [growthAreas, setGrowthAreas] = useState('');
  const [rating, setRating] = useState<Rating | null>(null);

  const open = fb.respondId !== null;

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
        <button type="button" className={styles.modalClose} onClick={fb.closeRespond} aria-label="Close">
          &#10005;
        </button>
      </div>

      <label className={`${styles.fieldLabel} ${styles.fieldLabelStrength}`} htmlFor="resp-strengths">
        What do they do well?
      </label>
      <textarea
        id="resp-strengths"
        className={styles.textarea}
        rows={3}
        style={{ marginBottom: 16 }}
        value={strengths}
        onChange={(event) => setStrengths(event.target.value)}
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
        value={growthAreas}
        onChange={(event) => setGrowthAreas(event.target.value)}
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
                data-on={rating === value}
                onClick={() => setRating(rating === value ? null : value)}
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
          disabled={!strengths.trim() || fb.responding}
          onClick={() => fb.submitResponse({ strengths, growthAreas, rating })}
        >
          Send feedback
        </button>
      </div>
    </Modal>
  );
}
