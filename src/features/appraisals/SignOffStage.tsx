import { formatDistanceToNow } from 'date-fns';
import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/ui/Avatar';
import type { SignaturePartyInput } from '@/api/schemas/teamAppraisal';
import type { IsoDateTime, User } from '@/types/domain';
import { ratingWord } from './reviewModel';
import styles from './ManagerAppraisal.module.css';

type Signatures = Record<SignaturePartyInput, IsoDateTime | null>;

// The three-party sign-off. The People Team signs last, which locks the record.
export function Acknowledgement({
  report,
  first,
  manager,
  peopleTeam,
  signatures,
  signing,
  onSign,
}: {
  report: User;
  first: string;
  manager: User | null;
  peopleTeam: User | null;
  signatures: Signatures;
  signing: boolean;
  onSign: (party: SignaturePartyInput) => void;
}) {
  const parties = [
    {
      key: 'employee' as const,
      name: report.name,
      role: 'Employee',
      userId: report.id,
      avatarUrl: report.avatarUrl,
      cta: `Mark ${first} as signed`,
      enabled: true,
    },
    {
      key: 'manager' as const,
      name: manager?.name ?? 'Line manager',
      role: 'Line Manager',
      userId: manager?.id ?? 'manager',
      avatarUrl: manager?.avatarUrl ?? null,
      cta: 'Sign as manager',
      enabled: true,
    },
    {
      key: 'people_team' as const,
      name: peopleTeam?.name ?? 'People Team',
      role: 'People Team · locks record',
      userId: peopleTeam?.id ?? 'people-team',
      avatarUrl: peopleTeam?.avatarUrl ?? null,
      cta: 'Lock record',
      enabled: Boolean(signatures.employee && signatures.manager),
    },
  ];

  return (
    <div className={styles.signList}>
      {parties.map((party) => {
        const signedAt = signatures[party.key];
        return (
          <div
            key={party.key}
            className={`${styles.signCard} ${
              signedAt ? styles.signCardDone : party.enabled ? styles.signCardActive : ''
            }`}
          >
            <Avatar userId={party.userId} name={party.name} avatarUrl={party.avatarUrl} size={46} />
            <div className={styles.signBody}>
              <div className={styles.signName}>{party.name}</div>
              <div className={styles.signRole}>{party.role}</div>
            </div>
            {signedAt ? (
              <span className={styles.signState}>
                <Icon name="check" size={16} /> Signed{' '}
                {formatDistanceToNow(new Date(signedAt), { addSuffix: true })}
              </span>
            ) : party.enabled ? (
              <button
                type="button"
                className={styles.signButton}
                disabled={signing}
                onClick={() => onSign(party.key)}
              >
                {party.cta}
              </button>
            ) : (
              <span className={styles.signWaiting}>Awaiting signature</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DoneCard({
  report,
  first,
  year,
  projected,
}: {
  report: User;
  first: string;
  year: number;
  projected: number;
}) {
  return (
    <div className={`card ${styles.doneCard}`}>
      <div className={styles.doneMark}>
        <Icon name="check" size={40} />
      </div>
      <h2 className={styles.doneTitle}>Appraisal complete &amp; locked {'\u{1F389}'}</h2>
      <p className={styles.doneBody}>
        {report.name}'s {year} appraisal is signed by all three parties and locked by the People
        Team.
      </p>
      {projected > 0 && (
        <p className={styles.doneBody}>
          Final overall rating <strong>{projected.toFixed(1)}</strong> · {ratingWord(projected)}.
        </p>
      )}
      <p className={styles.doneBody} style={{ color: 'var(--text-muted)' }}>
        {first} keeps a copy in their record; you can revisit it any time from Reports.
      </p>
    </div>
  );
}
