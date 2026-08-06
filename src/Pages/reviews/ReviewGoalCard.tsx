import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar } from '@/Components/ui/Avatar';
import { categoryColour, categoryTint } from '@/Components/ui/accent';
import { useToast } from '@/Components/ui/Toast';
import { router } from '@/Lib/router';
import type { Goal, GoalComment, User } from '@/Types/domain';
import styles from './ManagerReview.module.css';

export function ReviewGoalCard({
  goal,
  comments,
  usersById,
  defaultOpen,
}: {
  goal: Goal;
  comments: GoalComment[];
  usersById: Map<string, User>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const toast = useToast();

  const colour = categoryColour[goal.category];
  const commentLabel =
    comments.length > 0
      ? `${comments.length} ${comments.length > 1 ? 'comments' : 'comment'}`
      : 'No comments';

  const post = () => {
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    router.post(
      `/goals/${goal.id}/comments`,
      { body },
      {
        onSuccess: () => setDraft(''),
        onError: () => toast('That comment did not post. Try again.', 'error'),
        onFinish: () => setPosting(false),
      },
    );
  };

  return (
    <div className={`card ${styles.goalCard}`} style={{ borderLeftColor: colour }}>
      <button type="button" className={styles.goalHead} onClick={() => setOpen((v) => !v)}>
        <span
          className={styles.goalCat}
          style={{ background: categoryTint[goal.category], color: colour }}
        >
          <span className={styles.goalCatDot} style={{ background: colour }} />
          {goal.category}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className={styles.goalTitleRow}>
            <span className={styles.goalTitle}>{goal.title}</span>
            {goal.isStretch && <span className={styles.stretchTag}>STRETCH</span>}
          </span>
          <span className={styles.goalDesc}>{goal.description}</span>
        </span>
        <span className={styles.goalWeightBlock}>
          <span className={styles.goalWeight} style={{ color: colour }}>
            {goal.weight}%
          </span>
          <div className={styles.goalCommentCount}>
            {open ? commentLabel : `${goal.weight}% weight`}
          </div>
        </span>
      </button>

      {open && (
        <div className={styles.goalBody}>
          <div className={styles.outcomeLabel}>Desired outcomes</div>
          <div className={styles.outcomeText}>{goal.outcomes}</div>

          <div className={styles.comments}>
            {comments.length === 0 && (
              <div className={styles.noComments}>No comments yet. Add the first one below.</div>
            )}
            {comments.map((comment) => {
              const author = usersById.get(comment.authorId);
              return (
                <div key={comment.id} className={styles.comment}>
                  <Avatar
                    userId={comment.authorId}
                    name={author?.name ?? 'Reviewer'}
                    avatarUrl={author?.avatarUrl}
                    size={28}
                  />
                  <div className={styles.bubble}>
                    <div className={styles.bubbleHead}>
                      <span className={styles.bubbleName}>{author?.name ?? 'Reviewer'}</span>
                      <span className={styles.bubbleMeta}>
                        {author?.jobTitle ? `${author.jobTitle} \u00b7 ` : ''}
                        {formatDistanceToNow(parseISO(comment.postedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className={styles.bubbleBody}>{comment.body}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.composer}>
            <textarea
              className={styles.composerInput}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment"
            />
            <button
              type="button"
              className={styles.composerPost}
              onClick={post}
              disabled={posting || !draft.trim()}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
