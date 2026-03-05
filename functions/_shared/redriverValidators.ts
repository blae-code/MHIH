import { z } from 'npm:zod@3.24.2';

export const projectionModeSchema = z.enum(['internal', 'projected']);

export const listDatasetsRequestSchema = z.object({
  includeDeprecated: z.boolean().optional().default(false),
});

export const listMetricsRequestSchema = z.object({
  dataset_id: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'deprecated']).optional(),
});

export const queryMetricSeriesRequestSchema = z.object({
  metric_ids: z.array(z.string().min(1)).min(1),
  filters: z.record(z.any()).optional().default({}),
  time: z.object({
    from: z.number().int().min(1900),
    to: z.number().int().min(1900),
  }),
  projection_mode: projectionModeSchema.optional().default('projected'),
});

export const createEvidenceSnapshotRequestSchema = z.object({
  title: z.string().min(1),
  query: queryMetricSeriesRequestSchema,
  artifacts: z
    .object({
      charts: z.array(z.object({
        title: z.string().optional(),
        png_data_url: z.string().optional(),
      })).optional(),
      notes: z.string().optional(),
    })
    .optional(),
  projection_mode: projectionModeSchema.optional().default('projected'),
});

export const getEvidenceSnapshotRequestSchema = z.object({
  snapshot_id: z.string().min(1),
  projection_mode: projectionModeSchema.optional(),
});

export const exportEvidenceSnapshotRequestSchema = z.object({
  snapshot_id: z.string().min(1),
  format: z.enum(['json', 'csv', 'pdf']),
  projection_mode: projectionModeSchema.optional(),
});

export function parseOrThrow(schema: z.ZodTypeAny, payload: unknown, code = 'invalid_request') {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  const error = new Error('Request validation failed');
  (error as any).status = 400;
  (error as any).code = code;
  (error as any).details = result.error.flatten();
  throw error;
}
