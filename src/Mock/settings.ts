import type { PageResolver } from '@/Lib/page';
import { registerAction } from '@/Lib/router';
import type { SettingsProps } from '@/Pages/settings/Settings';
import type { HrConfig } from '@/Types/hrConfig';
import { recordAudit } from './admin';
import { cycles } from './fixtures/cycles';
import { db } from './store';

// Mock counterpart of SettingsController@index. Users feed the manager
// lookup on the profile tab, the audit trail feeds the admin activity card,
// and the cycle list drives the status card on the configuration tab.
export const settingsProps: PageResolver<SettingsProps> = () => ({
  users: db.users,
  auditLog: db.auditLog,
  config: db.hrConfig,
  cycles,
});

// Saving the performance cycle configuration. The whole document is replaced
// at once — partial writes would leave weights and stages out of sync.
registerAction('put', '/hr-config', ({ user, body }) => {
  if (user.role !== 'people_team' && user.role !== 'admin') {
    return { errors: { config: 'Only the People Team or an admin can change configuration.' } };
  }
  const config = body as unknown as HrConfig;
  // Self and manager reviews are the backbone of the cycle; the UI locks
  // them, and the server refuses them off no matter what arrives.
  const lockedOff = config.reviewStages?.some(
    (stage) => (stage.stage === 'self' || stage.stage === 'manager') && !stage.enabled,
  );
  if (lockedOff) {
    return { errors: { reviewStages: 'Self and manager stages cannot be disabled.' } };
  }
  db.hrConfig = config;
  recordAudit(user, 'config_updated', 'Updated the performance cycle configuration');
});
