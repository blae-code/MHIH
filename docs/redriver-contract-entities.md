# Red River Contract Entities

This document defines Base44 entities required for the Red River OS analytics module boundary.

## Required entities

## DatasetManifest
Required fields:
- `dataset_id` (string, unique)
- `name` (string)
- `description` (string|null)
- `steward` (string|null)
- `license` (string|null)
- `refresh_interval_days` (number)
- `schema` (json)
- `schema_hash` (string)
- `projection_policy_id` (string)
- `status` (`active`|`deprecated`)
- `version` (number)

## MetricDefinition
Required fields:
- `metric_id` (string, unique)
- `name` (string)
- `description` (string|null)
- `category` (string)
- `unit` (string|null)
- `value_type` (`number`|`rate`|`percent`|`index`|`string`)
- `direction` (`higher_is_better`|`lower_is_better`|`neutral`)
- `dimensions` (json array)
- `default_filters` (json)
- `suppression` (json)
- `dataset_ids` (array[string])
- `method_notes` (string|null)
- `owner` (string|null)
- `status` (`active`|`deprecated`)
- `version` (number)
- `sensitivity_tier` (`public`|`internal`|`restricted`|`sensitive`, optional)

## EvidenceSnapshot
Required fields:
- `snapshot_id` (string, unique)
- `title` (string)
- `query` (json)
- `metric_ids` (array[string])
- `dataset_ids` (array[string])
- `series_manifest` (json)
- `data` (json)
- `render_manifest` (json)
- `artifacts` (json|null)
- `projection_mode` (`internal`|`projected`)
- `hash` (string)
- `created_by` (string)
- `created_at` (datetime string)

## Existing entity compatibility extensions

## HealthMetric
Recommended extensions for Red River compatibility:
- `metric_id` (string)
- `dataset_id` (string)
- `dimensions` (json)
- `n` (number|null)
- `suppression_applied` (boolean)
- `suppression_reason` (string|null)

## AIInsight / AlertEvent / Recommendation / DecisionMemo
Recommended normalization overlay for module boundary:
- `insight_id`
- `insight_type`
- `metric_ids`
- `dataset_ids`
- `evidence_snapshot_ids`
- `projection_safe`
- `sensitivity_tier`
