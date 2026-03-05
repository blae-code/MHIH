import { z } from "zod";

export const projectionModeSchema = z.enum(["internal", "projected"]);
export const sensitivityTierSchema = z.enum(["public", "internal", "restricted", "sensitive"]);
export const metricDirectionSchema = z.enum(["higher_is_better", "lower_is_better", "neutral"]);
export const metricValueTypeSchema = z.enum(["number", "rate", "percent", "index", "string"]);

export const metricDimensionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "date"]),
  allowed_values: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const datasetContractSchema = z.object({
  dataset_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  version: z.number().int().min(1),
  steward: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
  refresh_interval_days: z.number().int().min(0),
  schema: z.record(z.any()),
  schema_hash: z.string().min(1).optional(),
  projection_policy_id: z.string().min(1),
  status: z.enum(["active", "deprecated"]),
});

export const metricContractSchema = z.object({
  metric_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().min(1),
  unit: z.string().nullable().optional(),
  value_type: metricValueTypeSchema,
  direction: metricDirectionSchema,
  dimensions: z.array(metricDimensionSchema),
  default_filters: z.record(z.any()).default({}),
  suppression: z
    .object({
      min_n: z.number().int().min(0).optional(),
      rounding: z
        .object({
          mode: z.enum(["fixed", "none"]).optional(),
          decimals: z.number().int().min(0).max(6).optional(),
        })
        .optional(),
      redact_dims: z.array(z.string()).optional(),
      topcode: z.number().nullable().optional(),
    })
    .default({}),
  dataset_ids: z.array(z.string().min(1)).min(1),
  method_notes: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  status: z.enum(["active", "deprecated"]),
  version: z.number().int().min(1),
  sensitivity_tier: sensitivityTierSchema.optional(),
});

export const listDatasetsRequestSchema = z.object({
  includeDeprecated: z.boolean().optional().default(false),
});

export const listDatasetsResponseSchema = z.object({
  datasets: z.array(datasetContractSchema),
});

export const listMetricsRequestSchema = z.object({
  dataset_id: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["active", "deprecated"]).optional(),
});

export const listMetricsResponseSchema = z.object({
  metrics: z.array(metricContractSchema),
});

export const queryMetricSeriesRequestSchema = z.object({
  metric_ids: z.array(z.string().min(1)).min(1),
  filters: z.record(z.any()).default({}),
  time: z.object({
    from: z.number().int().min(1900),
    to: z.number().int().min(1900),
  }),
  projection_mode: projectionModeSchema.default("projected"),
});

export const seriesPointSchema = z.object({
  year: z.number().int(),
  value: z.union([z.number(), z.string(), z.null()]),
  n: z.number().int().nullable().optional(),
  suppression_applied: z.boolean().optional(),
  suppression_reason: z.string().nullable().optional(),
  dimensions: z.record(z.any()).optional(),
});

export const seriesSchema = z.object({
  metric_id: z.string(),
  metric_name: z.string().optional(),
  dataset_ids: z.array(z.string()),
  series_key: z.string(),
  dimensions: z.record(z.any()),
  points: z.array(seriesPointSchema),
});

export const seriesManifestSchema = z.object({
  hash: z.string(),
  metric_ids: z.array(z.string()),
  dataset_ids: z.array(z.string()),
  dimension_keys: z.array(z.string()),
  projection_mode: projectionModeSchema,
  time: z.object({
    from: z.number().int(),
    to: z.number().int(),
  }),
  total_series: z.number().int().min(0),
  total_points: z.number().int().min(0),
  generated_at: z.string(),
});

export const queryMetricSeriesResponseSchema = z.object({
  series: z.array(seriesSchema),
  manifest: seriesManifestSchema,
  projection_audit: z.object({
    projection_mode: projectionModeSchema,
    suppressed_points: z.number().int().min(0),
    rounded_points: z.number().int().min(0),
    redacted_dimensions: z.array(z.string()),
  }),
});

export const createEvidenceSnapshotRequestSchema = z.object({
  title: z.string().min(1),
  query: queryMetricSeriesRequestSchema,
  artifacts: z
    .object({
      charts: z
        .array(
          z.object({
            title: z.string().optional(),
            png_data_url: z.string().optional(),
          }),
        )
        .optional(),
      notes: z.string().optional(),
    })
    .optional(),
  projection_mode: projectionModeSchema.default("projected"),
});

export const createEvidenceSnapshotResponseSchema = z.object({
  snapshot_id: z.string().min(1),
  hash: z.string().min(1),
});

export const getEvidenceSnapshotRequestSchema = z.object({
  snapshot_id: z.string().min(1),
  projection_mode: projectionModeSchema.optional(),
});

export const getEvidenceSnapshotResponseSchema = z.object({
  snapshot: z.object({
    snapshot_id: z.string(),
    title: z.string(),
    query: z.record(z.any()),
    metric_ids: z.array(z.string()),
    dataset_ids: z.array(z.string()),
    series_manifest: seriesManifestSchema,
    data: z.array(seriesSchema),
    render_manifest: z.record(z.any()),
    artifacts: z.record(z.any()).nullable().optional(),
    projection_mode: projectionModeSchema,
    hash: z.string(),
    created_by: z.string(),
    created_at: z.string(),
  }),
});

export const exportEvidenceSnapshotRequestSchema = z.object({
  snapshot_id: z.string().min(1),
  format: z.enum(["json", "csv", "pdf"]),
  projection_mode: projectionModeSchema.optional(),
});

export const exportEvidenceSnapshotResponseSchema = z.object({
  format: z.enum(["json", "csv", "pdf"]),
  file_name: z.string(),
  mime_type: z.string(),
  content_base64: z.string().min(1),
});

export function parseOrThrow(schema, payload, options = {}) {
  const code = options.code || "invalid_request";
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  const message = options.message || "Request validation failed";
  const error = new Error(message);
  error.code = code;
  error.details = result.error.flatten();
  throw error;
}
