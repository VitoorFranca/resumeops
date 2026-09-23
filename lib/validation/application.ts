import { z } from 'zod';

export const applicationPatchSchema = z.object({
  status: z.enum(['Evaluated', 'Applied', 'Interview', 'Offer', 'Rejected', 'Discarded']).optional(),
  notes: z.string().nullable().optional(),
});
