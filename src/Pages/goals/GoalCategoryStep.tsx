import { format, parseISO } from 'date-fns';
import { categoryColour, categoryTint } from '@/Components/ui/accent';
import type { Goal } from '@/Types/domain';
import { categoryCopy } from './goalCopy';
import type { useGoalSetup } from './useGoalSetup';
import styles from './GoalSetup.module.css';

const progressChoices = [0, 25, 50, 75, 100];

const formatTarget = (iso: string) => {
  try {
    return format(parseISO(iso), 'MMM yyyy');
  } catch {
    // A malformed date from a draft shouldn't crash the wizard; show the raw
    // value and leave a trace for debugging.
    console.warn(`GoalCategoryStep: could not format target date "${iso}"`);
    return iso;
  }
};

export function GoalCategoryStep({ s }: { s: ReturnType<typeof useGoalSetup> }) {
  const category = s.currentCategory;
  if (!category) return null;

  const copy = categoryCopy[category];
  const colour = categoryColour[category];
  const goals = s.goalsByCategory[category];

  return (
    <>
      <div className={styles.stepHead}>
        <span
          className={styles.catChip}
          style={{ background: categoryTint[category], color: colour }}
        >
          <span className={styles.catChipDot} style={{ background: colour }} />
          {category} goals
        </span>
        <span className={styles.stepCount}>Step {s.step + 1} of 4</span>
      </div>
      <h2 className={styles.headline}>{copy.headline}</h2>
      <p className={styles.blurb}>{copy.blurb}</p>

      {goals.map((goal) => (
        <GoalRow key={goal.id} goal={goal} colour={colour} s={s} />
      ))}

      {goals.length === 0 && (
        <div className={styles.emptyCat}>
          <div className={styles.emptyCatTitle}>No {category} goals yet</div>
          <div>Add your first one below. Aim for at least one per category.</div>
        </div>
      )}

      <GoalForm s={s} colour={colour} />
    </>
  );
}

function GoalRow({
  goal,
  colour,
  s,
}: {
  goal: Goal;
  colour: string;
  s: ReturnType<typeof useGoalSetup>;
}) {
  const noteOpen = !!s.openNotes[goal.id];
  const hasNote = !!goal.privateNote?.trim();

  return (
    <div className={styles.goalCard} style={{ borderLeftColor: colour }}>
      <div className={styles.goalCardHead}>
        <span className={styles.goalTitle}>{goal.title}</span>
        {goal.isStretch && <span className={styles.stretchTag}>STRETCH</span>}
        <span className={styles.goalWeight} style={{ color: colour }}>
          {goal.weight}%
        </span>
      </div>
      {goal.description && <div className={styles.goalDesc}>{goal.description}</div>}

      {goal.status === 'Returned' && (
        <div className={styles.returnedNote}>
          <span aria-hidden>&#8617;</span>
          <div>
            <strong style={{ color: 'var(--status-returned-fg)' }}>Returned, HR reviewed.</strong>{' '}
            Edit the highlighted fields and resubmit.
          </div>
        </div>
      )}

      <div className={styles.progressBlock}>
        <div className={styles.progressHead}>
          <span>Progress</span>
          <span className={styles.progressValue} style={{ color: colour }}>
            {goal.progress}%
          </span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${goal.progress}%`, background: colour }} />
        </div>
        <div className={styles.progressSteps}>
          {progressChoices.map((value) => {
            const active = goal.progress === value;
            return (
              <button
                key={value}
                type="button"
                className={styles.progressStep}
                onClick={() => s.setProgress(goal, value)}
                style={
                  active
                    ? { background: colour, color: 'var(--surface)', borderColor: colour }
                    : undefined
                }
              >
                {value}%
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.goalActions}>
        <span className={styles.goalMeta}>Target, {formatTarget(goal.targetDate)}</span>
        <button
          type="button"
          className={`${styles.linkButton} ${styles.noteToggle}`}
          onClick={() => s.toggleNote(goal.id)}
        >
          {hasNote ? 'Note' : '+ Private note'}
        </button>
        <button
          type="button"
          className={`${styles.linkButton} ${styles.editButton}`}
          onClick={() => s.startEdit(goal)}
        >
          Edit
        </button>
        <button
          type="button"
          className={`${styles.linkButton} ${styles.deleteButton}`}
          onClick={() => s.removeGoal(goal)}
        >
          Delete
        </button>
      </div>

      {noteOpen && (
        <div className={styles.noteBox}>
          <div className={styles.noteLabel}>
            Private note
            <span style={{ marginLeft: 'auto', fontWeight: 500 }}>Only you can see this</span>
          </div>
          <textarea
            className={styles.textarea}
            rows={2}
            defaultValue={goal.privateNote ?? ''}
            placeholder="Jot a private reminder, blocker or idea for this goal."
            onBlur={(event) => s.saveNote(goal, event.target.value)}
          />
        </div>
      )}
    </div>
  );
}

function GoalForm({ s, colour }: { s: ReturnType<typeof useGoalSetup>; colour: string }) {
  return (
    <div className={styles.addForm}>
      <div className={styles.addFormTitle}>{s.editingId ? 'Edit goal' : 'Add a goal'}</div>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="goal-title">Goal title</label>
          <input
            id="goal-title"
            className={styles.input}
            value={s.form.title}
            onChange={(event) => s.setField('title', event.target.value)}
            placeholder="e.g. Grow retained client accounts"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="goal-desc">Description</label>
          <textarea
            id="goal-desc"
            className={styles.textarea}
            rows={2}
            value={s.form.description}
            onChange={(event) => s.setField('description', event.target.value)}
            placeholder="What are you working toward?"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="goal-outcomes">Desired outcomes, success criteria</label>
          <textarea
            id="goal-outcomes"
            className={styles.textarea}
            rows={2}
            value={s.form.outcomes}
            onChange={(event) => s.setField('outcomes', event.target.value)}
            placeholder="How will you know you have achieved it?"
          />
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="goal-weight">Weight percent</label>
            <input
              id="goal-weight"
              className={styles.input}
              type="number"
              min={0}
              max={100}
              value={s.form.weight}
              onChange={(event) => s.setField('weight', event.target.value)}
              placeholder="30"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="goal-target">Target date</label>
            <input
              id="goal-target"
              className={styles.input}
              type="date"
              value={s.form.targetDate}
              onChange={(event) => s.setField('targetDate', event.target.value)}
            />
          </div>
          <button
            type="button"
            className={styles.stretchToggle}
            data-on={s.form.isStretch}
            onClick={() => s.setField('isStretch', !s.form.isStretch)}
          >
            {s.form.isStretch ? 'Stretch on' : 'Mark as stretch'}
          </button>
        </div>
      </div>
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.saveGoal}
          style={{ background: colour }}
          onClick={s.saveGoal}
          disabled={s.saving || !s.form.title.trim()}
        >
          {s.editingId ? 'Save changes' : 'Add goal'}
        </button>
        {s.editingId && (
          <button type="button" className={styles.cancel} onClick={s.cancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
