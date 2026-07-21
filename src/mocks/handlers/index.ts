import { appraisalHandlers } from './appraisals';
import { calendarHandlers } from './calendar';
import { feedbackHandlers } from './feedback';
import { goalHandlers } from './goals';
import { hrConfigHandlers } from './hrConfig';
import { insightHandlers } from './insights';
import { notificationHandlers } from './notifications';
import { orgHandlers } from './org';
import { reviewHandlers } from './reviews';

export const handlers = [
  ...orgHandlers,
  ...goalHandlers,
  ...reviewHandlers,
  ...feedbackHandlers,
  ...appraisalHandlers,
  ...insightHandlers,
  ...calendarHandlers,
  ...notificationHandlers,
  ...hrConfigHandlers,
];
