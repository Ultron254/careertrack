import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { ReportsProps } from '@/Pages/reports/Reports';
import type { ReportSchedule } from '@/Types/report';
import { departments } from './fixtures/departments';
import { reports } from './fixtures/reports';
import { db } from './store';

// Mock counterpart of ReportController@index. Each role gets its own report
// slice; departments and users feed the audience picker in the header.
export const reportsProps: PageResolver<ReportsProps> = ({ user }) => ({
  report: reports[user.role],
  schedule: db.reportSchedule,
  departments,
  users: db.users,
});

// Exporting a report. PDF and Excel render server-side today; the deck and
// raw-data formats are still on the roadmap, so they refuse politely.
registerAction('post', '/reports/export', ({ body }) => {
  if (body.format !== 'pdf' && body.format !== 'xlsx') {
    return { errors: { format: 'Only PDF and Excel exports exist so far.' } };
  }
});

const frequencies: ReportSchedule['frequency'][] = ['daily', 'weekly', 'monthly'];

// The scheduled email digest. One schedule per user, replaced wholesale.
registerAction('put', '/reports/schedule', ({ body }) => {
  const errors: Record<string, string> = {};
  if (!frequencies.includes(body.frequency as ReportSchedule['frequency'])) {
    errors.frequency = 'Choose how often the export should run.';
  }
  if (typeof body.enabled !== 'boolean') {
    errors.enabled = 'Say whether the schedule is on.';
  }
  if (Object.keys(errors).length > 0) return { errors };
  db.reportSchedule = {
    frequency: body.frequency as ReportSchedule['frequency'],
    enabled: body.enabled as boolean,
  };
});
