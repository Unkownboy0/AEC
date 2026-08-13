import { z } from 'zod';

export const principalDashboardQuerySchema = z.object({
  periodDays: z.coerce.number().int().min(7).max(365).default(30),
  departmentId: z.string().uuid().optional(),
});

export const principalReturnSchema = z.object({
  remarks: z.string().trim().min(3).max(1000),
});
