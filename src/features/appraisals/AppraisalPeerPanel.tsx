import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { ratingColour } from '@/components/ui/accent';
import type { useSelfAppraisal } from './useSelfAppraisal';
import styles from './Appraisal.module.css';

export function AppraisalPeerPanel({ a }: { a: ReturnType<typeof useSelfAppraisal> }) {
  const hasAny = a.received.length > 0 || a.pendingPeers.length > 0;

  return (
    <div className={styles.peerWrap}>
      <div className={`card ${styles.peerCard}`}>
        <div className={styles.peerHead}>
          <div className={styles.peerTitle}>Peer appraisals</div>
          <span className={styles.advisory}>ADVISORY</span>
        </div>
        <p className={styles.peerBlurb}>
          Colleagues from any department can review your goals. Peer input is advisory, it enriches
          your appraisal but does not change your final rating.
        </p>

        {!hasAny && (
          <div className={styles.peerComment}>
            No peer appraisals yet. Request feedback from the Feedback screen to gather peer input.
          </div>
        )}

        <div className={styles.peerList}>
          {a.received.map((response) => {
            const peerId = a.requestPeerById.get(response.requestId);
            const author = peerId ? a.usersById.get(peerId) : undefined;
            return (
              <div key={response.id} className={styles.peerRow}>
                <div className={styles.peerRowHead}>
                  <Avatar
                    userId={peerId ?? 'peer'}
                    name={author?.name ?? 'Colleague'}
                    avatarUrl={author?.avatarUrl}
                    size={38}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.peerName}>{author?.name ?? 'A colleague'}</div>
                    <div className={styles.peerDept}>{author?.jobTitle ?? 'Colleague'}</div>
                  </div>
                  <StatusBadge status="Completed" tone="approved" />
                  {response.rating && (
                    <span
                      className={styles.peerScore}
                      style={{ color: ratingColour[response.rating] }}
                    >
                      {response.rating}
                      <span className={styles.peerScoreUnit}>/4</span>
                    </span>
                  )}
                </div>
                {response.strengths && <div className={styles.peerComment}>{response.strengths}</div>}
              </div>
            );
          })}

          {a.pendingPeers.map((request) => {
            const peer = a.usersById.get(request.peerId);
            return (
              <div key={request.id} className={styles.peerRow}>
                <div className={styles.peerRowHead}>
                  <Avatar
                    userId={request.peerId}
                    name={peer?.name ?? 'Colleague'}
                    avatarUrl={peer?.avatarUrl}
                    size={38}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.peerName}>{peer?.name ?? 'A colleague'}</div>
                    <div className={styles.peerDept}>{peer?.jobTitle ?? 'Colleague'}</div>
                  </div>
                  <StatusBadge status="Requested" tone="review" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
