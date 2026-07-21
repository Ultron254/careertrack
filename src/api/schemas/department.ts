import { z } from 'zod';
import type { Department } from '@/types/domain';
import { entityFields } from './common';

export const departmentSchema = z.object({
  ...entityFields,
  name: z.string(),
  colour: z.string(),
  managerId: z.string(),
}) satisfies z.ZodType<Department>;

export const departmentsSchema = z.array(departmentSchema);
