# MHIP Analytics Methodology Audit (March 4, 2026)

## Scope
- Functions audited:
  - `runScenarioSimulation`
  - `runCausalAnalysis` (associational driver analysis)
  - `runSentinelScan`
  - `runForecastBacktest`
- Dashboard interpretation audited:
  - `HealthTrendTracker`
  - `TrendingMetrics`
  - `RegionalPerformance`
  - `DisparityExplorer`

## Decision Safety Defaults
- Metric direction semantics are explicit and shared (`higher_is_better`, `lower_is_better`, `neutral`).
- When direction cannot be inferred, output is treated as contextual/neutral and confidence is bounded.
- Approval/publish actions remain human-gated for high-impact outputs.

## Formula and Logic Summary

### 1) Scenario Simulation (`runScenarioSimulation`)
- Baseline model: linear regression on year vs value.
- Intervention effect:
  - `scenario = baseline * (1 - (1 - multiplier) * coverage)`
  - `multiplier = 1 + direction * magnitude_pct/100`, clamped by policy bounds.
- Confidence score combines:
  - sample size,
  - fit quality (`R^2`),
  - source freshness,
  - evidence grade.
- Uncertainty:
  - residual standard deviation from model fit,
  - 95% confidence interval using `1.96 * sigma * sqrt(horizon)`.
- Determinism:
  - deterministic seed recorded,
  - assumptions hash stored (`fnv1a_*`) for reproducibility.
- Low-confidence guard:
  - recommendations are blocked when confidence is weak (mean confidence below threshold).

### 2) Driver Analysis (`runCausalAnalysis`)
- Method label is explicitly associational (not causal proof).
- Candidate drivers use lag-aware pairings (`lag = 0..N years`) and select strongest absolute correlation.
- Minimum sample gating before ranking.
- Uncertainty:
  - correlation confidence interval via Fisher transform.
- Confidence score combines:
  - effect size,
  - sample size,
  - freshness,
  - evidence quality,
  - lag penalty.
- Output includes:
  - `analysis_type`,
  - `lag_years`,
  - `sample_size`,
  - `uncertainty_interval`,
  - caveat text on confounding/selection bias risk.

### 3) Sentinel Alerts (`runSentinelScan`)
- Change detection uses robust statistics:
  - latest first-difference vs median baseline difference,
  - MAD-scaled robust z-score thresholding.
- Trend alert requires both percent change and robust z-score evidence.
- Seasonal suppression:
  - alternating/sign-flip patterns with stable amplitude are suppressed to reduce false positives.
- Disparity alerts are direction-aware:
  - harmful gap progression is computed using metric semantics, not raw sign alone.
- Outputs include confidence and lead-time scoring for triage.

### 4) Forecast Backtesting (`runForecastBacktest`)
- Holdout strategy upgraded from single-point to rolling multi-holdout.
- Error metrics:
  - `MAPE`,
  - `MAE`,
  - `sMAPE`.
- Region/category rollups are computed from per-series aggregates.
- Drift alerts trigger on threshold exceedance and include metric-method context.

### 5) Dashboard Interpretation Layer
- Trend and disparity widgets now use shared metric semantics:
  - improvement/worsening no longer assumes “up = good”.
- Regional performance uses normalized semantics-aware scoring across comparable metrics.
- Benchmark comparison and disparity gap labels are semantics-aware in drilldowns and scatter views.

## Provenance and Traceability
- Scenario and driver outputs include evidence links to source metric IDs.
- Confidence and uncertainty fields are carried into outputs.
- Method metadata is persisted in run assumptions/output payloads.

## Known Limitations
- Associational driver analysis does not identify true causal effects without explicit causal identification strategy.
- Linear scenario model remains interpretable baseline and may underfit nonlinear regimes.
- Benchmark semantics inference relies on metadata + lexical hints when explicit direction fields are absent.

## Verification Outcomes (Code-Level)
- Added runtime validation scripts:
  - `validate:functions` (UI-invoked function existence),
  - `validate:routes` (route references vs registered pages),
  - `validate:roles` (legacy role checks).
- Build and runtime gate outputs are recorded in release validation step before commit/push.
