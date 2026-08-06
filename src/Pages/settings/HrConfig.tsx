import { useState } from 'react';
import { Icon } from '@/Components/icons/Icon';
import type { IconName } from '@/Components/icons/iconPaths';
import { useToast } from '@/Components/ui/Toast';
import { categoryColour } from '@/Components/ui/accent';
import type { Cycle, ReviewStage } from '@/Types/domain';
import type {
  AdHocCondition,
  EscalationRule,
  HrConfig as HrConfigData,
  ReminderOffset,
} from '@/Types/hrConfig';
import { useHrConfigEditor } from './useHrConfigEditor';
import styles from './Settings.module.css';

type Section = 'categories' | 'rating' | 'reviews' | 'timeline' | 'reminders' | 'adhoc';

const nav: { id: Section; label: string; icon: IconName }[] = [
  { id: 'categories', label: 'Categories', icon: 'dashboard' },
  { id: 'rating', label: 'Rating scale', icon: 'star' },
  { id: 'reviews', label: 'Review types', icon: 'doc' },
  { id: 'timeline', label: 'Cycle timeline', icon: 'cal' },
  { id: 'reminders', label: 'Reminders', icon: 'bell' },
  { id: 'adhoc', label: 'Ad-hoc goals', icon: 'bolt' },
];

const ratingScale = [
  {
    n: 1,
    label: 'Does not meet expectations',
    def: 'Performance is consistently below the required standard; significant improvement needed.',
  },
  {
    n: 2,
    label: 'Meets some expectations',
    def: 'Meets some but not all requirements; development needed in key areas.',
  },
  {
    n: 3,
    label: 'Meets expectations',
    def: 'Consistently delivers against goals and behaves in line with our values.',
  },
  {
    n: 4,
    label: 'Exceptional',
    def: 'Consistently exceeds goals and role expectations; a role model for others.',
  },
] as const;

const stageCopy: Record<ReviewStage, { name: string; desc: string }> = {
  self: { name: 'Self appraisal', desc: 'Employee rates themselves first.' },
  manager: { name: 'Line manager appraisal', desc: 'Manager rating, the official score.' },
  final: { name: 'Final aligned rating', desc: 'Agreed after the review discussion.' },
  peer: { name: 'Peer feedback feeds in', desc: 'Colleague feedback attaches to the appraisal.' },
};

const reminderCopy: Record<ReminderOffset, string> = {
  '14d': '14 days',
  '7d': '7 days',
  '3d': '3 days',
  '1d': '1 day',
  due: 'On due date',
};

const escalationCopy: Record<EscalationRule, { title: string; desc: string; colour: string }> = {
  notify_manager: {
    title: 'Notify line manager',
    desc: 'Alert the manager the same day.',
    colour: 'var(--blue)',
  },
  notify_people_team: {
    title: 'Escalate to People Team',
    desc: 'Add to the late list after 2 days.',
    colour: 'var(--orange)',
  },
  auto_extend: {
    title: 'Auto extend deadline',
    desc: 'Grant a 3 day grace window automatically.',
    colour: 'var(--teal)',
  },
  flag_record: {
    title: 'Flag on record',
    desc: 'Note the miss on the cycle record.',
    colour: 'var(--gold)',
  },
};

const conditionCopy: Record<AdHocCondition, string> = {
  specific_employee: 'Limited to a specific employee (People Team selects).',
  department: 'Limited to a department or team.',
  circumstance: 'Tied to a company circumstance, such as a new client win or restructure.',
};

export function HrConfig({ config, cycles }: { config: HrConfigData; cycles: Cycle[] }) {
  const editor = useHrConfigEditor(config);
  const toast = useToast();
  const [section, setSection] = useState<Section>('categories');
  // Reminder delivery channels are UI-only for now; they'll persist to the
  // config once the notifications service exposes per-channel settings.
  const [channels, setChannels] = useState({ inApp: true, email: true });

  const { draft } = editor;

  const activeCycle =
    cycles.find((c) => c.state === 'open' || c.state === 'closing') ??
    [...cycles].sort((a, b) => b.year - a.year)[0];
  const cycleLive = activeCycle?.state === 'open' || activeCycle?.state === 'closing';
  const daysToClose = activeCycle
    ? Math.max(0, Math.ceil((new Date(activeCycle.closesAt).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <>
      {activeCycle && (
        <div className={`card ${styles.cycleStatus}`}>
          <span className={styles.cycleDot} data-live={cycleLive} />
          <div className={styles.cycleStatusBody}>
            <div className={styles.cycleStatusTitle}>{activeCycle.year} cycle</div>
            <div className={styles.cycleStatusSub}>
              {cycleLive ? 'Live' : 'Not open'}
              {daysToClose !== null && cycleLive
                ? ` · closes in ${daysToClose} ${daysToClose === 1 ? 'day' : 'days'}`
                : ''}
            </div>
          </div>
        </div>
      )}
      <div className={styles.hrLayout}>
        <div className={styles.hrNav}>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.hrNavItem}
              data-on={section === item.id}
              onClick={() => setSection(item.id)}
            >
              <span className={styles.hrNavIcon}>
                <Icon name={item.icon} size={17} />
              </span>
              {item.label}
            </button>
          ))}
        </div>

        <div>
          {section === 'categories' && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Goal categories</h2>
                <p className={styles.sectionSub}>
                  Weightings are mandatory and must total 100 percent.
                </p>
              </div>
              <div className={`card ${styles.card}`}>
                <div className={styles.catGrid}>
                  <div />
                  <div />
                  <div className={styles.catHeadCell}>Weight</div>
                  <div className={styles.catHeadCell}>On</div>
                  {draft.categories.map((c) => (
                    <div key={c.category} style={{ display: 'contents' }}>
                      <span
                        className={styles.catSwatch}
                        style={{ background: categoryColour[c.category] }}
                      />
                      <span className={styles.catName}>{c.category}</span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          justifySelf: 'center',
                        }}
                      >
                        <input
                          className={styles.weightInput}
                          value={c.defaultWeightPct}
                          onChange={(e) =>
                            editor.setCategoryWeight(
                              c.category,
                              Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                            )
                          }
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>%</span>
                      </div>
                      <button
                        type="button"
                        className={styles.switch}
                        data-on={c.enabled}
                        onClick={() => editor.toggleCategory(c.category)}
                        style={{ justifySelf: 'center' }}
                        aria-label={`Toggle ${c.category}`}
                      >
                        <span className={styles.switchKnob} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.catFooter}>
                  <span
                    className={styles.totalWeight}
                    style={{
                      color:
                        editor.totalWeightPct === 100
                          ? 'var(--status-approved-fg)'
                          : 'var(--status-returned-fg)',
                    }}
                  >
                    Total weight: {editor.totalWeightPct}%
                  </span>
                  <button
                    type="button"
                    className={styles.addCategory}
                    // Custom categories need a schema change (GoalCategory is a fixed
                    // set today), so this surfaces intent until the backend supports it.
                    onClick={() =>
                      toast('Custom categories are coming soon — they need a backend change first.')
                    }
                  >
                    <Icon name="plus" size={14} /> Add custom category
                  </button>
                </div>
              </div>
              <div className={styles.note}>
                <Icon name="info" size={18} />
                <span>
                  Employees set 4 to 5 goals, at least one per required category, with at least one
                  stretch goal.
                </span>
              </div>
            </>
          )}

          {section === 'rating' && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Rating scale</h2>
                <p className={styles.sectionSub}>The 1 to 4 scale used across every appraisal.</p>
              </div>
              {ratingScale.map((r) => (
                <div
                  key={r.n}
                  className={`card ${styles.scaleRow}`}
                  style={{ borderLeftColor: `var(--rating-${r.n})` }}
                >
                  <span className={styles.scaleNum} style={{ background: `var(--rating-${r.n})` }}>
                    {r.n}
                  </span>
                  <div>
                    <div className={styles.scaleLabel}>{r.label}</div>
                    <div className={styles.scaleDef}>{r.def}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {section === 'reviews' && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Review types</h2>
                <p className={styles.sectionSub}>
                  Which appraisal stages apply, and whether peer feedback feeds in.
                </p>
              </div>
              {draft.reviewStages.map((s) => (
                <div key={s.stage} className={`card ${styles.rowCard}`}>
                  <div className={styles.rowBody}>
                    <div className={styles.rowName}>{stageCopy[s.stage].name}</div>
                    <div className={styles.rowDesc}>{stageCopy[s.stage].desc}</div>
                  </div>
                  {s.locked && <span className={styles.rowRequired}>Required</span>}
                  <button
                    type="button"
                    className={styles.switch}
                    data-on={s.enabled}
                    data-locked={s.locked}
                    onClick={() => editor.toggleReviewStage(s.stage)}
                    aria-label={`Toggle ${stageCopy[s.stage].name}`}
                  >
                    <span className={styles.switchKnob} />
                  </button>
                </div>
              ))}
            </>
          )}

          {section === 'timeline' && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Cycle timeline</h2>
                <p className={styles.sectionSub}>Set the windows for each phase of the cycle.</p>
              </div>
              <div className={styles.appliesChip}>
                <Icon name="team" size={13} /> Applies to All departments
              </div>
              <div className={`card ${styles.card}`}>
                {draft.cyclePhases.map((phase, index) => (
                  <div key={phase.name} className={styles.phaseRow}>
                    <span
                      className={styles.phaseDot}
                      style={{ background: `var(--rating-${(index % 4) + 1})` }}
                    />
                    <span className={styles.phaseName}>{phase.name}</span>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={phase.startsOn}
                      onChange={(e) => editor.setPhaseDate(index, 'startsOn', e.target.value)}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={phase.endsOn}
                      onChange={(e) => editor.setPhaseDate(index, 'endsOn', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'reminders' && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Reminders and escalation</h2>
                <p className={styles.sectionSub}>
                  Reminder cadence and what happens when employees are late.
                </p>
              </div>
              <div className={`card ${styles.card}`}>
                <div className={styles.rowName} style={{ marginBottom: 14 }}>
                  Reminder schedule (before deadline)
                </div>
                <div className={styles.reminderPills}>
                  {draft.reminders.map((r) => (
                    <button
                      key={r.offset}
                      type="button"
                      className={styles.reminderPill}
                      data-on={r.enabled}
                      onClick={() => editor.toggleReminder(r.offset)}
                    >
                      {reminderCopy[r.offset]}
                    </button>
                  ))}
                </div>
                <div className={styles.channelRow}>
                  <span className={styles.channelLabel}>Channels</span>
                  <button
                    type="button"
                    className={styles.reminderPill}
                    data-on={channels.inApp}
                    onClick={() => setChannels((c) => ({ ...c, inApp: !c.inApp }))}
                  >
                    <Icon name="bell" size={13} /> In-app
                  </button>
                  <button
                    type="button"
                    className={styles.reminderPill}
                    data-on={channels.email}
                    onClick={() => setChannels((c) => ({ ...c, email: !c.email }))}
                  >
                    <Icon name="chat" size={13} /> Email
                  </button>
                </div>
              </div>
              <div className={`card ${styles.card}`}>
                <div className={styles.rowName} style={{ marginBottom: 12 }}>
                  When an employee misses the deadline
                </div>
                {draft.escalations.map((e, index) => (
                  <div
                    key={e.rule}
                    className={styles.rowCard}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 13,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      className={styles.escStep}
                      style={{ background: escalationCopy[e.rule].colour }}
                    >
                      {index + 1}
                    </span>
                    <div className={styles.rowBody}>
                      <div className={styles.rowName}>{escalationCopy[e.rule].title}</div>
                      <div className={styles.rowDesc}>{escalationCopy[e.rule].desc}</div>
                    </div>
                    <button
                      type="button"
                      className={styles.switch}
                      data-on={e.enabled}
                      onClick={() => editor.toggleEscalation(e.rule)}
                      aria-label={`Toggle ${escalationCopy[e.rule].title}`}
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'adhoc' && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Ad-hoc goals</h2>
                <p className={styles.sectionSub}>
                  Allow goals outside the submission window, with conditions.
                </p>
              </div>
              <div className={`card ${styles.card}`}>
                <button type="button" className={styles.adhocToggle} onClick={editor.toggleAdHoc}>
                  <span className={styles.switch} data-on={draft.adHocGoals.enabled}>
                    <span className={styles.switchKnob} />
                  </span>
                  <span className={styles.adhocLabel}>Allow ad-hoc goals outside the window</span>
                </button>
                <div className={styles.condLabel}>Conditions</div>
                {draft.adHocGoals.conditions.map((c) => (
                  <button
                    key={c.condition}
                    type="button"
                    className={styles.condOption}
                    onClick={() => editor.toggleAdHocCondition(c.condition)}
                  >
                    <span className={styles.checkbox} data-on={c.enabled}>
                      {c.enabled && <Icon name="check" size={12} />}
                    </span>
                    {conditionCopy[c.condition]}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.saveBar}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={editor.save}
              disabled={editor.saving}
            >
              {editor.saving ? 'Saving' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
