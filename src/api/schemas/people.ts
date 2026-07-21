import { z } from 'zod';
import { goalStatusSchema } from './common';

// The People screen groups departments with each member's cycle status.
// The status is a server side aggregation of the member's goals, so the
// directory arrives precomputed rather than being joined in the browser.
export const directoryEntrySchema = z.object({
  departmentId: z.string(),
  managerId: z.string(),
  members: z.array(
    z.object({
      userId: z.string(),
      cycleStatus: goalStatusSchema,
    }),
  ),
});

export const directorySchema = z.array(directoryEntrySchema);
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;
