import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const createPurdueModelSchema = z.object({
  name: z.string().min(1).max(255),
  facilityId: uuidSchema.optional(),
  description: z.string().max(5000).optional(),
  isDefault: z.boolean().default(false),
});

export const createLevelSchema = z.object({
  levelNumber: z.number().min(0).max(5.5),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const assetMappingSchema = z.object({
  assetId: uuidSchema,
  levelId: uuidSchema,
});

export const communicationRuleSchema = z.object({
  sourceLevelId: uuidSchema,
  targetLevelId: uuidSchema,
  isAllowed: z.boolean().default(false),
  condition: z.string().max(1000).optional(),
  protocol: z.string().max(100).optional(),
});

export const updatePurdueModelSchema = createPurdueModelSchema.partial();
export const updateLevelSchema = createLevelSchema.partial();
export const updateCommunicationRuleSchema = communicationRuleSchema.partial();

export type CreatePurdueModelInput = z.infer<typeof createPurdueModelSchema>;
export type CreateLevelInput = z.infer<typeof createLevelSchema>;
export type AssetMappingInput = z.infer<typeof assetMappingSchema>;
export type CommunicationRuleInput = z.infer<typeof communicationRuleSchema>;
