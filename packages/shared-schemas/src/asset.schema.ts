import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const assetTypeSchema = z.enum([
  'plc',
  'hmi',
  'scada_server',
  'engineering_workstation',
  'switch',
  'router',
  'firewall',
  'historian',
  'mes',
  'erp',
  'server',
  'workstation',
  'sensor',
  'actuator',
  'vfd',
  'dcs_controller',
  'rtu',
  'safety_controller',
  'other',
]);

export const assetCriticalitySchema = z.enum([
  'safety_critical',
  'mission_critical',
  'business_critical',
  'operational',
  'non_critical',
]);

export const operationalStatusSchema = z.enum([
  'operational',
  'maintenance',
  'decommissioned',
  'standby',
]);

export const relationshipTypeSchema = z.enum([
  'communicates_with',
  'depends_on',
  'controls',
  'monitored_by',
  'connected_to',
]);

export const createAssetSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  type: assetTypeSchema,
  criticality: assetCriticalitySchema.optional(),
  vendor: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  firmwareVersion: z.string().max(100).optional(),
  serialNumber: z.string().max(255).optional(),
  ipAddress: z.string().max(45).optional(),
  macAddress: z.string().max(17).optional(),
  networkSegment: z.string().max(255).optional(),
  purdueLevel: z.number().int().min(0).max(5).optional(),
  zoneId: uuidSchema.optional(),
  location: z.string().max(500).optional(),
  operationalStatus: operationalStatusSchema.default('operational'),
  installDate: z.coerce.date().optional(),
  lastPatchDate: z.coerce.date().optional(),
  eolDate: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateAssetSchema = createAssetSchema.partial();

export const assetRelationshipSchema = z.object({
  targetAssetId: uuidSchema,
  relationshipType: relationshipTypeSchema,
  protocol: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetRelationshipInput = z.infer<typeof assetRelationshipSchema>;
