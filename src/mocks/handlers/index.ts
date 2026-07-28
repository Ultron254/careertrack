import { adminHandlers } from './admin';
import { appraisalHandlers } from './appraisals';
import { calendarHandlers } from './calendar';
import { feedbackHandlers } from './feedback';
import { goalHandlers } from './goals';
import { hrConfigHandlers } from './hrConfig';
import { insightHandlers } from './insights';
import { notificationHandlers } from './notifications';
import { orgHandlers } from './org';
import { reviewHandlers } from './reviews';
import { teamAppraisalHandlers } from './teamAppraisals';

export const handlers = [
  ...orgHandlers,
  ...goalHandlers,
  ...reviewHandlers,
  ...feedbackHandlers,
  ...appraisalHandlers,
  ...teamAppraisalHandlers,
  ...insightHandlers,
  ...calendarHandlers,
  ...notificationHandlers,
  ...hrConfigHandlers,
  ...adminHandlers,
];
