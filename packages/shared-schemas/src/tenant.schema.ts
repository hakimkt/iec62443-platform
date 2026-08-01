import { z } from 'zod';
import { emailSchema, slugSchema } from './common.schema.js';

export const tenantPlanSchema = z.enum(['professional', 'enterprise']);
export const tenantStatusSchema = z.enum(['trial', 'active', 'suspended', 'archived']);

export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema,
  plan: tenantPlanSchema.default('professional'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  settings: z
    .object({
      locale: z.string().max(10).optional(),
      timezone: z.string().max(50).optional(),
      mfaRequired: z.boolean().optional(),
      passwordExpiryDays: z.number().int().min(0).max(365).optional(),
      sessionTimeoutMinutes: z.number().int().min(5).max(1440).optional(),
      maxConcurrentSessions: z.number().int().min(1).max(20).optional(),
    })
    .optional(),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.string().max(50),
});

export const updateMemberSchema = z.object({
  role: z.string().max(50),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
