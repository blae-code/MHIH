import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

type SourceRecord = Record<string, any>;

const NUMERIC_CANDIDATES = ['value', 'rate', 'count', 'amount', 'number', 'total', 'prevalence', 'incidence', 'percent'];
const NAME_CANDIDATES = ['name', 'metric', 'indicator', 'title', 'label', 'food_description', 'drug_product_name'];
const YEAR_CANDIDATES = ['year', 'ref_date', 'reference_year', 'period', 'date', 'time'];
const REGION_CANDIDATES = ['region', 'health_authority', 'geography', 'province', 'area'];
const UNIT_CANDIDATES = ['unit', 'units', 'measure'];

function isFiniteNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n);
}

function toNumber(value: any) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/,/g, '').replace(/%/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function pickFirst(obj: SourceRecord, keys: string[]) {
  const lower = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
  for (const key of keys) {
    if (lower[key] != null && String(lower[key]).trim() !== '') return lower[key];
  }
  return null;
}

function inferYear(obj: SourceRecord) {
  const raw = pickFirst(obj, YEAR_CANDIDATES);
  if (raw == null) return null;
  const text = String(raw);
  const yearMatch = text.match(/(19|20)\d{2}/);
  if (yearMatch) return Number(yearMatch[0]);
  const parsed = Number(text);
  if (Number.isFinite(parsed) && parsed > 1900 && parsed < 2200) return parsed;
  return null;
}

function inferNumericValue(obj: SourceRecord) {
  for (const key of NUMERIC_CANDIDATES) {
    const val = pickFirst(obj, [key]);
    const parsed = toNumber(val);
    if (parsed != null) return parsed;
  }

  for (const [k, v] of Object.entries(obj)) {
    const lk = k.toLowerCase();
    if (lk.includes('year') || lk.includes('date')) continue;
    const parsed = toNumber(v);
    if (parsed != null) return parsed;
  }

  return null;
}

function inferCategory(name: string, fallback: string) {
  const t = (name || '').toLowerCase();
  if (fallback && fallback !== 'other') return fallback;
  if (t.includes('diabetes') || t.includes('cancer') || t.includes('cardio')) return 'chronic_disease';
  if (t.includes('mental') || t.includes('depression') || t.includes('suicide')) return 'mental_health';
  if (t.includes('substance') || t.includes('opioid') || t.includes('alcohol')) return 'substance_use';
  if (t.includes('maternal') || t.includes('infant') || t.includes('birth')) return 'maternal_child';
  if (t.includes('income') || t.includes('housing') || t.includes('education')) return 'social_determinants';
  if (t.includes('population') || t.includes('demographic') || t.includes('age')) return 'demographics';
  if (t.includes('mortality') || t.includes('death')) return 'mortality';
  if (t.includes('access') || t.includes('wait') || t.includes('primary care')) return 'access_to_care';
  return 'other';
}

function inferEvidenceGrade(sourceType: string) {
  if (sourceType === 'statcan' || sourceType === 'bc_health') return 'high';
  if (sourceType === 'api' || sourceType === 'fnha') return 'moderate';
  return 'low';
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const splitLine = (line: string) => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    out.push(current.trim());
    return out;
  };

  const headers = splitLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  const rows: SourceRecord[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line);
    const row: SourceRecord = {};
    headers.forEach((header, idx) => {
      row[header] = (cells[idx] || '').replace(/^"|"$/g, '').trim();
    });
    rows.push(row);
  }
  return rows;
}

async function fetchSourceRecords(src: any) {
  const response = await fetch(src.url, {
    method: 'GET',
    signal: AbortSignal.timeout(20000),
    headers: {
      Accept: 'application/json,text/csv,application/xml,text/xml,*/*',
      'User-Agent': 'MHIP-Ingest/2.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${response.statusText}`);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const text = await response.text();

  if (contentType.includes('json') || src.url.toLowerCase().includes('.json')) {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.results)) return parsed.results;
    if (Array.isArray(parsed?.data)) return parsed.data;
    if (Array.isArray(parsed?.items)) return parsed.items;
    if (Array.isArray(parsed?.object)) return parsed.object;
    return [parsed];
  }

  if (contentType.includes('csv') || src.url.toLowerCase().includes('.csv')) {
    return parseCsv(text);
  }

  if (contentType.includes('xml') || src.url.toLowerCase().includes('.rss') || src.url.toLowerCase().includes('.xml')) {
    const items = [];
    const matches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of matches) {
      const block = match[1];
      const pull = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return (m?.[1] || m?.[2] || '').trim();
      };
      items.push({
        title: pull('title'),
        description: pull('description'),
        date: pull('pubDate'),
        value: 1,
      });
      if (items.length >= 1000) break;
    }
    return items;
  }

  return [];
}

async function safeCreateMetric(base44: any, payload: any) {
  try {
    return await base44.asServiceRole.entities.HealthMetric.create(payload);
  } catch {
    const fallback = {
      name: payload.name,
      category: payload.category,
      region: payload.region,
      year: payload.year,
      value: payload.value,
      unit: payload.unit,
      data_source_name: payload.data_source_name,
      notes: payload.notes,
      confidence_level: payload.confidence_level,
      metis_specific: true,
    };
    return await base44.asServiceRole.entities.HealthMetric.create(fallback);
  }
}

async function safeUpdateMetric(base44: any, id: string, payload: any) {
  try {
    return await base44.asServiceRole.entities.HealthMetric.update(id, payload);
  } catch {
    const fallback = {
      name: payload.name,
      category: payload.category,
      region: payload.region,
      year: payload.year,
      value: payload.value,
      unit: payload.unit,
      notes: payload.notes,
      confidence_level: payload.confidence_level,
    };
    return await base44.asServiceRole.entities.HealthMetric.update(id, fallback);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      isAuthorized = user?.role === 'admin' || user?.role === 'user';
    } catch {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { source_id, dry_run = false } = body;

    const allSources = await base44.asServiceRole.entities.DataSource.list();
    const toSync = source_id
      ? allSources.filter((s: any) => s.id === source_id)
      : allSources.filter((s: any) => s.status !== 'inactive' && s.sync_frequency !== 'manual' && s.url);

    const results = [];

    for (const src of toSync) {
      const job = await base44.asServiceRole.entities.SyncJob.create({
        source_id: src.id,
        source_name: src.name,
        source_url: src.url,
        source_type: src.type,
        trigger: source_id ? 'manual' : 'scheduled',
        status: 'running',
        started_at: new Date().toISOString(),
      });

      const stageLogs: string[] = [];
      const started = Date.now();
      let status = 'success';
      let errorMsg: string | null = null;
      let fetched = 0;
      let inserted = 0;
      let updated = 0;
      let invalid = 0;

      try {
        stageLogs.push('[STAGE] fetch');
        const records = await fetchSourceRecords(src);
        fetched = records.length;
        stageLogs.push(`[INFO] fetched records: ${fetched}`);

        stageLogs.push('[STAGE] schema_map');
        const mapped = records.map((row: SourceRecord, idx: number) => {
          const metricName = String(pickFirst(row, NAME_CANDIDATES) || `${src.name} metric ${idx + 1}`);
          const year = inferYear(row) || new Date().getFullYear();
          const value = inferNumericValue(row);
          const region = String(pickFirst(row, REGION_CANDIDATES) || src.region || 'BC');
          const unit = String(pickFirst(row, UNIT_CANDIDATES) || '').slice(0, 32);
          const category = inferCategory(metricName, src.category || 'other');
          const lineageKey = `${metricName.toLowerCase().trim()}|${region}|${year}|${src.name}`;

          return {
            raw: row,
            metric: {
              name: metricName,
              category,
              region,
              year,
              value,
              unit,
              data_source_name: src.name,
              confidence_level: src.type === 'statcan' ? 'high' : 'medium',
              metis_specific: true,
              notes: `Ingested from ${src.name} (${src.url}) on ${new Date().toISOString()}`,
              lineage_id: `lineage:${lineageKey}`,
              ingest_job_id: job.id,
              evidence_grade: inferEvidenceGrade(src.type),
              freshness_score: year >= new Date().getFullYear() - 1 ? 0.9 : year >= new Date().getFullYear() - 3 ? 0.7 : 0.45,
              version: 1,
            },
            dedupe_key: lineageKey,
          };
        });

        stageLogs.push('[STAGE] validate');
        const valid = mapped.filter((m) => {
          const ok = Boolean(m.metric.name) && m.metric.year != null && isFiniteNumber(m.metric.value);
          if (!ok) invalid += 1;
          return ok;
        });

        if (invalid > 0) {
          stageLogs.push(`[WARN] invalid rows dropped: ${invalid}`);
        }

        if (!valid.length) {
          throw new Error('No valid records after validation');
        }

        stageLogs.push('[STAGE] dedupe');
        const existing = await base44.asServiceRole.entities.HealthMetric.filter({ data_source_name: src.name }, '-year', 4000).catch(() => []);
        const existingMap = new Map<string, any>();
        for (const e of existing) {
          const key = `${(e.name || '').toLowerCase().trim()}|${e.region || 'BC'}|${e.year}|${e.data_source_name || src.name}`;
          existingMap.set(key, e);
        }

        stageLogs.push('[STAGE] version_write');
        for (const item of valid.slice(0, 2000)) {
          const prev = existingMap.get(item.dedupe_key);
          if (!prev) {
            if (!dry_run) await safeCreateMetric(base44, item.metric);
            inserted += 1;
            continue;
          }

          const prevValue = Number(prev.value);
          const nextValue = Number(item.metric.value);
          if (Number.isFinite(prevValue) && Number.isFinite(nextValue) && Math.abs(prevValue - nextValue) < 0.0001) {
            continue;
          }

          const nextVersion = Number(prev.version || 1) + 1;
          if (!dry_run) {
            await safeUpdateMetric(base44, prev.id, {
              ...item.metric,
              version: nextVersion,
              lineage_id: prev.lineage_id || item.metric.lineage_id,
              ingest_job_id: job.id,
            });
          }
          updated += 1;
        }

        stageLogs.push('[STAGE] quality_gate');
        const invalidRatio = invalid / Math.max(1, mapped.length);
        if (invalidRatio > 0.4) {
          status = 'failed';
          errorMsg = `Quality gate failed: ${(invalidRatio * 100).toFixed(1)}% invalid records`;
          if (!dry_run) {
            await base44.asServiceRole.entities.DataQualityFlag.create({
              metric_name: src.name,
              flag_type: 'inconsistency',
              severity: 'high',
              status: 'open',
              auto_detected: true,
              description: `Ingest quality gate failed for source ${src.name}: ${(invalidRatio * 100).toFixed(1)}% invalid rows.`,
              category: src.category || 'other',
              region: 'BC',
              year: new Date().getFullYear(),
            });
          }
        }

        stageLogs.push('[STAGE] publish');
        if (!dry_run) {
          await base44.asServiceRole.entities.DataSource.update(src.id, {
            last_synced: new Date().toISOString(),
            status: status === 'failed' ? 'error' : 'active',
          });

          await base44.asServiceRole.entities.AuditLog.create({
            action: status === 'failed' ? 'ingest_failed' : 'ingest_completed',
            entity_type: 'DataSource',
            entity_id: src.id,
            entity_name: src.name,
            user_email: 'system@mhip',
            user_name: 'Scheduled Ingest',
            details: `fetched=${fetched}, inserted=${inserted}, updated=${updated}, invalid=${invalid}, dry_run=${dry_run}`,
          });
        }
      } catch (err) {
        status = 'failed';
        errorMsg = err.message;
        stageLogs.push(`[ERROR] ${err.message}`);

        if (!dry_run) {
          await base44.asServiceRole.entities.DataSource.update(src.id, { status: 'error' }).catch(() => {});
          await base44.asServiceRole.entities.AuditLog.create({
            action: 'ingest_failed',
            entity_type: 'DataSource',
            entity_id: src.id,
            entity_name: src.name,
            user_email: 'system@mhip',
            user_name: 'Scheduled Ingest',
            details: err.message,
          }).catch(() => {});
        }
      }

      const durationMs = Date.now() - started;
      await base44.asServiceRole.entities.SyncJob.update(job.id, {
        status,
        records_fetched: fetched,
        records_inserted: inserted,
        duration_ms: durationMs,
        error_message: errorMsg,
        log_output: stageLogs.join('\n'),
        finished_at: new Date().toISOString(),
      });

      results.push({
        source: src.name,
        status,
        fetched,
        inserted,
        updated,
        invalid,
        durationMs,
        error: errorMsg,
      });
    }

    return Response.json({
      success: true,
      synced: results.length,
      succeeded: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
