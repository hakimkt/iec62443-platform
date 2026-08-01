import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const slugSchema = z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const emailSchema = z.string().email().max(320);
export const passwordSchema = z
  .string()
  .min(14)
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
  );
export const securityLevelSchema = z.coerce.number().int().min(0).max(4);
export const purdueLevelSchema = z.coerce.number().min(0).max(5);
export const iecPartSchema = z.enum(['3-2', '3-3', '4-1', '4-2', '2-1']);

export const foundationRequirementSchema = z.enum([
  'FR-1',
  'FR-2',
  'FR-3',
  'FR-4',
  'FR-5',
  'FR-6',
  'FR-7',
]);

export const FR_LABELS: Record<string, string> = {
  'FR-1': 'Identification and authentication control',
  'FR-2': 'Use control',
  'FR-3': 'System integrity',
  'FR-4': 'Data confidentiality',
  'FR-5': 'Restricted data flow',
  'FR-6': 'Timely response to events',
  'FR-7': 'Resource availability',
};
export const metadataSchema = z.record(z.unknown()).default({});
export const tagsSchema = z.array(z.string().max(100)).max(20).default([]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().max(200).optional(),
});

export const filterOperatorSchema = z.enum(['eq', 'neq', 'in', 'gt', 'gte', 'lt', 'lte', 'like']);

export const searchSchema = z.string().max(200).optional();

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const positiveIntSchema = z.coerce.number().int().positive();

export const listQueryParamsSchema = paginationSchema.extend({
  search: searchSchema,
  include: z.string().max(500).optional(),
  fields: z.string().max(500).optional(),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        }),
      )
      .optional(),
  }),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string(),
  }),
});

export const paginatedResponseSchema = z.object({
  pagination: z.object({
    page: z.number().int(),
    perPage: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string(),
  }),
});
