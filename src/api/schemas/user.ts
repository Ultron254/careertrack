import { z } from 'zod';
import type { User } from '@/types/domain';
import { entityFields, roleSchema } from './common';

export const userSchema = z.object({
  ...entityFields,
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  jobTitle: z.string(),
  departmentId: z.string().nullable(),
  managerId: z.string().nullable(),
  avatarUrl: z.string().nullable(),
}) satisfies z.ZodType<User>;

export const usersSchema = z.array(userSchema);
