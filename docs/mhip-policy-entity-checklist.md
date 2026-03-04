# MHIP Policy Intelligence Entity Checklist

This implementation assumes these Base44 entities exist.

## New entities

- PolicyScenario
  - name, category, region, intervention_type, magnitude_pct, coverage_pct, target_metric_name, notes, status
- ScenarioRun
  - scenario_id, scenario_name, run_type, status, model_version, assumptions (json), inputs_count, outputs_count, output (json), created_by
- Intervention
  - name, category, region, owner, status, expected_kpi, expected_impact_pct, start_date, end_date, notes, created_by
- InterventionOutcome
  - intervention_id, intervention_name, metric_id, metric_name, baseline_year, baseline_value, current_year, current_value, delta_value, delta_pct, status, confidence_score, notes
- EvidenceLink
  - link_type, run_id, memo_id, insight_id, metric_id, metric_name, source_name, evidence_grade, confidence_score, uncertainty, model_version
- Recommendation
  - title, summary, recommendation_type, priority_score, confidence_score, approval_status, requires_approval, scenario_run_id, status, rank
- DecisionMemo
  - title, policy_question, category, region, scenario_run_id, content (json), confidence_score, requires_approval, approval_status, status, generated_by, generated_date, approved_by, approved_date, reviewer_notes
- ApprovalTask
  - entity_type, entity_id, title, status, priority, assigned_to, assigned_to_email, requested_by, due_date, sla_hours, decision, reviewed_by, reviewed_date, notes
- AlertEvent
  - alert_type, severity, status, category, region, metric_name, metric_id, lead_time_score, confidence_score, summary, description, detected_by, detected_at, metadata (json)
- SourceReliabilityProfile
  - source_id, source_name, reliability_score, sync_success_rate, freshness_days, freshness_score, quality_open_flags, coverage_metrics_count, reliability_tier, conflict_rate, severe_conflicts, notes, updated_date
- KnowledgeDocument
  - title, content, summary, keywords (array), tags (array), source_url, source_type, indexed_by, indexed_at, status
- WatchlistMission
  - name, description, category, region, metric_keywords (array), threshold_pct, owner, status, last_run_at, last_breach_count, created_by

## HealthMetric extensions (optional but recommended)

- version (number)
- lineage_id (string)
- ingest_job_id (string)
- evidence_grade (string)
- freshness_score (number)

## AIInsight extensions (optional but recommended)

- confidence_score (number)
- requires_approval (boolean)
- approval_status (string)

## Notes

- `scheduledDataSync` now attempts staged ingest and writes HealthMetric records.
- If extended fields are not available yet, functions include fallback writes for core fields.
- `runForecastBacktest`, `runApprovalSLAEscalation`, and `generateWatchlistDigest` are now available for model drift, SLA governance, and KPI mission monitoring.
- `rankRecommendations` adds confidence-aware recommendation ranking and auto-suppression of weak-confidence outputs.
- `adjudicateSourceConflict` operationalizes conflict reconciliation with resolve/dismiss/escalate paths and approval-task routing for escalations.
- `rankRecommendations` now also logs `AgentTask` runs and auto-routes top-ranked recommendations to `ApprovalTask` for human review.
- `agentConflictAdjudicationDigest` publishes a weekly governance digest and tracks conflict backlog pressure in `AgentTask`.
- `approveRecommendation` enables human review completion for recommendation approval tasks in Approvals Inbox.
- `scheduledPolicyGovernance` orchestrates schedule-aware governance runs (ranker, digest, SLA monitor, optional conflict scan) with interval guards to limit unnecessary API calls.
- `scanHansards` adds BC + Federal Hansard scraping/intelligence with topical relevance scoring, cache reuse, and bounded-context synthesis to reduce token/API usage.
- `processImportedReport` adds AI-agent report ingestion for imported files (PDF and other supported formats), extracting quantitative metrics + qualitative findings, importing metrics, indexing `KnowledgeDocument`, and generating evidence-linked insights.
- Report ingestion APIs now include additive workflow functions: `queueReportIngestion`, `runReportIngestionWorker`, `getReportIngestionStatus`, `reviewReportFindings`, `publishReportFindings`, and `reprocessReport`.
- Report ingestion now applies confidence gating (`candidate`/`provisional`/`suppressed`), token-budget guardrails (120k default with 85% narrative cutoff), retry/backoff metadata, and review-task routing for low-confidence/conflict cases.
- Token/API guardrails were added to core LLM paths (`generateDecisionMemo`, `queryPolicyKnowledge`, and `runCausalAnalysis`) via reuse windows, cache shortcuts, low-signal bypasses, and bounded prompt context.
- UI modules now include `Recommendations`, `ConflictWorkbench`, and `HansardIntel` for ranking governance, source adjudication, and parliamentary intelligence workflows.
