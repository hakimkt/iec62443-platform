import { z } from 'zod';

export const dashboardSummaryQuerySchema = z.object({
  dateRange: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .optional(),
});

export const riskHeatMapQuerySchema = z.object({
  registerId: z.string().uuid().optional(),
});

export const remediationStatusQuerySchema = z.object({
  dateRange: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .optional(),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
export type RiskHeatMapQuery = z.infer<typeof riskHeatMapQuerySchema>;
export type RemediationStatusQuery = z.infer<typeof remediationStatusQuerySchema>;
