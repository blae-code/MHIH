/**
 * scheduledBigQueryHealthDiscovery — runs periodically to keep the catalogue
 * fresh with new health datasets from the connected BigQuery account.
 *
 * Steps per run:
 *   1. Invoke googleBigQuery action=discoverHealthDatasets (registers new sources)
 *   2. Refresh record_count + last_synced on existing googlebigquery DataSources
 *      whose sync_frequency is not "manual" (so users can opt-out per-source).
 *
 * Designed for the platform's scheduled automation runner; safe to invoke manually.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const BQ = 'https://bigquery.googleapis.com/bigquery/v2';

async function bqGet(token, path) {
  const res = await fetch(`${BQ}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`BigQuery ${res.status}`);
  return res.json();
}

const bqListProjects = (t) => bqGet(t, `/projects?maxResults=200`);
const bqListDatasets = (t, p) => bqGet(t, `/projects/${encodeURIComponent(p)}/datasets?maxResults=500`);
const bqListTables = (t, p, d) => bqGet(t, `/projects/${encodeURIComponent(p)}/datasets/${encodeURIComponent(d)}/tables?maxResults=200`);
const bqGetTable = (t, p, d, tid) => bqGet(t, `/projects/${encodeURIComponent(p)}/datasets/${encodeURIComponent(d)}/tables/${encodeURIComponent(tid)}`);

const PUBLIC_HEALTH_PROJECTS = [
  { projectId: 'bigquery-public-data', publisher: 'Google Public Datasets' },
];

const CATEGORY_KEYWORDS = [
  { category: 'chronic_disease',     terms: ['cancer', 'cardio', 'heart', 'diabetes', 'stroke', 'chronic', 'hypertension', 'asthma', 'copd'] },
  { category: 'mental_health',       terms: ['mental', 'depression', 'anxiety', 'psych', 'suicide', 'wellbeing'] },
  { category: 'substance_use',       terms: ['opioid', 'alcohol', 'tobacco', 'drug', 'substance', 'overdose', 'smoking'] },
  { category: 'maternal_child',      terms: ['maternal', 'infant', 'child', 'birth', 'neonatal', 'pediatric', 'breastfeed'] },
  { category: 'mortality',           terms: ['mortality', 'death', 'fatal', 'life_expectancy'] },
  { category: 'access_to_care',      terms: ['hospital', 'clinic', 'medicare', 'medicaid', 'insurance', 'access', 'utilization', 'provider'] },
  { category: 'social_determinants', terms: ['poverty', 'income', 'housing', 'food', 'social', 'employment', 'education'] },
  { category: 'demographics',        terms: ['census', 'population', 'demographic', 'ethnicity', 'indigenous', 'aboriginal'] },
];

const HEALTH_KEYWORDS = [
  'health', 'medical', 'medicare', 'medicaid', 'clinical', 'hospital', 'patient',
  'disease', 'epidem', 'cancer', 'covid', 'cdc', 'who', 'nhs', 'mortality', 'wellness',
  ...CATEGORY_KEYWORDS.flatMap(c => c.terms),
];

function classifyDataset(datasetId, description = '') {
  const hay = `${datasetId} ${description}`.toLowerCase();
  const matched = HEALTH_KEYWORDS.find(k => hay.includes(k));
  if (!matched) return null;
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.terms.some(t => hay.includes(t))) return { category: entry.category, matched };
  }
  return { category: 'other', matched };
}

Deno.serve(async (req) => {
  const startedAt = new Date().toISOString();
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlebigquery');

    // ── Step 1: discover & register new health datasets ────────────────
    const ownProjects = await bqListProjects(accessToken).catch(() => ({ projects: [] }));
    const ownIds = (ownProjects.projects || [])
      .map(p => ({ projectId: p.projectReference?.projectId || p.id, publisher: p.friendlyName || 'Connected Account' }))
      .filter(p => p.projectId);
    const projectsToScan = [...PUBLIC_HEALTH_PROJECTS, ...ownIds];

    const existingAll = await base44.asServiceRole.entities.DataSource
      .filter({ 'metadata.provider': 'googlebigquery' }, '-updated_date', 500).catch(() => []);
    const existingKeys = new Set(existingAll.map(s => `${s.metadata?.projectId}.${s.metadata?.datasetId}`));

    const createdNew = [];
    const discoveryErrors = [];

    for (const proj of projectsToScan) {
      try {
        const data = await bqListDatasets(accessToken, proj.projectId);
        for (const d of (data.datasets || [])) {
          const datasetId = d.datasetReference?.datasetId;
          if (!datasetId) continue;
          const classification = classifyDataset(datasetId);
          if (!classification) continue;
          const key = `${proj.projectId}.${datasetId}`;
          if (existingKeys.has(key)) continue;

          try {
            const ds = await base44.asServiceRole.entities.DataSource.create({
              name: `BigQuery · ${datasetId}`,
              type: 'api',
              medium: 'dataset',
              url: `https://console.cloud.google.com/bigquery?project=${proj.projectId}&p=${proj.projectId}&d=${datasetId}&page=dataset`,
              description: `Auto-discovered health dataset from ${proj.publisher} (matched on "${classification.matched}").`,
              category: classification.category,
              region: 'Provincial',
              sync_frequency: 'weekly',
              status: 'active',
              last_synced: new Date().toISOString(),
              metadata: {
                provider: 'googlebigquery',
                projectId: proj.projectId,
                datasetId,
                publisher: proj.publisher,
                discovery: {
                  matched_keyword: classification.matched,
                  discovered_at: new Date().toISOString(),
                  discovered_by: 'scheduled_automation',
                },
              },
            });
            createdNew.push({ id: ds.id, projectId: proj.projectId, datasetId });
            existingKeys.add(key);
          } catch (e) {
            discoveryErrors.push({ projectId: proj.projectId, datasetId, error: e.message });
          }
        }
      } catch (e) {
        discoveryErrors.push({ projectId: proj.projectId, error: e.message });
      }
    }

    const discovery = {
      scanned: projectsToScan.length,
      created: createdNew.length,
      skipped: existingAll.length,
      errors: discoveryErrors,
    };

    // ── Step 2: refresh dataset-level stats for existing BigQuery sources ──

    const toRefresh = existingAll.filter(s =>
      s.sync_frequency && s.sync_frequency !== 'manual' && s.status !== 'inactive'
    );

    const refreshed = [];
    const failed = [];

    for (const src of toRefresh) {
      const { projectId, datasetId } = src.metadata || {};
      if (!projectId || !datasetId) continue;

      try {
        // Sum row counts across all tables in the dataset for a fresh record count
        const tableList = await bqListTables(accessToken, projectId, datasetId);
        const tables = tableList.tables || [];

        let totalRows = 0;
        let totalBytes = 0;
        let lastModified = 0;
        // Cap at 25 tables per dataset to keep runs bounded
        for (const t of tables.slice(0, 25)) {
          const tid = t.tableReference?.tableId;
          if (!tid) continue;
          try {
            const detail = await bqGetTable(accessToken, projectId, datasetId, tid);
            totalRows += Number(detail.numRows || 0);
            totalBytes += Number(detail.numBytes || 0);
            lastModified = Math.max(lastModified, Number(detail.lastModifiedTime || 0));
          } catch { /* skip individual table errors */ }
        }

        await base44.asServiceRole.entities.DataSource.update(src.id, {
          last_synced: new Date().toISOString(),
          record_count: totalRows,
          status: 'active',
          metadata: {
            ...(src.metadata || {}),
            last_refresh: {
              at: new Date().toISOString(),
              total_rows: totalRows,
              total_bytes: totalBytes,
              table_count: tables.length,
              dataset_last_modified: lastModified ? new Date(lastModified).toISOString() : null,
            },
          },
        });
        refreshed.push({ id: src.id, name: src.name, rows: totalRows, tables: tables.length });
      } catch (e) {
        failed.push({ id: src.id, name: src.name, error: e.message });
        await base44.asServiceRole.entities.DataSource.update(src.id, {
          status: 'error',
          metadata: {
            ...(src.metadata || {}),
            last_refresh_error: { at: new Date().toISOString(), message: e.message },
          },
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      discovery: {
        scanned: discovery.scanned || 0,
        created: discovery.created || 0,
        skipped: discovery.skipped || 0,
      },
      refresh: {
        considered: toRefresh.length,
        refreshed: refreshed.length,
        failed: failed.length,
      },
      details: { refreshed, failed },
    });
  } catch (error) {
    return Response.json({
      success: false,
      started_at: startedAt,
      error: error.message,
    }, { status: 500 });
  }
});