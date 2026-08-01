import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const evidenceTypeSchema = z.enum([
  'document',
  'screenshot',
  'config',
  'log',
  'scan_result',
  'network_capture',
  'certificate',
  'interview',
  'other',
]);

export const evidenceItemStatusSchema = z.enum(['active', 'archived', 'superseded']);

export const uploadEvidenceSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  evidenceType: evidenceTypeSchema,
  retentionUntil: z.coerce.date().optional(),
  tags: z.array(z.string().max(100)).max(20).default([]),
});

export const updateEvidenceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

export const linkEvidenceSchema = z.object({
  entityType: z.enum(['finding', 'assessment', 'risk', 'csms_element']),
  entityId: uuidSchema,
});

export type UploadEvidenceInput = z.infer<typeof uploadEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
export type LinkEvidenceInput = z.infer<typeof linkEvidenceSchema>;
