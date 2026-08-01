import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const riskCategorySchema = z.enum(['safety', 'operational', 'environmental', 'financial', 'reputational', 'regulatory']);
export const riskTreatmentSchema = z.enum(['mitigate', 'transfer', 'accept', 'avoid', 'pending']);
export const treatmentStatusSchema = z.enum(['planned', 'in_progress', 'completed', 'cancelled']);

export const createRegisterSchema = z.object({
  name: z.string().min(1).max(500),
  scopeType: z.string().max(50).optional(),
  scopeId: uuidSchema.optional(),
  ownerId: uuidSchema.optional(),
});

export const createRiskSchema = z.object({
  registerId: uuidSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  category: riskCategorySchema.optional(),
  threatSource: z.string().max(200).optional(),
  vulnerability: z.string().max(5000).optional(),
  assetIds: z.array(uuidSchema).default([]),
  zoneIds: z.array(uuidSchema).default([]),
  likelihood: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  treatment: riskTreatmentSchema.optional(),
  residualLikelihood: z.number().int().min(1).max(5).optional(),
  residualImpact: z.number().int().min(1).max(5).optional(),
  riskOwnerId: uuidSchema.optional(),
  iecRequirement: z.string().max(100).optional(),
  reassessBy: z.coerce.date().optional(),
});

export const updateRiskSchema = createRiskSchema.partial().omit({ registerId: true });

export const createTreatmentSchema = z.object({
  type: z.string().max(30),
  description: z.string().min(1).max(5000),
  responsibleId: uuidSchema.optional(),
  targetDate: z.coerce.date().optional(),
  costEstimate: z.number().min(0).optional(),
});

export const riskAcceptanceSchema = z.object({
  justification: z.string().min(10).max(5000),
  expiresAt: z.coerce.date().optional(),
  reviewDate: z.coerce.date().optional(),
});

export const matrixConfigSchema = z.object({
  likelihoodLabels: z.array(z.string()).length(5),
  impactLabels: z.array(z.string()).length(5),
  thresholds: z.object({
    low: z.tuple([z.number(), z.number()]),
    medium: z.tuple([z.number(), z.number()]),
    high: z.tuple([z.number(), z.number()]),
    critical: z.tuple([z.number(), z.number()]),
  }),
  colorScheme: z.record(z.string()).default({}),
});

export type CreateRegisterInput = z.infer<typeof createRegisterSchema>;
export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
export type RiskAcceptanceInput = z.infer<typeof riskAcceptanceSchema>;
export type MatrixConfigInput = z.infer<typeof matrixConfigSchema>;
