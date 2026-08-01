import { z } from 'zod';
import { securityLevelSchema, uuidSchema } from './common.schema.js';

export const zoneTypeSchema = z.enum([
  'process_control',
  'safety_instrumented',
  'manufacturing_ops',
  'enterprise_it',
  'idmz',
  'remote_access',
  'wireless',
  'custom',
]);

export const conduitTypeSchema = z.enum(['hardwired', 'network', 'wireless', 'removable_media', 'human', 'other']);

export const createZoneSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  zoneType: zoneTypeSchema.optional(),
  securityLevel: securityLevelSchema.optional(),
  targetSl: securityLevelSchema.optional(),
  achievedSl: securityLevelSchema.optional(),
  parentZoneId: uuidSchema.optional(),
  purdueLevel: z.coerce.number().int().min(0).max(5).optional(),
  facilityId: uuidSchema.optional(),
  diagramX: z.number().optional(),
  diagramY: z.number().optional(),
  diagramWidth: z.number().positive().optional(),
  diagramHeight: z.number().positive().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateZoneSchema = createZoneSchema.partial();

export const createConduitSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  sourceZoneId: uuidSchema,
  targetZoneId: uuidSchema,
  conduitType: conduitTypeSchema,
  protocol: z.string().max(100).optional(),
  securityLevel: securityLevelSchema.optional(),
  targetSl: securityLevelSchema.optional(),
  achievedSl: securityLevelSchema.optional(),
  encryption: z.boolean().optional(),
  authentication: z.boolean().optional(),
  monitoring: z.boolean().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateConduitSchema = createConduitSchema.partial().omit({ sourceZoneId: true, targetZoneId: true });

export const zoneMembershipSchema = z.object({
  assetId: uuidSchema,
});

export const segmentationRuleSchema = z.object({
  ruleType: z.string().max(50),
  description: z.string().max(5000).optional(),
  direction: z.enum(['inbound', 'outbound', 'bidirectional']).optional(),
  action: z.enum(['allow', 'deny', 'inspect', 'proxy']).optional(),
  isCompliant: z.boolean().default(true),
});

export const topologyUpdateSchema = z.object({
  zones: z.array(
    z.object({
      id: uuidSchema,
      diagramX: z.number().optional(),
      diagramY: z.number().optional(),
      diagramWidth: z.number().positive().optional(),
      diagramHeight: z.number().positive().optional(),
    }),
  ),
});

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type CreateConduitInput = z.infer<typeof createConduitSchema>;
export type UpdateConduitInput = z.infer<typeof updateConduitSchema>;
export type ZoneMembershipInput = z.infer<typeof zoneMembershipSchema>;
export type SegmentationRuleInput = z.infer<typeof segmentationRuleSchema>;
export type TopologyUpdateInput = z.infer<typeof topologyUpdateSchema>;
