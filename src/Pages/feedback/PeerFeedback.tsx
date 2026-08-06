import { format, isValid, parseISO } from 'date-fns';
import { Avatar } from '@/Components/ui/Avatar';
import { Button } from '@/Components/ui/Button';
import { StatusBadge } from '@/Components/ui/Badge';
import { EmptyState } from '@/Components/ui/States';
import { ratingColour } from '@/Components/ui/accent';
import type { FeedbackRequest, FeedbackResponse, User } from '@/Types/domain';
import type { FeedbackTab } from './useFeedback';
import { templateNames, useFeedback } from './useFeedback';
import { FeedbackComposer } from './FeedbackComposer';
import { FeedbackRespond } from './FeedbackRespond';
import styles from './PeerFeedback.module.css';

const prettyDate = (iso: string | null) => {
  if (!iso) return 'no date';
  const parsed = parseISO(iso);
  return isValid(parsed) ? format(parsed, 'd MMM') : iso;
};

export interface PeerFeedbackProps {
  inbox: FeedbackRequest[];
  sent: FeedbackRequest[];
  received: FeedbackResponse[];
  users: User[];
}

export function PeerFeedback(props: PeerFeedbackProps) {
  const fb = useFeedback(props);

  const tabs: { key: FeedbackTab; label: string; count: number; badge: boolean }[] = [
    { key: 'inbox', label: 'For me to answer', count: fb.inbox.length, badge: fb.inbox.length > 0 },
    { key: 'sent', label: 'Requests I sent', count: fb.sent.length, badge: false },
    { key: 'received', label: 'Feedback received', count: fb.received.length, badge: false },
  ];

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Feedback</h1>
          <p className={styles.subtitle}>
            Ask anyone for feedback, respond to requests, and see what colleagues shared about you.
          </p>
        </div>
        <Button style={{ marginLeft: 'auto' }} onClick={fb.openComposer}>
          Request feedback
        </Button>
      </div>

      <div className={styles.tabs} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={fb.tab === tab.key}
            className={styles.tab}
            data-on={fb.tab === tab.key}
            onClick={() => fb.setTab(tab.key)}
          >
            {tab.label}
            {tab.badge && <span className={styles.tabBadge}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {fb.tab === 'inbox' && (
        <div className={styles.list}>
          {fb.inbox.length === 0 && (
            <EmptyState title="You are all caught up" body="No pending feedback requests." />
          )}
          {fb.inbox.map((request) => {
            const requester = fb.usersById.get(request.requesterId);
            return (
              <div key={request.id} className={`card ${styles.rowCard}`}>
                <Avatar
                  userId={request.requesterId}
                  name={requester?.name ?? 'Colleague'}
                  avatarUrl={requester?.avatarUrl}
                  size={46}
                />
                <div className={styles.rowBody}>
                  <div className={styles.rowTitle}>
                    {requester?.name ?? 'A colleague'} asked for your feedback
                  </div>
                  <div className={styles.rowMeta}>
                    {templateNames[request.template]}
                    {request.message ? ` \u00b7 ${request.message}` : ''}
                  </div>
                </div>
                <span className={styles.due}>Due {prettyDate(request.dueDate)}</span>
                <Button variant="ink" size="sm" onClick={() => fb.openRespond(request.id)}>
                  Give feedback
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {fb.tab === 'sent' && (
        <div className={styles.list}>
          {fb.sent.length === 0 && (
            <EmptyState
              title="No requests yet"
              body="Request feedback from a colleague to see it tracked here."
              action={<Button onClick={fb.openComposer}>Request feedback</Button>}
            />
          )}
          {fb.sent.map((request) => {
            const peer = fb.usersById.get(request.peerId);
            const done = request.status === 'completed';
            return (
              <div key={request.id} className={`card ${styles.rowCard}`}>
                <Avatar
                  userId={request.peerId}
                  name={peer?.name ?? 'Colleague'}
                  avatarUrl={peer?.avatarUrl}
                  size={46}
                />
                <div className={styles.rowBody}>
                  <div className={styles.rowTitle}>To {peer?.name ?? 'a colleague'}</div>
                  <div className={styles.rowMeta}>
                    {templateNames[request.template]} {'\u00b7'} due {prettyDate(request.dueDate)}
                  </div>
                </div>
                <StatusBadge
                  status={done ? 'Completed' : 'Pending'}
                  tone={done ? 'approved' : 'review'}
                />
              </div>
            );
          })}
        </div>
      )}

      {fb.tab === 'received' && (
        <>
          {fb.received.length === 0 ? (
            <EmptyState
              title="No feedback yet"
              body="Once colleagues respond to your requests, their feedback appears here."
            />
          ) : (
            <div className={styles.receivedGrid}>
              {fb.received.map((response) => {
                const peerId = fb.requestPeerById.get(response.requestId);
                const author = peerId ? fb.usersById.get(peerId) : undefined;
                return (
                  <div key={response.id} className={`card ${styles.receivedCard}`}>
                    <div className={styles.receivedHead}>
                      <Avatar
                        userId={peerId ?? 'peer'}
                        name={author?.name ?? 'Colleague'}
                        avatarUrl={author?.avatarUrl}
                        size={42}
                      />
                      <div>
                        <div className={styles.receivedName}>{author?.name ?? 'A colleague'}</div>
                        <div className={styles.receivedMeta}>{author?.jobTitle ?? 'Colleague'}</div>
                      </div>
                      {response.rating && (
                        <span
                          className={styles.receivedRating}
                          style={{ color: ratingColour[response.rating] }}
                        >
                          {response.rating}
                          <span className={styles.receivedRatingUnit}>/4</span>
                        </span>
                      )}
                    </div>
                    <div className={`${styles.blockLabel} ${styles.blockLabelStrength}`}>
                      Strengths
                    </div>
                    <div className={styles.blockText}>{response.strengths}</div>
                    {response.growthAreas && (
                      <>
                        <div className={`${styles.blockLabel} ${styles.blockLabelGrowth}`}>
                          Areas to grow
                        </div>
                        <div className={styles.blockText}>{response.growthAreas}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <FeedbackComposer fb={fb} />
      <FeedbackRespond fb={fb} />
    </div>
  );
}
