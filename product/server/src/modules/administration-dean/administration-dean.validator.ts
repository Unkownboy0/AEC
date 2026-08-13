import { z } from 'zod';

export const administrationDashboardQuerySchema = z.object({
  periodDays: z.coerce.number().int().min(7).max(365).default(30),
});

export const administrationExportQuerySchema = z.object({
  format: z.enum(['PDF', 'EXCEL']),
});

export const administrationDeanRoles = ['Admission Dean', 'Administration & Admission Dean'];
export const normalizeAdministrationRole = (role: string) => role.toUpperCase().replace(/[\s_&-]+/g, '');
export const isAdministrationDeanRole = (role: string) => ['ADMISSIONDEAN', 'ADMINISTRATIONADMISSIONDEAN', 'ADMINISTRATIONANDADMISSIONDEAN'].includes(normalizeAdministrationRole(role));
