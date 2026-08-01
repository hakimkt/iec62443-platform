import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const findingSeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'informational']);
export const findingStatusSchema = z.enum([
  'draft',
  'open',
  'acknowledged',
  'remediation_planned',
  'in_progress',
  'verification',
  'verified',
  'closed',
  'false_positive',
  'risk_accepted',
]);
export const findingSourceSchema = z.enum(['manual', 'scanner', 'import']);

export const createFindingSchema = z.object({
  engagementId: uuidSchema.optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  severity: findingSeveritySchema,
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  iecRequirement: z.string().max(100).optional(),
  assetIds: z.array(uuidSchema).default([]),
  zoneIds: z.array(uuidSchema).default([]),
  riskIds: z.array(uuidSchema).default([]),
  assignedTo: uuidSchema.optional(),
  dueDate: z.coerce.date().optional(),
  source: findingSourceSchema.default('manual'),
  externalRef: z.string().max(255).optional(),
});

export const updateFindingSchema = createFindingSchema.partial().omit({ source: true });

export const transitionFindingSchema = z.object({
  toStatus: findingStatusSchema,
  reason: z.string().max(5000).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(10000),
  isInternal: z.boolean().default(false),
});

export const bulkImportFindingsSchema = z.object({
  findings: z.array(createFindingSchema).min(1).max(500),
});

export type CreateFindingInput = z.infer<typeof createFindingSchema>;
export type UpdateFindingInput = z.infer<typeof updateFindingSchema>;
export type TransitionFindingInput = z.infer<typeof transitionFindingSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type BulkImportFindingsInput = z.infer<typeof bulkImportFindingsSchema>;
