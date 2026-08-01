import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const remediationStatusSchema = z.enum(['planned', 'in_progress', 'completed', 'cancelled', 'overdue']);
export const verificationResultSchema = z.enum(['passed', 'failed', 'partial']);

export const createPlanSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  findingIds: z.array(uuidSchema).default([]),
  riskIds: z.array(uuidSchema).default([]),
  ownerId: uuidSchema.optional(),
  budgetEstimate: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const createActionSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  findingId: uuidSchema.optional(),
  riskId: uuidSchema.optional(),
  assigneeId: uuidSchema.optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  costEstimate: z.number().min(0).optional(),
  milestone: z.string().max(500).optional(),
});

export const updateActionSchema = createActionSchema.partial();

export const verifyActionSchema = z.object({
  result: verificationResultSchema,
  notes: z.string().max(5000).optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type VerifyActionInput = z.infer<typeof verifyActionSchema>;
