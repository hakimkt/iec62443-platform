import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const implementationStatusSchema = z.enum(['implemented', 'partial', 'planned', 'not_started', 'na']);
export const policyStatusSchema = z.enum(['draft', 'review', 'approved', 'deprecated']);
export const improvementPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const createFrameworkSchema = z.object({
  name: z.string().min(1).max(255),
  organizationId: uuidSchema.optional(),
  version: z.string().max(20).default('1.0'),
});

export const createElementSchema = z.object({
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  requirementRef: z.string().max(100).optional(),
  implementationStatus: implementationStatusSchema.optional(),
  maturityScore: z.number().int().min(0).max(5).optional(),
  ownerId: uuidSchema.optional(),
  nextReview: z.coerce.date().optional(),
});

export const updateElementSchema = createElementSchema.partial();

export const createPolicySchema = z.object({
  elementId: uuidSchema.optional(),
  title: z.string().min(1).max(500),
  version: z.string().max(20).default('1.0'),
  body: z.string().max(100000).optional(),
  reviewCycle: z.number().int().min(1).default(365),
});

export const updatePolicySchema = createPolicySchema.partial();

export const approvePolicySchema = z.object({
  comment: z.string().max(5000).optional(),
});

export const createImprovementPlanSchema = z.object({
  elementId: uuidSchema.optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  priority: improvementPrioritySchema.optional(),
  targetDate: z.coerce.date().optional(),
  ownerId: uuidSchema.optional(),
});

export type CreateFrameworkInput = z.infer<typeof createFrameworkSchema>;
export type CreateElementInput = z.infer<typeof createElementSchema>;
export type UpdateElementInput = z.infer<typeof updateElementSchema>;
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type ApprovePolicyInput = z.infer<typeof approvePolicySchema>;
export type CreateImprovementPlanInput = z.infer<typeof createImprovementPlanSchema>;
