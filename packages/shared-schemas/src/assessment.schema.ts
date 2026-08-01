import { z } from 'zod';
import { foundationRequirementSchema, iecPartSchema, securityLevelSchema, uuidSchema } from './common.schema.js';

export const assessmentTypeSchema = z.enum(['gap', 'system', 'component', 'csms', 'custom']);
export const assessmentStatusSchema = z.enum(['draft', 'in_progress', 'review', 'completed', 'archived']);
export const maturityLevelSchema = z.coerce.number().int().min(0).max(4);

export const requirementRefSchema = z.string().regex(
  /^FR-[1-7](?:\.SR-[1-9]\d*(?:\.[1-9]\d*)*)?$/,
  'Must follow IEC 62443 FR/SR/SRE format (e.g., FR-1, FR-1.SR-1, FR-1.SR-1.1)',
);

export const MATURITY_LEVEL_LABELS: Record<number, string> = {
  0: 'Initial',
  1: 'Managed',
  2: 'Defined',
  3: 'Implemented',
  4: 'Improving',
};

export const createEngagementSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  type: assessmentTypeSchema,
  iecPart: iecPartSchema.optional(),
  scopeSystemId: uuidSchema.optional(),
  targetSl: securityLevelSchema.optional(),
  leadAssessorId: uuidSchema.optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
  templateId: uuidSchema,
});

export const updateEngagementSchema = createEngagementSchema.partial().extend({
  status: assessmentStatusSchema.optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  iecPart: iecPartSchema,
  version: z.string().min(1).max(20),
  sections: z.array(z.unknown()).default([]),
  foundationRequirement: foundationRequirementSchema.optional(),
});

export const submitResponseSchema = z.object({
  score: z.number().int().min(0).max(4).optional(),
  maturityLevel: maturityLevelSchema.optional(),
  assessorNotes: z.string().max(10000).optional(),
  evidenceRefs: z.array(uuidSchema).default([]),
  findingRefs: z.array(uuidSchema).default([]),
});

export const batchResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        questionId: uuidSchema,
        score: z.number().int().min(0).max(4).optional(),
        maturityLevel: maturityLevelSchema.optional(),
        assessorNotes: z.string().max(10000).optional(),
        evidenceRefs: z.array(uuidSchema).default([]),
        findingRefs: z.array(uuidSchema).default([]),
      }),
    )
    .min(1)
    .max(100),
});

export type CreateEngagementInput = z.infer<typeof createEngagementSchema>;
export type UpdateEngagementInput = z.infer<typeof updateEngagementSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
export type BatchResponseInput = z.infer<typeof batchResponseSchema>;
