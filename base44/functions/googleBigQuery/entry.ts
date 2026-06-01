/**
 * googleBigQuery — shared connector backend for Google BigQuery (read-only).
 *
 * Actions:
 *   - listProjects: returns Google Cloud projects available to the connected account
 *   - listDatasets: { projectId } → datasets in a project
 *   - listTables:   { projectId, datasetId } → tables in a dataset
 *   - getTable:     { projectId, datasetId, tableId } → schema + row count
 *   - runQuery:     { projectId, sql, maxRows? } → query results (read-only)
 *   - importTable:  { projectId, datasetId, tableId, maxRows? } → returns rows + creates
 *                    a DataSource entry so it shows up in the Data Foundation
 *
 * Auth: shared OAuth (the builder's connected BigQuery account).
 * Scope granted: https://www.googleapis.com/auth/bigquery.readonly
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BQ = 'https://bigquery.googleapis.com/bigquery/v2';

// Curated public projects on BigQuery that publish health-relevant datasets.
// These are official Google-hosted public-data projects accessible to anyone with
// BigQuery read scope. Keeps discovery focused, cheap, and predictable.
const PUBLIC_HEALTH_PROJECTS = [
  { projectId: 'bigquery-public-data', publisher: 'Google Public Datasets' },
];

// Keyword → health-metric category mapping (matches HealthMetric.category enum).
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
  // Pick the best-matching category
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.terms.some(t => hay.includes(t))) return { category: entry.category, matched };
  }
  return { category: 'other', matched };
}

async function bq(token, path) {
  const res = await fetch(`${BQ}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`BigQuery ${res.status}: ${txt.slice(0, 300)}`);
  }
  return res.json();
}

async function bqPost(token, path, body) {
  const res = await fetch(`${BQ}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`BigQuery ${res.status}: ${txt.slice(0, 400)}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlebigquery');
    const { action, projectId, datasetId, tableId, sql, maxRows = 1000 } = await req.json();

    if (action === 'listProjects') {
      const data = await bq(accessToken, `/projects?maxResults=200`);
      return Response.json({
        projects: (data.projects || []).map(p => ({
          id: p.id,
          projectId: p.projectReference?.projectId || p.id,
          friendlyName: p.friendlyName || p.projectReference?.projectId,
        })),
      });
    }

    if (action === 'listDatasets') {
      if (!projectId) return Response.json({ error: 'projectId required' }, { status: 400 });
      const data = await bq(accessToken, `/projects/${encodeURIComponent(projectId)}/datasets?maxResults=500`);
      return Response.json({
        datasets: (data.datasets || []).map(d => ({
          id: d.id,
          datasetId: d.datasetReference?.datasetId,
          location: d.location,
        })),
      });
    }

    if (action === 'listTables') {
      if (!projectId || !datasetId) return Response.json({ error: 'projectId + datasetId required' }, { status: 400 });
      const data = await bq(accessToken, `/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(datasetId)}/tables?maxResults=500`);
      return Response.json({
        tables: (data.tables || []).map(t => ({
          id: t.id,
          tableId: t.tableReference?.tableId,
          type: t.type,
        })),
      });
    }

    if (action === 'getTable') {
      if (!projectId || !datasetId || !tableId) return Response.json({ error: 'projectId + datasetId + tableId required' }, { status: 400 });
      const t = await bq(accessToken, `/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(datasetId)}/tables/${encodeURIComponent(tableId)}`);
      return Response.json({
        tableId: t.tableReference?.tableId,
        schema: t.schema?.fields || [],
        numRows: t.numRows,
        numBytes: t.numBytes,
        description: t.description,
        creationTime: t.creationTime,
        lastModifiedTime: t.lastModifiedTime,
      });
    }

    if (action === 'runQuery') {
      if (!projectId || !sql) return Response.json({ error: 'projectId + sql required' }, { status: 400 });
      const result = await bqPost(accessToken, `/projects/${encodeURIComponent(projectId)}/queries`, {
        query: sql,
        useLegacySql: false,
        maxResults: Math.min(maxRows, 10000),
      });
      const fields = result.schema?.fields || [];
      const rows = (result.rows || []).map(r => {
        const obj = {};
        fields.forEach((f, i) => { obj[f.name] = r.f?.[i]?.v ?? null; });
        return obj;
      });
      return Response.json({
        fields: fields.map(f => ({ name: f.name, type: f.type })),
        rows,
        totalRows: result.totalRows,
        bytesProcessed: result.totalBytesProcessed,
      });
    }

    if (action === 'importTable') {
      if (!projectId || !datasetId || !tableId) return Response.json({ error: 'projectId + datasetId + tableId required' }, { status: 400 });
      const sqlStmt = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${Math.min(maxRows, 10000)}`;
      const result = await bqPost(accessToken, `/projects/${encodeURIComponent(projectId)}/queries`, {
        query: sqlStmt,
        useLegacySql: false,
        maxResults: Math.min(maxRows, 10000),
      });
      const fields = result.schema?.fields || [];
      const rows = (result.rows || []).map(r => {
        const obj = {};
        fields.forEach((f, i) => { obj[f.name] = r.f?.[i]?.v ?? null; });
        return obj;
      });

      // Register as a DataSource so it surfaces in the Data Foundation
      const ds = await base44.entities.DataSource.create({
        name: `BigQuery · ${datasetId}.${tableId}`,
        type: 'api',
        url: `https://console.cloud.google.com/bigquery?project=${projectId}&p=${projectId}&d=${datasetId}&t=${tableId}&page=table`,
        description: `Imported from Google BigQuery (${projectId}.${datasetId}.${tableId})`,
        category: 'other',
        sync_frequency: 'manual',
        status: 'active',
        last_synced: new Date().toISOString(),
        record_count: rows.length,
        metadata: { provider: 'googlebigquery', projectId, datasetId, tableId, fields },
      });

      return Response.json({
        dataSourceId: ds.id,
        rowsImported: rows.length,
        fields: fields.map(f => ({ name: f.name, type: f.type })),
        sample: rows.slice(0, 20),
      });
    }

    if (action === 'discoverHealthDatasets') {
      // Scan the user's own projects + curated public health projects for
      // health-related datasets and register any new ones as DataSources.
      const ownProjects = await bq(accessToken, `/projects?maxResults=200`).catch(() => ({ projects: [] }));
      const ownIds = (ownProjects.projects || [])
        .map(p => ({ projectId: p.projectReference?.projectId || p.id, publisher: p.friendlyName || 'Connected Account' }))
        .filter(p => p.projectId);

      const projectsToScan = [...PUBLIC_HEALTH_PROJECTS, ...ownIds];

      // Dedupe vs existing catalogue (match on metadata.projectId + datasetId)
      const existing = await base44.asServiceRole.entities.DataSource
        .filter({}, '-created_date', 500).catch(() => []);
      const existingKeys = new Set(
        existing
          .filter(s => s.metadata?.provider === 'googlebigquery')
          .map(s => `${s.metadata?.projectId}.${s.metadata?.datasetId}`)
      );

      const discovered = [];
      const created = [];
      const skipped = [];
      const errors = [];

      for (const proj of projectsToScan) {
        try {
          const data = await bq(accessToken, `/projects/${encodeURIComponent(proj.projectId)}/datasets?maxResults=500`);
          for (const d of (data.datasets || [])) {
            const datasetId = d.datasetReference?.datasetId;
            if (!datasetId) continue;
            const classification = classifyDataset(datasetId);
            if (!classification) continue;

            const key = `${proj.projectId}.${datasetId}`;
            discovered.push({ projectId: proj.projectId, datasetId, category: classification.category, publisher: proj.publisher });
            if (existingKeys.has(key)) {
              skipped.push({ projectId: proj.projectId, datasetId, reason: 'already in catalogue' });
              continue;
            }

            try {
              const ds = await base44.asServiceRole.entities.DataSource.create({
                name: `BigQuery · ${datasetId}`,
                type: 'api',
                medium: 'dataset',
                url: `https://console.cloud.google.com/bigquery?project=${proj.projectId}&p=${proj.projectId}&d=${datasetId}&page=dataset`,
                description: `Auto-discovered health dataset from ${proj.publisher} (matched on "${classification.matched}").`,
                category: classification.category,
                region: 'Provincial',
                sync_frequency: 'manual',
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
                    discovered_by: user.email,
                  },
                },
              });
              created.push({ id: ds.id, projectId: proj.projectId, datasetId, category: classification.category });
              existingKeys.add(key);
            } catch (e) {
              errors.push({ projectId: proj.projectId, datasetId, error: e.message });
            }
          }
        } catch (e) {
          errors.push({ projectId: proj.projectId, error: e.message });
        }
      }

      return Response.json({
        success: true,
        scanned: projectsToScan.length,
        discovered: discovered.length,
        created: created.length,
        skipped: skipped.length,
        errors,
        details: { created, skipped },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});