import { useState } from 'react';
import { Avatar } from '@/Components/ui/Avatar';
import { EmptyState } from '@/Components/ui/States';
import type { User } from '@/Types/domain';
import type { SelfAppraisalData, TeamReviewData } from './Appraisal';
import { EmployeeCycle } from './EmployeeCycle';
import { ReportReview } from './ReportReview';
import { firstNameOf } from './reviewModel';
import styles from './ManagerAppraisal.module.css';

// The manager's appraisal hub: their own self-appraisal on one tab, their
// direct reports' appraisals (rating → discussion → sign-off) on the other.
export function ManagerAppraisalFlow({
  self,
  team,
}: {
  self: SelfAppraisalData;
  team: TeamReviewData[];
}) {
  const [tab, setTab] = useState<'me' | 'team'>('me');

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.switch}>
        <button
          type="button"
          className={`${styles.switchTab} ${tab === 'me' ? styles.switchTabOn : ''}`}
          onClick={() => setTab('me')}
        >
          My appraisal
        </button>
        <button
          type="button"
          className={`${styles.switchTab} ${tab === 'team' ? styles.switchTabOn : ''}`}
          onClick={() => setTab('team')}
        >
          My team{team.length ? ` · ${team.length}` : ''}
        </button>
      </div>

      {tab === 'me' ? (
        <EmployeeCycle self={self} />
      ) : (
        <TeamAppraisals
          team={team}
          users={self.users}
          year={self.cycle?.year ?? new Date().getFullYear()}
        />
      )}
    </div>
  );
}

function TeamAppraisals({
  team,
  users,
  year,
}: {
  team: TeamReviewData[];
  users: User[];
  year: number;
}) {
  const [reportId, setReportId] = useState(team[0]?.report.id ?? '');

  if (team.length === 0) {
    return (
      <EmptyState
        title="No direct reports yet"
        body="Once team members report to you, their appraisals appear here for rating and sign-off."
      />
    );
  }

  const current = team.find((entry) => entry.report.id === reportId) ?? team[0];

  return (
    <>
      {team.length > 1 && (
        <div className={styles.reportBar}>
          <span className={styles.reportLabel}>Reviewing</span>
          {team.map(({ report: r }) => {
            const on = r.id === current.report.id;
            return (
              <button
                key={r.id}
                type="button"
                className={`${styles.reportChip} ${on ? styles.reportChipOn : ''}`}
                onClick={() => setReportId(r.id)}
              >
                <Avatar userId={r.id} name={r.name} avatarUrl={r.avatarUrl} size={28} />
                {firstNameOf(r.name)}
              </button>
            );
          })}
        </div>
      )}

      {/* Reset the whole flow when the manager switches to a different report. */}
      <ReportReview key={current.record.id} data={current} users={users} year={year} />
    </>
  );
}
