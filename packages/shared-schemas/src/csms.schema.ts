import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const csmsElementCategorySchema = z.enum([
  'SM-1',
  'SM-2',
  'SM-3',
  'SM-4',
  'SM-5',
  'SM-6',
  'SM-7',
  'SM-8',
  'SM-9',
  'SM-10',
  'SM-11',
  'SM-12',
]);

export const CSMS_ELEMENT_LABELS: Record<string, string> = {
  'SM-1': 'Cybersecurity policy',
  'SM-2': 'Organization and cybersecurity awareness',
  'SM-3': 'Cybersecurity risk assessment',
  'SM-4': 'Cybersecurity program',
  'SM-5': 'Personnel cybersecurity',
  'SM-6': 'Physical security',
  'SM-7': 'Incident response and recovery',
  'SM-8': 'Change management',
  'SM-9': 'System development and maintenance',
  'SM-10': 'Supplier and third-party management',
  'SM-11': 'Compliance',
  'SM-12': 'Continuous improvement',
};

export const implementationStatusSchema = z.enum(['implemented', 'partial', 'planned', 'not_started', 'na']);
export const policyStatusSchema = z.enum(['draft', 'review', 'approved', 'deprecated']);
export const improvementPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const createFrameworkSchema = z.object({
  name: z.string().min(1).max(255),
  organizationId: uuidSchema.optional(),
  version: z.string().max(20).default('1.0'),
});

export const createElementSchema = z.object({
  category: csmsElementCategorySchema,
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  requirementRef: z.string().max(100).optional(),
  implementationStatus: implementationStatusSchema.optional(),
  maturityScore: z.number().int().min(0).max(4).optional(),
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

export const updateFrameworkSchema = createFrameworkSchema.partial().extend({
  status: z.string().max(50).optional(),
});

export type CreateFrameworkInput = z.infer<typeof createFrameworkSchema>;
export type CreateElementInput = z.infer<typeof createElementSchema>;
export type UpdateElementInput = z.infer<typeof updateElementSchema>;
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type ApprovePolicyInput = z.infer<typeof approvePolicySchema>;
export type CreateImprovementPlanInput = z.infer<typeof createImprovementPlanSchema>;
