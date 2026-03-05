export type ProjectionMode = "internal" | "projected";

export type SensitivityTier = "public" | "internal" | "restricted" | "sensitive";

export type MetricDirection = "higher_is_better" | "lower_is_better" | "neutral";

export type MetricValueType = "number" | "rate" | "percent" | "index" | "string";

export type DimensionType = "string" | "number" | "boolean" | "date";

export interface DatasetContract {
  dataset_id: string;
  name: string;
  description?: string | null;
  version: number;
  steward?: string | null;
  license?: string | null;
  refresh_interval_days: number;
  schema: Record<string, unknown>;
  schema_hash: string;
  projection_policy_id: string;
  status: "active" | "deprecated";
}

export interface MetricDimension {
  key: string;
  label: string;
  type: DimensionType;
  allowed_values?: Array<string | number | boolean>;
}

export interface MetricSuppressionPolicy {
  min_n?: number;
  rounding?: {
    mode?: "fixed" | "none";
    decimals?: number;
  };
  redact_dims?: string[];
  topcode?: number | null;
}

export interface MetricContract {
  metric_id: string;
  name: string;
  description?: string | null;
  category: string;
  unit?: string | null;
  value_type: MetricValueType;
  direction: MetricDirection;
  dimensions: MetricDimension[];
  default_filters: Record<string, unknown>;
  suppression: MetricSuppressionPolicy;
  dataset_ids: string[];
  method_notes?: string | null;
  owner?: string | null;
  status: "active" | "deprecated";
  version: number;
  sensitivity_tier?: SensitivityTier;
}

export interface SeriesPoint {
  year: number;
  value: number | string | null;
  n?: number | null;
  suppression_applied?: boolean;
  suppression_reason?: string | null;
  dimensions?: Record<string, unknown>;
}

export interface Series {
  metric_id: string;
  metric_name?: string;
  dataset_ids: string[];
  series_key: string;
  dimensions: Record<string, unknown>;
  points: SeriesPoint[];
}

export interface SeriesManifest {
  hash: string;
  metric_ids: string[];
  dataset_ids: string[];
  dimension_keys: string[];
  projection_mode: ProjectionMode;
  time: {
    from: number;
    to: number;
  };
  total_series: number;
  total_points: number;
  generated_at: string;
}

export interface InsightContract {
  insight_id: string;
  insight_type: "alert" | "ai_insight" | "recommendation" | "memo";
  metric_ids: string[];
  dataset_ids: string[];
  evidence_snapshot_ids: string[];
  confidence_score: number;
  uncertainty?: Record<string, unknown> | string | null;
  projection_safe: boolean;
  sensitivity_tier: SensitivityTier;
}

export interface EvidenceSnapshotContract {
  snapshot_id: string;
  title: string;
  query: Record<string, unknown>;
  metric_ids: string[];
  dataset_ids: string[];
  series_manifest: SeriesManifest;
  data: Series[];
  render_manifest: Record<string, unknown>;
  artifacts?: Record<string, unknown> | null;
  projection_mode: ProjectionMode;
  hash: string;
  created_by: string;
  created_at: string;
}
