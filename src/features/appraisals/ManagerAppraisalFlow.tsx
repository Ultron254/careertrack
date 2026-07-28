import { useState } from 'react';
import { useUsers } from '@/api/queries/org';
import { useAuth } from '@/auth/authProvider';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import type { User } from '@/types/domain';
import { Appraisal } from './Appraisal';
import { ReportReview } from './ReportReview';
import { firstNameOf } from './reviewModel';
import styles from './ManagerAppraisal.module.css';

// The manager's appraisal hub: their own self-appraisal on one tab, their
// direct reports' appraisals (rating → discussion → sign-off) on the other.
export function ManagerAppraisalFlow() {
  const { user } = useAuth();
  const usersQuery = useUsers();
  const [tab, setTab] = useState<'me' | 'team'>('me');

  if (usersQuery.isPending) return <ViewSkeleton />;
  if (usersQuery.isError) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={usersQuery.error} onRetry={usersQuery.refetch} />
      </div>
    );
  }

  const reports = (usersQuery.data ?? []).filter((u) => u.managerId === user?.id);

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
          My team{reports.length ? ` · ${reports.length}` : ''}
        </button>
      </div>

      {tab === 'me' ? <Appraisal selfOnly /> : <TeamAppraisals reports={reports} />}
    </div>
  );
}

function TeamAppraisals({ reports }: { reports: User[] }) {
  const [reportId, setReportId] = useState(reports[0]?.id ?? '');

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No direct reports yet"
        body="Once team members report to you, their appraisals appear here for rating and sign-off."
      />
    );
  }

  const report = reports.find((r) => r.id === reportId) ?? reports[0];

  return (
    <>
      {reports.length > 1 && (
        <div className={styles.reportBar}>
          <span className={styles.reportLabel}>Reviewing</span>
          {reports.map((r) => {
            const on = r.id === report.id;
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
      <ReportReview key={report.id} report={report} />
    </>
  );
}
