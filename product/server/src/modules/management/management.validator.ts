import { z } from 'zod';

export const managementQuerySchema = z.object({
  periodDays: z.coerce.number().int().min(7).max(365).default(30),
  departmentId: z.string().uuid().optional(),
});
