import { useMemo, useState } from 'react';
import { useDepartments, useUsers } from '@/api/queries/org';
import { useSendFeedbackRequests } from '@/api/queries/feedback';
import { useAuth } from '@/auth/authProvider';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ratingColour } from '@/components/ui/accent';
import type { useSelfAppraisal } from './useSelfAppraisal';
import styles from './Appraisal.module.css';

// People Team caps how many peer appraisals a person can request per cycle. The
// limit is a UI convention here; a real build would read it from cycle config.
const PEER_REQUEST_LIMIT = 5;

export function AppraisalPeerPanel({ a }: { a: ReturnType<typeof useSelfAppraisal> }) {
  const { user } = useAuth();
  const toast = useToast();
  const departmentsQuery = useDepartments();
  const usersQuery = useUsers();
  const send = useSendFeedbackRequests();

  const [deptId, setDeptId] = useState('');
  const [peerId, setPeerId] = useState('');

  const departments = departmentsQuery.data;
  const deptNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments ?? []) map.set(d.id, d.name);
    return map;
  }, [departments]);

  // Colleagues available to ask, scoped to the chosen department and never you.
  const colleagues = useMemo(() => {
    if (!deptId) return [];
    return (usersQuery.data ?? []).filter((u) => u.departmentId === deptId && u.id !== user?.id);
  }, [usersQuery.data, deptId, user?.id]);

  const used = a.pendingPeers.length + a.received.length;
  const atLimit = used >= PEER_REQUEST_LIMIT;
  const hasAny = a.received.length > 0 || a.pendingPeers.length > 0;

  const requestAppraisal = () => {
    if (!peerId) return;
    send.mutate(
      {
        peerIds: [peerId],
        template: 'full',
        message: 'Peer appraisal request — please rate my delivery this cycle.',
        dueDate: null,
        includesRating: true,
      },
      {
        onSuccess: () => {
          toast('Appraisal request sent');
          setPeerId('');
          setDeptId('');
        },
        onError: () => toast('That request did not send. Try again.', 'error'),
      },
    );
  };

  return (
    <div className={styles.peerWrap}>
      <div className={`card ${styles.peerCard}`}>
        <div className={styles.peerHead}>
          <div className={styles.peerTitle}>Peer appraisals</div>
          <span className={styles.advisory}>ADVISORY</span>
          <span className={styles.peerUsage}>
            {used} of {PEER_REQUEST_LIMIT} requests used {'\u00b7'} People Team limit
          </span>
        </div>
        <p className={styles.peerBlurb}>
          Colleagues from any department can review your goals. Peer input is advisory, it enriches
          your appraisal but does not change your final rating.
        </p>

        <div className={styles.peerRequestRow}>
          <select
            className={styles.peerSelect}
            value={deptId}
            onChange={(event) => {
              setDeptId(event.target.value);
              setPeerId('');
            }}
            aria-label="Department"
          >
            <option value="">Select a department</option>
            {(departments ?? []).map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            className={styles.peerSelect}
            value={peerId}
            onChange={(event) => setPeerId(event.target.value)}
            disabled={!deptId}
            aria-label="Colleague"
          >
            <option value="">{deptId ? 'Select a colleague' : 'Pick a department first'}</option>
            {colleagues.map((colleague) => (
              <option key={colleague.id} value={colleague.id}>
                {colleague.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.peerRequestBtn}
            onClick={requestAppraisal}
            disabled={!peerId || atLimit || send.isPending}
          >
            {send.isPending ? 'Sending' : 'Request appraisal'}
          </button>
        </div>
        {atLimit && (
          <div className={styles.peerLimitNote}>
            You have used all {PEER_REQUEST_LIMIT} peer requests for this cycle.
          </div>
        )}

        {!hasAny && (
          <div className={styles.peerComment}>
            No peer appraisals yet. Request one above to gather advisory input from a colleague.
          </div>
        )}

        <div className={styles.peerList}>
          {a.received.map((response) => {
            const peerRef = a.requestPeerById.get(response.requestId);
            const author = peerRef ? a.usersById.get(peerRef) : undefined;
            const deptName = author?.departmentId ? deptNameById.get(author.departmentId) : undefined;
            return (
              <div key={response.id} className={styles.peerRow}>
                <div className={styles.peerRowHead}>
                  <Avatar
                    userId={peerRef ?? 'peer'}
                    name={author?.name ?? 'Colleague'}
                    avatarUrl={author?.avatarUrl}
                    size={38}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.peerName}>{author?.name ?? 'A colleague'}</div>
                    <div className={styles.peerDept}>{deptName ?? author?.jobTitle ?? 'Colleague'}</div>
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

          {a.pendingPeers.map((requestItem) => {
            const peer = a.usersById.get(requestItem.peerId);
            const deptName = peer?.departmentId ? deptNameById.get(peer.departmentId) : undefined;
            return (
              <div key={requestItem.id} className={styles.peerRow}>
                <div className={styles.peerRowHead}>
                  <Avatar
                    userId={requestItem.peerId}
                    name={peer?.name ?? 'Colleague'}
                    avatarUrl={peer?.avatarUrl}
                    size={38}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.peerName}>{peer?.name ?? 'A colleague'}</div>
                    <div className={styles.peerDept}>{deptName ?? peer?.jobTitle ?? 'Colleague'}</div>
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
