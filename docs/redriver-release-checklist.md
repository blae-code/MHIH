# Red River OS Module Release Checklist

Run this checklist before promoting Red River OS module endpoints to production.

1. Ensure required Base44 entities exist and match `docs/redriver-contract-entities.md`.
2. Run catalog sync in target environment:
   - Invoke `syncCatalog` with `dry_run=true` and inspect counts.
   - Invoke `syncCatalog` with `dry_run=false` and verify upserts complete.
3. Validate projection-safe API endpoints:
   - `api_listDatasets`
   - `api_listMetrics`
   - `api_queryMetricSeries`
   - `api_createEvidenceSnapshot`
   - `api_getEvidenceSnapshot`
   - `api_exportEvidenceSnapshot`
4. Confirm scoped token configuration (`RR_OS_API_TOKENS`) includes minimum required scopes.
5. Run repository gates:
   - `npm run validate:all`
6. Verify Red River OS UI pages render and route correctly:
   - `RedRiverOS`
   - `MetricCatalog`
   - `MetricForge`
   - `EvidenceSnapshots`
7. Confirm no sensitive-tier leakage in projected mode through snapshot and query endpoints.
