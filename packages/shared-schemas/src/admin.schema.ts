import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  permissions: z.array(z.string().max(200)).min(1),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  permissions: z.array(z.string().max(200)).min(1).optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string().max(200)).default([]),
  expiresAt: z.coerce.date().optional(),
});

export const createWebhookSchema = z.object({
  url: z.string().url().max(2000),
  events: z.array(z.string().max(200)).min(1),
  secret: z.string().max(200).optional(),
  active: z.boolean().default(true),
});

export const updateWebhookSchema = z.object({
  url: z.string().url().max(2000).optional(),
  events: z.array(z.string().max(200)).min(1).optional(),
  secret: z.string().max(200).optional(),
  active: z.boolean().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
