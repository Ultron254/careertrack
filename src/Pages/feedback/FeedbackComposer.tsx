import { Modal } from '@/Components/ui/Modal';
import { Avatar } from '@/Components/ui/Avatar';
import { templateOptions, type useFeedback } from './useFeedback';
import styles from './PeerFeedback.module.css';

export function FeedbackComposer({ fb }: { fb: ReturnType<typeof useFeedback> }) {
  const { composer } = fb;
  const count = composer.peerIds.length;

  return (
    <Modal open={fb.composerOpen} onClose={fb.closeComposer} label="Request feedback">
      <div className={styles.modalHead}>
        <div className={styles.modalTitle}>Request feedback</div>
        <button
          type="button"
          className={styles.modalClose}
          onClick={fb.closeComposer}
          aria-label="Close"
        >
          &#10005;
        </button>
      </div>
      <p className={styles.modalBlurb}>
        Pick colleagues, choose a template, and set a due date. They will be notified.
      </p>

      <div className={styles.fieldLabel}>Who do you want feedback from?</div>
      <div className={styles.peerRow}>
        {fb.peers.map((peer) => {
          const on = composer.peerIds.includes(peer.id);
          return (
            <button
              key={peer.id}
              type="button"
              className={styles.peerChip}
              data-on={on}
              onClick={() => fb.toggleComposerPeer(peer.id)}
            >
              <Avatar userId={peer.id} name={peer.name} avatarUrl={peer.avatarUrl} size={28} />
              {peer.name}
            </button>
          );
        })}
      </div>

      <div className={styles.fieldLabel}>Template</div>
      <div className={styles.templateList}>
        {templateOptions.map((option) => {
          const on = composer.template === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={styles.templateOption}
              data-on={on}
              onClick={() => fb.setComposerField('template', option.id)}
            >
              <span className={styles.templateRadio}>
                {on && <span className={styles.templateRadioDot} />}
              </span>
              <span>
                <span className={styles.templateName}>{option.name}</span>
                <span className={styles.templateDesc}>{option.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.composerRow}>
        <div>
          <label className={styles.fieldLabel} htmlFor="fb-due">
            Due date
          </label>
          <input
            id="fb-due"
            className={styles.input}
            type="date"
            value={composer.dueDate}
            onChange={(event) => fb.setComposerField('dueDate', event.target.value)}
          />
        </div>
        <div className={styles.toggleWrap}>
          <label className={styles.fieldLabel}>Ask for a rating</label>
          <button
            type="button"
            className={styles.ratingToggle}
            data-on={composer.includesRating}
            onClick={() => fb.setComposerField('includesRating', !composer.includesRating)}
          >
            {composer.includesRating ? 'Yes, 1 to 4' : 'No rating'}
          </button>
        </div>
      </div>

      <label className={styles.fieldLabel} htmlFor="fb-message">
        Message (optional)
      </label>
      <textarea
        id="fb-message"
        className={styles.textarea}
        rows={2}
        style={{ marginBottom: 20 }}
        value={composer.message}
        onChange={(event) => fb.setComposerField('message', event.target.value)}
        placeholder="Anything specific you would like them to focus on?"
      />

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          disabled={count === 0 || fb.sending}
          onClick={fb.send}
        >
          Send{count > 0 ? ` to ${count}` : ''}
        </button>
        <button type="button" className={styles.secondary} onClick={fb.closeComposer}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
