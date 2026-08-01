import { z } from 'zod';
import { emailSchema, passwordSchema } from './common.schema.js';

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const mfaSetupSchema = z.object({});

export const mfaVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
  secret: z.string().min(1),
});

export const mfaChallengeSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
  requestId: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type MfaChallengeInput = z.infer<typeof mfaChallengeSchema>;
