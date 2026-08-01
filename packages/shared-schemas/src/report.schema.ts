import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const reportTypeSchema = z.enum([
  'assessment_summary',
  'risk_register',
  'csms_gap',
  'zone_topology',
  'purdue_compliance',
  'remediation_status',
  'executive',
  'audit_trail',
  'certification_evidence',
  'custom',
]);

export const reportFormatSchema = z.enum(['pdf', 'xlsx', 'pptx']);

export const reportScopeSchema = z.enum(['tenant', 'engagement', 'register']);

export const reportConfigSchema = z.object({
  scope: reportScopeSchema,
  scopeId: uuidSchema.optional(),
  dateRange: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .optional(),
  includeSections: z.array(z.string().max(200)).default([]),
  format: reportFormatSchema.default('pdf'),
});

export const generateReportSchema = z.object({
  type: reportTypeSchema,
  title: z.string().max(500).optional(),
  config: reportConfigSchema,
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type ReportConfigInput = z.infer<typeof reportConfigSchema>;
