import { Icon } from '@/Components/icons/Icon';
import { Avatar } from '@/Components/ui/Avatar';
import { categoryColour, categoryTint, ratingColour } from '@/Components/ui/accent';
import type { SignaturePartyInput } from '@/Types/teamAppraisal';
import type { FinalRating, GoalCategory, IsoDateTime, Rating, User } from '@/Types/domain';
import { finalOf, ratingWord, signedWhen } from './reviewModel';
import styles from './Appraisal.module.css';
import shared from './ManagerAppraisal.module.css';

const scale: Rating[] = [1, 2, 3, 4];

// The goal shape the employee-side stages work with — flattened from the
// self-appraisal sections, so the weight is the category weight.
export interface CycleGoal {
  id: string;
  title: string;
  category: GoalCategory;
  weight: number;
}

type Signatures = Record<SignaturePartyInput, IsoDateTime | null>;

// A signing party as shown on the acknowledgement and locked views. `person`
// is null when the org data has no match (e.g. no People Team user seeded).
export interface SignerParty {
  key: SignaturePartyInput;
  person: User | null;
  fallbackName: string;
  role: string;
}

function CategoryChip({ category }: { category: GoalCategory }) {
  return (
    <span
      className={styles.sectionChip}
      style={{ background: categoryTint[category], color: categoryColour[category] }}
    >
      <span className={styles.sectionChipDot} style={{ background: categoryColour[category] }} />
      {category}
    </span>
  );
}

// Line-manager stage: the employee waits while their manager rates. Their own
// submission is shown read-only with the manager and final columns pending.
export function WaitingOnManager({
  goals,
  selfOf,
}: {
  goals: CycleGoal[];
  selfOf: (goalId: string) => Rating;
}) {
  return (
    <div className={`card ${styles.blockCard}`}>
      <div className={styles.blockTitle} style={{ marginBottom: 14 }}>
        Your submitted self-appraisal
      </div>
      <div className={styles.subList}>
        {goals.map((goal) => {
          const self = selfOf(goal.id);
          return (
            <div
              key={goal.id}
              className={styles.subRow}
              style={{ borderLeftColor: categoryColour[goal.category] }}
            >
              <div className={styles.subMain}>
                <CategoryChip category={goal.category} />
                <div className={styles.subTitle}>{goal.title}</div>
              </div>
              <div className={styles.subStat}>
                <span className={styles.subStatLabel}>Self</span>
                <span className={styles.subStatValue} style={{ color: ratingColour[self] }}>
                  {self}
                </span>
              </div>
              <div className={styles.subStat}>
                <span className={styles.subStatLabel}>Manager</span>
                <span className={`${styles.subStatValue} ${styles.subStatPending}`}>–</span>
              </div>
              <div className={styles.subStat}>
                <span className={styles.subStatLabel}>Final</span>
                <span className={`${styles.subStatValue} ${styles.subStatPending}`}>–</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The alignment discussion from the employee's side: compare self and manager
// numbers, propose an agreed final for the manager to confirm, or flag the
// goal to the People Team.
export function EmployeeDiscussion({
  goals,
  selfOf,
  managerOf,
  finals,
  managerFirst,
  onPropose,
  onFlag,
  onAdvance,
}: {
  goals: CycleGoal[];
  selfOf: (goalId: string) => Rating;
  managerOf: (goalId: string) => Rating;
  finals: Record<string, FinalRating>;
  managerFirst: string;
  onPropose: (goalId: string, rating: Rating) => void;
  onFlag: (goalId: string) => void;
  onAdvance: () => void;
}) {
  const lockedCount = goals.filter((goal) => {
    const { status } = finalOf(finals, goal.id);
    return status === 'locked' || status === 'resolved';
  }).length;
  const allLocked = goals.length > 0 && lockedCount === goals.length;

  return (
    <>
      <div className={shared.notice}>
        <Icon name="chat" size={16} />
        <span>
          Work through each goal together. You and {managerFirst} both confirm a final number before
          it locks.
        </span>
      </div>
      <div className={styles.sections}>
        {goals.map((goal) => {
          const state = finalOf(finals, goal.id);
          const self = selfOf(goal.id);
          const manager = managerOf(goal.id);
          const settled = state.status === 'locked' || state.status === 'resolved';
          return (
            <div
              key={goal.id}
              className={`card ${styles.section}`}
              style={{ borderLeftColor: categoryColour[goal.category] }}
            >
              <div className={styles.sectionHead}>
                <CategoryChip category={goal.category} />
                <span className={styles.sectionTitle}>{goal.title}</span>
                {state.status === 'open' && (
                  <span className={`${shared.statePill} ${styles.pillRight}`}>No proposal yet</span>
                )}
                {state.status === 'proposed' && (
                  <span className={`${shared.statePill} ${styles.pillRight} ${styles.pillWaiting}`}>
                    Awaiting {managerFirst}
                  </span>
                )}
                {settled && (
                  <span
                    className={`${shared.statePill} ${styles.pillRight} ${shared.statePillLocked}`}
                  >
                    ✓ Locked
                  </span>
                )}
                {state.status === 'flagged' && (
                  <span
                    className={`${shared.statePill} ${styles.pillRight} ${shared.statePillFlagged}`}
                  >
                    Flagged · People Team
                  </span>
                )}
              </div>

              <div className={styles.duel}>
                <div className={styles.duelStat}>
                  <span className={styles.duelLabel}>Self</span>
                  <span className={styles.duelNum} style={{ color: ratingColour[self] }}>
                    {self}
                  </span>
                </div>
                <div className={styles.duelStat}>
                  <span className={styles.duelLabel}>Manager</span>
                  <span className={styles.duelNum} style={{ color: ratingColour[manager] }}>
                    {manager}
                  </span>
                </div>
                <span className={styles.duelArrow} aria-hidden="true">
                  {'\u2192'}
                </span>
                <div>
                  <div className={styles.duelLabel}>Agreed final rating</div>
                  <div className={shared.finalScale}>
                    {scale.map((n) => {
                      const on = state.value === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          className={shared.finalButton}
                          disabled={settled || state.status === 'flagged'}
                          onClick={() => onPropose(goal.id, n)}
                          style={
                            on
                              ? {
                                  background: ratingColour[n],
                                  color: 'var(--surface)',
                                  borderColor: ratingColour[n],
                                }
                              : undefined
                          }
                          aria-pressed={on}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.duelFoot}>
                <span className={shared.discussHint} style={{ margin: 0 }}>
                  {state.status === 'open' &&
                    `Propose a final rating for ${managerFirst} to agree.`}
                  {state.status === 'proposed' &&
                    `You proposed ${state.value}. Waiting for ${managerFirst} to agree.`}
                  {state.status === 'locked' && `You and ${managerFirst} agreed on ${state.value}.`}
                  {state.status === 'flagged' &&
                    'Waiting on the People Team to mediate a final rating.'}
                  {state.status === 'resolved' &&
                    `The People Team set the final rating at ${state.value}.`}
                </span>
                {(state.status === 'open' || state.status === 'proposed') && (
                  <button
                    type="button"
                    className={shared.flagButton}
                    onClick={() => onFlag(goal.id)}
                  >
                    🚩 Flag to People Team
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className={`card ${shared.footer}`}>
          <div className={shared.footerStatus}>
            <strong>
              {lockedCount}/{goals.length}
            </strong>{' '}
            goals locked
          </div>
          <button
            type="button"
            className={`${shared.advance} ${shared.advanceTeal}`}
            disabled={!allLocked}
            onClick={onAdvance}
          >
            Move to acknowledgement {'\u2192'}
          </button>
        </div>
      </div>
    </>
  );
}

// Three-party sign-off tiles. The current viewer gets the live button; the
// other parties' signatures arrive from their own side of the cycle.
export function SignOffPanel({
  parties,
  goalCount,
  signatures,
  signing,
  signerKey,
  signLabel,
  onSign,
}: {
  parties: SignerParty[];
  goalCount: number;
  signatures: Signatures;
  signing: boolean;
  signerKey: SignaturePartyInput;
  signLabel: string;
  onSign: () => void;
}) {
  return (
    <div className={`card ${styles.blockCard}`}>
      <div className={styles.blockTitle}>Sign off the aligned appraisal</div>
      <p className={styles.signIntro}>
        All {goalCount} goals are aligned. Each party signs to confirm the discussion took place and
        the ratings are agreed. The People Team signs last to lock the record.
      </p>
      <div className={styles.signGrid}>
        {parties.map((party) => {
          const signedAt = signatures[party.key];
          const isSigner = party.key === signerKey;
          return (
            <div
              key={party.key}
              className={`${styles.signTile} ${
                signedAt ? styles.signTileDone : isSigner ? styles.signTileActive : ''
              }`}
            >
              <Avatar
                userId={party.person?.id ?? party.key}
                name={party.person?.name ?? party.fallbackName}
                avatarUrl={party.person?.avatarUrl ?? null}
                size={48}
              />
              <div className={styles.signTileName}>{party.person?.name ?? party.fallbackName}</div>
              <div className={styles.signTileRole}>{party.role}</div>
              {signedAt ? (
                <span className={styles.signedPill}>
                  <Icon name="check" size={14} /> Signed {'\u00b7'} {signedWhen(signedAt)}
                </span>
              ) : isSigner ? (
                <button
                  type="button"
                  className={shared.signButton}
                  disabled={signing}
                  onClick={onSign}
                >
                  {signLabel}
                </button>
              ) : (
                <span className={styles.awaitingPill}>Awaiting signature</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The closed record: everyone signed, the People Team locked it.
export function LockedRecord({
  name,
  year,
  final,
  parties,
  signatures,
}: {
  name: string;
  year: number;
  final: number;
  parties: SignerParty[];
  signatures: Signatures;
}) {
  return (
    <>
      <div className={`card ${styles.doneCard}`}>
        <div className={styles.doneMark}>
          <Icon name="check" size={40} />
        </div>
        <h2 className={styles.doneTitle}>Appraisal complete &amp; locked {'\u{1F389}'}</h2>
        <p className={styles.doneBody}>
          {name}'s {year} appraisal is signed by all three parties and locked by the People Team.
          {final > 0 && (
            <>
              {' '}
              Final overall rating <strong>{final.toFixed(1)}</strong> {'\u00b7'}{' '}
              {ratingWord(final)}.
            </>
          )}
        </p>
      </div>
      <div className={`card ${styles.blockCard}`}>
        <div className={styles.blockTitle} style={{ marginBottom: 14 }}>
          Signatures
        </div>
        <div className={styles.signRows}>
          {parties.map((party) => {
            const signedAt = signatures[party.key];
            return (
              <div key={party.key} className={styles.signRow}>
                <Avatar
                  userId={party.person?.id ?? party.key}
                  name={party.person?.name ?? party.fallbackName}
                  avatarUrl={party.person?.avatarUrl ?? null}
                  size={38}
                />
                <div className={styles.signRowBody}>
                  <div className={styles.signTileName}>
                    {party.person?.name ?? party.fallbackName}
                  </div>
                  <div className={styles.signTileRole}>{party.role}</div>
                </div>
                {signedAt && (
                  <span className={styles.signedPill}>
                    <Icon name="check" size={14} /> Signed {'\u00b7'} {signedWhen(signedAt)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
