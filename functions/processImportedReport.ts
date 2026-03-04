import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

type QuantFinding = {
  metric_name?: string;
  metric_value?: number | string;
  unit?: string;
  year?: number | string;
  region?: string;
  category?: string;
  comparison_value?: number | string;
  direction?: string;
  confidence?: string;
  notes?: string;
  page_reference?: string;
};

type QualFinding = {
  theme?: string;
  finding?: string;
  implication?: string;
  recommendation?: string;
  severity?: string;
  sentiment?: string;
  population_group?: string;
  evidence_quote?: string;
  page_reference?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function normalizeWhitespace(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toNumber(value: any) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/,/g, '').replace(/%/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeConfidence(value?: string) {
  const v = String(value || '').toLowerCase();
  if (v.includes('high') || v.includes('strong')) return 'high';
  if (v.includes('low') || v.includes('weak')) return 'low';
  return 'medium';
}

function confidenceScore(value?: string) {
  const c = normalizeConfidence(value);
  if (c === 'high') return 0.88;
  if (c === 'low') return 0.46;
  return 0.67;
}

function confidenceLevelFromScore(score: number) {
  if (score >= 0.75) return 'high';
  if (score < 0.45) return 'low';
  return 'medium';
}

function publishStateFromScore(score: number) {
  if (score >= 0.75) return 'candidate';
  if (score >= 0.45) return 'provisional';
  return 'suppressed';
}

function safeJsonParse(input: any) {
  if (!input) return {};
  if (typeof input === 'object') return input;
  try {
    return JSON.parse(String(input));
  } catch {
    return {};
  }
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function estimateTokens(value: string) {
  return Math.ceil(String(value || '').length / 4);
}

function nextRetryAt(attemptCount: number) {
  const delays = [2, 10, 30];
  const delayMinutes = delays[Math.max(0, Math.min(delays.length - 1, attemptCount - 1))] || 30;
  const dt = new Date();
  dt.setMinutes(dt.getMinutes() + delayMinutes);
  return dt.toISOString();
}

function inferCategory(metricName: string, fallback?: string) {
  const raw = String(fallback || '').toLowerCase().trim();
  if (raw && raw !== 'other') return raw;
  const name = String(metricName || '').toLowerCase();
  if (name.includes('diabetes') || name.includes('cardio') || name.includes('cancer')) return 'chronic_disease';
  if (name.includes('mental') || name.includes('depression') || name.includes('suicide')) return 'mental_health';
  if (name.includes('opioid') || name.includes('substance') || name.includes('alcohol')) return 'substance_use';
  if (name.includes('maternal') || name.includes('birth') || name.includes('infant')) return 'maternal_child';
  if (name.includes('housing') || name.includes('income') || name.includes('education')) return 'social_determinants';
  if (name.includes('population') || name.includes('demographic') || name.includes('age')) return 'demographics';
  if (name.includes('mortality') || name.includes('death')) return 'mortality';
  if (name.includes('access') || name.includes('wait') || name.includes('primary care')) return 'access_to_care';
  return 'other';
}

function inferTags(args: {
  sourceName: string;
  quantitative: QuantFinding[];
  qualitative: QualFinding[];
  extra: string[];
}) {
  const tags = new Set<string>(['uploaded_report']);
  if (args.sourceName) tags.add(args.sourceName.toLowerCase().slice(0, 60));

  for (const q of args.quantitative.slice(0, 50)) {
    const name = String(q.metric_name || '').toLowerCase();
    const category = inferCategory(name, q.category);
    if (category) tags.add(category);
    if (name.includes('metis')) tags.add('metis');
  }

  for (const q of args.qualitative.slice(0, 50)) {
    const theme = String(q.theme || '').toLowerCase().trim();
    if (theme) tags.add(theme.slice(0, 60));
    const finding = String(q.finding || '').toLowerCase();
    if (finding.includes('metis')) tags.add('metis');
  }

  for (const t of args.extra || []) {
    const clean = String(t || '').toLowerCase().trim();
    if (clean) tags.add(clean.slice(0, 60));
  }

  return Array.from(tags).slice(0, 20);
}

function isRecent(ts: string | undefined, hours: number) {
  if (!ts || hours <= 0) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000;
}

function buildHeuristicSummary(args: {
  sourceName: string;
  quantitative: QuantFinding[];
  qualitative: QualFinding[];
}) {
  const quantCount = args.quantitative.length;
  const qualCount = args.qualitative.length;

  const topMetrics = args.quantitative
    .filter((q) => q.metric_name && toNumber(q.metric_value) != null)
    .slice(0, 5)
    .map((q) => {
      const v = toNumber(q.metric_value);
      return `${q.metric_name}: ${v}${q.unit ? ` ${q.unit}` : ''}${q.year ? ` (${q.year})` : ''}`;
    });

  const topThemes = args.qualitative
    .map((q) => normalizeWhitespace(String(q.theme || q.finding || '')))
    .filter(Boolean)
    .slice(0, 6);

  const summary = quantCount || qualCount
    ? `Processed report "${args.sourceName}" with ${quantCount} quantitative and ${qualCount} qualitative findings.`
    : `Processed report "${args.sourceName}" with limited extractable findings.`;

  const policyActions = [
    'Validate extracted findings with user review before executive publishing.',
    'Use extracted metrics to update scenario and watchlist baselines where applicable.',
    'Track recurring qualitative themes for intervention prioritization.',
  ];

  return {
    summary,
    key_findings: [
      ...topMetrics.map((m) => `Quantitative: ${m}`),
      ...topThemes.map((t) => `Qualitative: ${t}`),
    ].slice(0, 10),
    policy_actions: policyActions,
    keywords: [
      ...topThemes.map((t) => t.toLowerCase().split(' ').slice(0, 2).join('_')),
      ...args.quantitative.slice(0, 6).map((q) => inferCategory(String(q.metric_name || ''), q.category)),
    ].filter(Boolean).slice(0, 12),
    confidence: quantCount || qualCount ? 0.66 : 0.35,
  };
}

async function extractReportData(base44: any, fileUrl: string, maxQuant: number, maxQual: number) {
  const schema = {
    type: 'object',
    properties: {
      report_metadata: {
        type: 'object',
        properties: {
          report_title: { type: 'string' },
          organization: { type: 'string' },
          report_date: { type: 'string' },
          jurisdiction: { type: 'string' },
          region: { type: 'string' },
          time_period: { type: 'string' },
          methodology: { type: 'string' },
          data_quality_notes: { type: 'string' },
        },
      },
      summary: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      quantitative_findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            metric_name: { type: 'string' },
            metric_value: { type: 'number' },
            unit: { type: 'string' },
            year: { type: 'number' },
            region: { type: 'string' },
            category: { type: 'string' },
            comparison_value: { type: 'number' },
            direction: { type: 'string' },
            confidence: { type: 'string' },
            notes: { type: 'string' },
            page_reference: { type: 'string' },
          },
        },
      },
      qualitative_findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            theme: { type: 'string' },
            finding: { type: 'string' },
            implication: { type: 'string' },
            recommendation: { type: 'string' },
            severity: { type: 'string' },
            sentiment: { type: 'string' },
            population_group: { type: 'string' },
            evidence_quote: { type: 'string' },
            page_reference: { type: 'string' },
          },
        },
      },
    },
  };

  const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
    file_url: fileUrl,
    json_schema: schema,
  });

  const output = extracted?.output || {};
  const quantitative = Array.isArray(output.quantitative_findings)
    ? output.quantitative_findings.slice(0, maxQuant)
    : [];
  const qualitative = Array.isArray(output.qualitative_findings)
    ? output.qualitative_findings.slice(0, maxQual)
    : [];

  return {
    report_metadata: output.report_metadata || {},
    summary: String(output.summary || ''),
    tags: Array.isArray(output.tags) ? output.tags : [],
    quantitative_findings: quantitative,
    qualitative_findings: qualitative,
  };
}

async function safeCreateKnowledgeDocument(base44: any, payload: any) {
  try {
    return await base44.asServiceRole.entities.KnowledgeDocument.create(payload);
  } catch {
    const fallback = {
      title: payload.title,
      content: payload.content,
      summary: payload.summary || null,
      keywords: payload.keywords || [],
      tags: payload.tags || [],
      source_url: payload.source_url || null,
      source_type: payload.source_type || 'uploaded_report',
      indexed_by: payload.indexed_by || 'system',
      indexed_at: payload.indexed_at || new Date().toISOString(),
    };
    return await base44.asServiceRole.entities.KnowledgeDocument.create(fallback);
  }
}

async function safeUpdateKnowledgeDocument(base44: any, id: string, payload: any) {
  try {
    return await base44.asServiceRole.entities.KnowledgeDocument.update(id, payload);
  } catch {
    const fallback = {
      title: payload.title,
      content: payload.content,
      summary: payload.summary,
      keywords: payload.keywords,
      tags: payload.tags,
      source_url: payload.source_url,
      source_type: payload.source_type,
      indexed_by: payload.indexed_by,
      indexed_at: payload.indexed_at,
    };
    return await base44.asServiceRole.entities.KnowledgeDocument.update(id, fallback);
  }
}

async function getReviewAssignee(base44: any) {
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 20).catch(() => []);
  if (admins?.length) return admins[0];
  const fallback = await base44.asServiceRole.entities.User.list('-created_date', 1).catch(() => []);
  return fallback?.[0] || null;
}

async function createReportReviewTask(args: {
  base44: any;
  docId: string;
  docTitle: string;
  requester: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
}) {
  const reviewer = await getReviewAssignee(args.base44);
  const due = new Date();
  due.setHours(due.getHours() + (args.priority === 'high' ? 24 : 72));
  return await args.base44.asServiceRole.entities.ApprovalTask.create({
    entity_type: 'KnowledgeDocument',
    entity_id: args.docId,
    title: `Review report findings: ${String(args.docTitle || args.docId).slice(0, 130)}`,
    status: 'pending',
    priority: args.priority,
    assigned_to: reviewer?.id || null,
    assigned_to_email: reviewer?.email || null,
    requested_by: args.requester,
    due_date: due.toISOString(),
    sla_hours: args.priority === 'high' ? 24 : 72,
    notes: args.notes,
  }).catch(() => null);
}

Deno.serve(async (req) => {
  const start = Date.now();
  let base44: any = null;
  let task: any = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl = String(body.file_url || '').trim();
    const fileName = String(body.file_name || '').trim();
    const sourceName = String(body.source_name || fileName || 'Uploaded report').slice(0, 180);
    const sourceType = String(body.source_type || 'uploaded_report').slice(0, 80);
    const regionDefault = String(body.region || 'BC').slice(0, 80);
    const categoryHint = String(body.category_hint || 'other').slice(0, 80);

    const importMetrics = body.import_metrics !== false;
    const indexKnowledge = body.index_knowledge !== false;
    const createInsight = body.create_insight !== false;
    const useLlmSummary = body.use_llm_summary !== false;
    const forceReprocess = Boolean(body.force_reprocess);
    const maxMetrics = Math.max(1, Math.min(600, Number(body.max_metrics ?? 600)));
    const maxQualFindings = Math.max(1, Math.min(180, Number(body.max_qual_findings ?? 180)));
    const maxContextChars = Math.max(900, Math.min(2800, Number(body.max_context_chars ?? 2800)));
    const maxCharsPerExtractionPass = Math.max(3000, Math.min(12000, Number(body.max_chars_per_extraction_pass ?? 9000)));
    const cacheTtlHours = Math.max(1, Math.min(72, Number(body.cache_ttl_hours ?? 24)));
    const queueLimit = Math.max(1, Math.min(20, Number(body.queue_limit ?? 5)));
    const tokenBudgetDefault = Math.max(10000, Math.min(500000, Number(body.token_budget ?? 120000)));
    const queuedDocId = body.queue_doc_id ? String(body.queue_doc_id) : null;

    task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: 'Report Ingestion Agent',
      task_type: 'report_ingestion',
      status: 'running',
      triggered_by: String(body.triggered_by || 'manual').toLowerCase() === 'scheduled' ? 'scheduled' : 'manual',
    });

    let jobs: any[] = [];
    if (fileUrl) {
      jobs = [{
        file_url: fileUrl,
        file_name: fileName,
        source_name: sourceName,
        source_type: sourceType,
        queue_doc_id: queuedDocId,
        pre_extracted_data: body.pre_extracted_data || null,
      }];
    } else if (queuedDocId) {
      const doc = await base44.asServiceRole.entities.KnowledgeDocument.get(queuedDocId).catch(async () => {
        const found = await base44.asServiceRole.entities.KnowledgeDocument.filter({ id: queuedDocId }, '-created_date', 1);
        return found?.[0] || null;
      });
      if (doc?.source_url) {
        const parsed = safeJsonParse(doc.content);
        jobs = [{
          file_url: doc.source_url,
          file_name: doc.title || '',
          source_name: doc.title || 'Queued report',
          source_type: doc.source_type || 'uploaded_report',
          queue_doc_id: doc.id,
          queued_doc: doc,
          pre_extracted_data: parsed.pre_extracted_data || null,
        }];
      }
    } else {
      const queued = await base44.asServiceRole.entities.KnowledgeDocument
        .filter({ source_type: 'uploaded_report', status: 'queued' }, '-created_date', queueLimit)
        .catch(() => []);
      const nowMs = Date.now();
      jobs = queued
        .map((d: any) => {
          if (!d?.source_url) return null;
          const parsed = safeJsonParse(d.content);
          const ingest = parsed?._ingestion || {};
          const nextRetry = ingest.next_retry_at ? new Date(ingest.next_retry_at).getTime() : 0;
          const attempts = Number(ingest.attempt_count || 0);
          if (!forceReprocess && nextRetry && nextRetry > nowMs) return null;
          if (!forceReprocess && attempts >= 3) return null;

          return {
            file_url: d.source_url,
            file_name: d.title || '',
            source_name: d.title || 'Queued report',
            source_type: d.source_type || 'uploaded_report',
            queue_doc_id: d.id,
            queued_doc: d,
            pre_extracted_data: parsed.pre_extracted_data || null,
          };
        })
        .filter(Boolean);
    }

    if (!jobs.length) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'completed',
        summary: 'No queued uploaded reports to process.',
        items_processed: 0,
        items_actioned: 0,
        duration_ms: Date.now() - start,
      }).catch(() => {});
      return Response.json({ success: true, processed: 0, message: 'No queued uploaded reports.' });
    }

    const processedResults: any[] = [];
    const failures: any[] = [];
    const allMetricsBaseline = await base44.asServiceRole.entities.HealthMetric.list('-year', 6000).catch(() => []);
    const baselineByKey = new Map<string, any[]>();
    for (const m of allMetricsBaseline) {
      if (!m?.name || m?.year == null || !m?.region || m?.value == null) continue;
      const key = `${String(m.name).toLowerCase().trim()}|${Number(m.year)}|${String(m.region).toLowerCase().trim()}`;
      if (!baselineByKey.has(key)) baselineByKey.set(key, []);
      baselineByKey.get(key)!.push(m);
    }

    for (const job of jobs) {
      const oneStart = Date.now();
      let currentQueueDocId: string | null = null;
      let queuedContent: any = {};
      let queuedIngestion: any = {};
      let attemptCount = 1;
      let tokenUsed = 0;
      let tokenBudget = tokenBudgetDefault;
      let idempotencyKey = '';
      let fileHash = '';
      let schemaVersion = 'report_ingestion_v2';
      let optionsHash = '';
      try {
        const currentFileUrl = String(job.file_url || '').trim();
        const currentSourceName = String(job.source_name || sourceName || 'Uploaded report').slice(0, 180);
        const currentSourceType = String(job.source_type || sourceType || 'uploaded_report').slice(0, 80);
        currentQueueDocId = job.queue_doc_id ? String(job.queue_doc_id) : null;
        const queuedDoc = job.queued_doc || null;
        queuedContent = queuedDoc ? safeJsonParse(queuedDoc.content) : {};
        queuedIngestion = queuedContent?._ingestion || {};
        attemptCount = Number(queuedIngestion.attempt_count || 0) + 1;

        tokenUsed = Number(queuedIngestion.token_used || 0);
        tokenBudget = Math.max(10000, Number(queuedIngestion.token_budget || tokenBudgetDefault));
        const disableNarrativeAt = tokenBudget * 0.85;

        fileHash = String(queuedIngestion.file_hash || await sha256(`${currentFileUrl}|${job.file_name || ''}|${currentSourceType}`));
        schemaVersion = String(queuedIngestion.schema_version || 'report_ingestion_v2');
        optionsHash = String(queuedIngestion.options_hash || await sha256(JSON.stringify({
          import_metrics: importMetrics,
          index_knowledge: indexKnowledge,
          create_insight: createInsight,
          use_llm_summary: useLlmSummary,
          max_metrics: maxMetrics,
          max_qual_findings: maxQualFindings,
          max_context_chars: maxContextChars,
          max_chars_per_extraction_pass: maxCharsPerExtractionPass,
        })));
        idempotencyKey = String(queuedIngestion.idempotency_key || `${fileHash}:${schemaVersion}:${optionsHash}`);

        if (!currentFileUrl) throw new Error('Missing file_url for report job');

        if (currentQueueDocId) {
          await safeUpdateKnowledgeDocument(base44, currentQueueDocId, {
            status: 'processing',
            content: JSON.stringify({
              ...queuedContent,
              _ingestion: {
                ...queuedIngestion,
                idempotency_key: idempotencyKey,
                file_hash: fileHash,
                schema_version: schemaVersion,
                options_hash: optionsHash,
                attempt_count: attemptCount,
                started_at: new Date().toISOString(),
                finished_at: null,
                next_retry_at: null,
                error_message: null,
                token_budget: tokenBudget,
                token_used: tokenUsed,
                extractor_version: 'report-ingestion-v2',
              },
            }),
          }).catch(() => {});
        }

        if (!forceReprocess) {
          const cacheRows = await base44.asServiceRole.entities.AIInsight
            .filter({ type: 'report_intelligence_cache' }, '-created_date', 200)
            .catch(() => []);
          const cached = cacheRows.find((r: any) => {
            const key = String(r.prompt || '');
            return (key === idempotencyKey || key === currentFileUrl) && isRecent(r.created_date, cacheTtlHours);
          });
          if (cached?.content) {
            const parsed = safeJsonParse(cached.content);
            processedResults.push({
              ...parsed,
              cache_hit: true,
            });
            if (currentQueueDocId) {
              await safeUpdateKnowledgeDocument(base44, currentQueueDocId, {
                status: parsed.blocked_from_policy ? 'analysis_only' : parsed.provisional_count > 0 ? 'provisional' : 'indexed',
                summary: parsed.summary || null,
                indexed_by: user.email,
                indexed_at: new Date().toISOString(),
              }).catch(() => {});
            }
            continue;
          }
        }

        const preExtracted = job.pre_extracted_data || (body.pre_extracted_data && jobs.length === 1 ? body.pre_extracted_data : null);
        let extracted = preExtracted
          ? {
              report_metadata: preExtracted.report_metadata || {},
              summary: String(preExtracted.summary || ''),
              tags: Array.isArray(preExtracted.tags) ? preExtracted.tags : [],
              quantitative_findings: Array.isArray(preExtracted.quantitative_findings)
                ? preExtracted.quantitative_findings.slice(0, maxMetrics)
                : [],
              qualitative_findings: Array.isArray(preExtracted.qualitative_findings)
                ? preExtracted.qualitative_findings.slice(0, maxQualFindings)
                : [],
            }
          : await extractReportData(base44, currentFileUrl, maxMetrics, maxQualFindings);

        tokenUsed += estimateTokens(JSON.stringify(extracted).slice(0, maxCharsPerExtractionPass));

        const lowYield = ((extracted.quantitative_findings?.length || 0) + (extracted.qualitative_findings?.length || 0)) < 3;
        const scannedPdfSignal =
          String(job.file_name || currentSourceName).toLowerCase().endsWith('.pdf')
          && !String(extracted.summary || '').trim();
        let ocrFallbackAttempted = false;
        if (!preExtracted && body.enable_ocr_fallback !== false && (lowYield || scannedPdfSignal)) {
          try {
            ocrFallbackAttempted = true;
            const fallback = await extractReportData(base44, currentFileUrl, maxMetrics, maxQualFindings);
            tokenUsed += estimateTokens(JSON.stringify(fallback).slice(0, maxCharsPerExtractionPass));
            const fallbackYield = (fallback.quantitative_findings?.length || 0) + (fallback.qualitative_findings?.length || 0);
            const baseYield = (extracted.quantitative_findings?.length || 0) + (extracted.qualitative_findings?.length || 0);
            if (fallbackYield > baseYield) extracted = fallback;
          } catch {
            // Keep initial extraction if fallback fails.
          }
        }

        const reportMeta = extracted.report_metadata || {};
        const reportTitle = normalizeWhitespace(String(reportMeta.report_title || currentSourceName || 'Imported report'));
        const reportSummary = normalizeWhitespace(String(extracted.summary || ''));

        const nowYear = new Date().getFullYear();
        const rowKeys = new Set<string>();
        let duplicateCount = 0;
        let invalidYearCount = 0;

        const quantitative = (extracted.quantitative_findings || [])
          .map((q: QuantFinding, idx: number) => {
            const metricName = normalizeWhitespace(String(q.metric_name || ''));
            const metricValue = toNumber(q.metric_value);
            const metricYear = toNumber(q.year);
            const metricRegion = normalizeWhitespace(String(q.region || regionDefault || 'BC')).slice(0, 80);
            const metricCategory = inferCategory(metricName, q.category || categoryHint);
            const confidence = normalizeConfidence(q.confidence);

            const schemaValidity = metricName && metricValue != null ? 1 : 0;
            const yearOk = metricYear == null || (metricYear >= 1900 && metricYear <= nowYear + 1);
            const plausibility = metricValue == null ? 0 : (Math.abs(Number(metricValue)) <= 1_000_000_000 && yearOk ? 1 : 0.35);
            if (!yearOk) invalidYearCount += 1;
            const score = clamp(
              confidenceScore(confidence) * 0.45 +
              schemaValidity * 0.3 +
              plausibility * 0.25,
              0,
              1,
            );

            const dedupeKey = `${metricName.toLowerCase()}|${metricYear || 'na'}|${metricRegion.toLowerCase()}`;
            if (rowKeys.has(dedupeKey)) duplicateCount += 1;
            rowKeys.add(dedupeKey);

            return {
              finding_id: `q-${idx + 1}`,
              metric_name: metricName,
              metric_value: metricValue,
              unit: normalizeWhitespace(String(q.unit || '')).slice(0, 40),
              year: metricYear,
              region: metricRegion,
              category: metricCategory,
              comparison_value: toNumber(q.comparison_value),
              direction: normalizeWhitespace(String(q.direction || '')).slice(0, 30),
              confidence,
              confidence_score: Number(score.toFixed(3)),
              confidence_level: confidenceLevelFromScore(score),
              publish_state: publishStateFromScore(score),
              notes: normalizeWhitespace(String(q.notes || '')).slice(0, 600),
              page_reference: normalizeWhitespace(String(q.page_reference || '')).slice(0, 80),
            };
          })
          .filter((q: any) => q.metric_name && q.metric_value != null);

        const qualitative = (extracted.qualitative_findings || [])
          .map((q: QualFinding, idx: number) => {
            const theme = normalizeWhitespace(String(q.theme || '')).slice(0, 160);
            const finding = normalizeWhitespace(String(q.finding || '')).slice(0, 1000);
            const implication = normalizeWhitespace(String(q.implication || '')).slice(0, 800);
            const recommendation = normalizeWhitespace(String(q.recommendation || '')).slice(0, 800);
            const evidenceQuote = normalizeWhitespace(String(q.evidence_quote || '')).slice(0, 800);
            const pageReference = normalizeWhitespace(String(q.page_reference || '')).slice(0, 80);

            const extractionScore = 0.62;
            const citationQuality = evidenceQuote || pageReference ? 1 : 0.45;
            const thematicClarity = theme || finding ? 1 : 0.4;
            const score = clamp(
              extractionScore * 0.45 +
              citationQuality * 0.3 +
              thematicClarity * 0.25,
              0,
              1,
            );

            return {
              finding_id: `ql-${idx + 1}`,
              theme,
              finding,
              implication,
              recommendation,
              severity: normalizeWhitespace(String(q.severity || '')).slice(0, 30),
              sentiment: normalizeWhitespace(String(q.sentiment || '')).slice(0, 30),
              population_group: normalizeWhitespace(String(q.population_group || '')).slice(0, 160),
              evidence_quote: evidenceQuote,
              page_reference: pageReference,
              confidence_score: Number(score.toFixed(3)),
              confidence_level: confidenceLevelFromScore(score),
              publish_state: publishStateFromScore(score),
            };
          })
          .filter((q: any) => q.theme || q.finding || q.recommendation);

        let provisionalCount =
          quantitative.filter((q: any) => q.publish_state === 'provisional').length
          + qualitative.filter((q: any) => q.publish_state === 'provisional').length;
        let suppressedCount =
          quantitative.filter((q: any) => q.publish_state === 'suppressed').length
          + qualitative.filter((q: any) => q.publish_state === 'suppressed').length;
        const anomaliesCount = duplicateCount + invalidYearCount;

        let metricsImported = 0;
        const createdMetrics: any[] = [];

        const importableRows = quantitative.filter((q: any) =>
          q.publish_state === 'candidate' || (Boolean(body.import_provisional_metrics) && q.publish_state === 'provisional')
        );

        if (importMetrics && importableRows.length) {
          const metricPayloads = importableRows.map((q: any, idx: number) => {
            const year = q.year && q.year >= 1900 && q.year <= nowYear + 1 ? q.year : nowYear;
            const fresh = year >= nowYear - 1 ? 0.9 : year >= nowYear - 3 ? 0.7 : 0.45;
            return {
              name: q.metric_name,
              category: q.category,
              region: q.region || regionDefault || 'BC',
              year,
              value: q.metric_value,
              unit: q.unit || '',
              comparison_value: q.comparison_value,
              confidence_level: q.confidence_level || 'medium',
              data_source_name: reportTitle,
              notes: `${q.notes || ''}${q.page_reference ? ` (page ${q.page_reference})` : ''}`.trim(),
              metis_specific: true,
              evidence_grade: q.confidence_level === 'high' ? 'high' : q.confidence_level === 'low' ? 'low' : 'moderate',
              freshness_score: fresh,
              version: 1,
              lineage_id: `report:${reportTitle.toLowerCase().slice(0, 60)}:${year}:${idx}:${q.finding_id || idx}`,
              ingest_job_id: String(currentQueueDocId || fileHash).slice(0, 120),
            };
          });

          try {
            const created = await base44.asServiceRole.entities.HealthMetric.bulkCreate(metricPayloads);
            createdMetrics.push(...(created || []));
            metricsImported = metricPayloads.length;
          } catch {
            for (const payload of metricPayloads) {
              try {
                const created = await base44.asServiceRole.entities.HealthMetric.create(payload);
                createdMetrics.push(created);
                metricsImported += 1;
              } catch {
                // Skip bad rows and keep processing.
              }
            }
          }
        }

        const keywordTags = inferTags({
          sourceName: reportTitle,
          quantitative,
          qualitative,
          extra: extracted.tags || [],
        });

        let synthesized = buildHeuristicSummary({
          sourceName: reportTitle,
          quantitative,
          qualitative,
          provisionalCount,
          suppressedCount,
        });

        const hasSignals = quantitative.length + qualitative.length > 0;
        const shouldGenerateNarrative = useLlmSummary && hasSignals && tokenUsed < disableNarrativeAt;
        if (shouldGenerateNarrative) {
          const contextBlocks = [
            `Report title: ${reportTitle}`,
            `Summary hint: ${reportSummary || 'n/a'}`,
            `Quantitative findings:\n${quantitative.slice(0, 18).map((q: any, i: number) => `${i + 1}. ${q.metric_name}: ${q.metric_value}${q.unit ? ` ${q.unit}` : ''} (${q.year || 'year n/a'}) region=${q.region}`).join('\n') || 'none'}`,
            `Qualitative findings:\n${qualitative.slice(0, 14).map((q: any, i: number) => `${i + 1}. theme=${q.theme || 'n/a'} | finding=${q.finding || 'n/a'} | implication=${q.implication || 'n/a'} | recommendation=${q.recommendation || 'n/a'}`).join('\n') || 'none'}`,
          ]
            .join('\n\n')
            .slice(0, maxContextChars);

          tokenUsed += estimateTokens(contextBlocks);

          try {
            const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `You are a health policy intelligence analyst.\nConvert extracted report findings into a concise, decision-ready output.\nGround every claim in the extracted findings only.\n\n${contextBlocks}`,
              response_json_schema: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  key_findings: { type: 'array', items: { type: 'string' } },
                  policy_actions: { type: 'array', items: { type: 'string' } },
                  keywords: { type: 'array', items: { type: 'string' } },
                  confidence: { type: 'number' },
                },
              },
            });

            synthesized = {
              summary: String(llm?.summary || synthesized.summary),
              key_findings: Array.isArray(llm?.key_findings) ? llm.key_findings.slice(0, 12) : synthesized.key_findings,
              policy_actions: Array.isArray(llm?.policy_actions) ? llm.policy_actions.slice(0, 10) : synthesized.policy_actions,
              keywords: Array.isArray(llm?.keywords) ? llm.keywords.slice(0, 16) : synthesized.keywords,
              confidence: Number(clamp(Number(llm?.confidence ?? synthesized.confidence), 0.2, 0.95).toFixed(2)),
            };
          } catch {
            // Fall back to heuristic summary.
          }
        }

        const evidenceConfidence = mean([
          ...quantitative.slice(0, 200).map((q: any) => Number(q.confidence_score || confidenceScore(q.confidence))),
          ...qualitative.slice(0, 200).map((q: any) => Number(q.confidence_score || 0.62)),
        ]);
        const confidence = Number(clamp(mean([synthesized.confidence || 0.6, evidenceConfidence]), 0.2, 0.95).toFixed(2));

        const conflicts: any[] = [];
        for (const q of quantitative.slice(0, 800)) {
          if (!q.metric_name || q.year == null || q.metric_value == null || !q.region) continue;
          const key = `${String(q.metric_name).toLowerCase().trim()}|${Number(q.year)}|${String(q.region).toLowerCase().trim()}`;
          const baselineRows = baselineByKey.get(key) || [];
          const reference = baselineRows[0] || null;
          if (!reference || reference.value == null) continue;
          const baseValue = Number(reference.value);
          if (!Number.isFinite(baseValue) || baseValue === 0) continue;
          const divergence = Math.abs((Number(q.metric_value) - baseValue) / Math.abs(baseValue)) * 100;
          if (divergence < 20) continue;
          conflicts.push({
            metric_name: q.metric_name,
            region: q.region,
            category: q.category,
            year: q.year,
            baseline_value: baseValue,
            incoming_value: q.metric_value,
            divergence_pct: Number(divergence.toFixed(2)),
            severity: divergence >= 35 ? 'critical' : divergence >= 25 ? 'high' : 'medium',
            finding_id: q.finding_id,
          });
        }

        if (conflicts.length) {
          const conflictedIds = new Set(conflicts.map((c: any) => c.finding_id));
          for (const q of quantitative) {
            if (!conflictedIds.has(q.finding_id)) continue;
            if (q.publish_state !== 'suppressed') q.publish_state = 'provisional';
          }
          provisionalCount =
            quantitative.filter((q: any) => q.publish_state === 'provisional').length
            + qualitative.filter((q: any) => q.publish_state === 'provisional').length;
          suppressedCount =
            quantitative.filter((q: any) => q.publish_state === 'suppressed').length
            + qualitative.filter((q: any) => q.publish_state === 'suppressed').length;
        }

        for (const c of conflicts.slice(0, 30)) {
          await base44.asServiceRole.entities.AlertEvent.create({
            alert_type: 'source_conflict',
            severity: c.severity,
            status: 'open',
            category: c.category,
            region: c.region,
            metric_name: c.metric_name,
            summary: `Report conflict (${c.divergence_pct}%): ${c.metric_name} in ${c.region} (${c.year})`,
            description: `Report value ${c.incoming_value} diverges from baseline ${c.baseline_value}.`,
            detected_by: 'processImportedReport',
            detected_at: new Date().toISOString(),
            metadata: c,
          }).catch(() => {});
        }

        const highImpactLowConfidence = quantitative.some((q: any) => {
          const cat = String(q.category || '').toLowerCase();
          return ['mental_health', 'maternal_child', 'mortality', 'substance_use', 'access_to_care'].includes(cat)
            && Number(q.confidence_score || 0) < 0.75;
        });
        const requiresReview = provisionalCount > 0 || suppressedCount > 0 || anomaliesCount > 0 || conflicts.length > 0 || highImpactLowConfidence;
        const blockedFromPolicy = confidence < 0.45;

        const reportRecord = {
          title: reportTitle,
          source_name: currentSourceName,
          source_url: currentFileUrl,
          source_type: currentSourceType,
          report_metadata: reportMeta,
          summary_hint: reportSummary,
          quantitative_findings: quantitative.slice(0, maxMetrics),
          qualitative_findings: qualitative.slice(0, maxQualFindings),
          findings_counts: {
            quantitative_total: quantitative.length,
            qualitative_total: qualitative.length,
            provisional_count: provisionalCount,
            suppressed_count: suppressedCount,
          },
          quality: {
            anomalies_count: anomaliesCount,
            duplicate_rows: duplicateCount,
            invalid_years: invalidYearCount,
            conflict_count: conflicts.length,
            ocr_fallback_attempted: ocrFallbackAttempted,
          },
          policy_state: blockedFromPolicy ? 'analysis_only' : requiresReview ? 'provisional' : 'indexed',
          confidence_score: confidence,
          extracted_at: new Date().toISOString(),
        };

        let knowledgeDoc: any = null;
        if (indexKnowledge) {
          const content = JSON.stringify({
            ...queuedContent,
            ...reportRecord,
            pre_extracted_data: preExtracted || queuedContent.pre_extracted_data || null,
            _ingestion: {
              ...queuedIngestion,
              idempotency_key: idempotencyKey,
              file_hash: fileHash,
              schema_version: schemaVersion,
              options_hash: optionsHash,
              attempt_count: attemptCount,
              finished_at: new Date().toISOString(),
              next_retry_at: null,
              error_message: null,
              token_budget: tokenBudget,
              token_used: tokenUsed,
              extractor_version: 'report-ingestion-v2',
            },
          });
          const nextDocStatus = blockedFromPolicy ? 'analysis_only' : requiresReview ? 'provisional' : 'indexed';
          if (currentQueueDocId) {
            knowledgeDoc = await safeUpdateKnowledgeDocument(base44, currentQueueDocId, {
              title: reportTitle,
              content,
              summary: synthesized.summary,
              keywords: [...new Set([...(synthesized.keywords || []), ...keywordTags])].slice(0, 24),
              tags: [...new Set([...(synthesized.keywords || []), ...keywordTags])].slice(0, 24),
              source_url: currentFileUrl,
              source_type: currentSourceType,
              indexed_by: user.email,
              indexed_at: new Date().toISOString(),
              status: nextDocStatus,
            });
          } else {
            knowledgeDoc = await safeCreateKnowledgeDocument(base44, {
              title: reportTitle,
              content,
              summary: synthesized.summary,
              keywords: [...new Set([...(synthesized.keywords || []), ...keywordTags])].slice(0, 24),
              tags: [...new Set([...(synthesized.keywords || []), ...keywordTags])].slice(0, 24),
              source_url: currentFileUrl,
              source_type: currentSourceType,
              indexed_by: user.email,
              indexed_at: new Date().toISOString(),
              status: nextDocStatus,
            });
          }
        } else if (currentQueueDocId) {
          await safeUpdateKnowledgeDocument(base44, currentQueueDocId, {
            status: blockedFromPolicy ? 'analysis_only' : requiresReview ? 'provisional' : 'queued',
            content: JSON.stringify({
              ...queuedContent,
              ...reportRecord,
              _ingestion: {
                ...queuedIngestion,
                idempotency_key: idempotencyKey,
                file_hash: fileHash,
                schema_version: schemaVersion,
                options_hash: optionsHash,
                attempt_count: attemptCount,
                finished_at: new Date().toISOString(),
                token_budget: tokenBudget,
                token_used: tokenUsed,
                error_message: null,
              },
            }),
          }).catch(() => {});
        }

        let insight: any = null;
        if (createInsight && !blockedFromPolicy) {
          const insightContent = [
            'Report Intelligence Summary',
            synthesized.summary,
            '',
            'Key Findings',
            ...(synthesized.key_findings || []).map((k: string) => `- ${k}`),
            '',
            'Recommended Actions',
            ...(synthesized.policy_actions || []).map((k: string) => `- ${k}`),
            '',
            `Review required: ${requiresReview ? 'yes' : 'no'}`,
            'Source',
            `- ${currentFileUrl}`,
          ].join('\n');

          insight = await base44.asServiceRole.entities.AIInsight.create({
            title: `Report Intelligence - ${reportTitle.slice(0, 110)}`,
            type: 'report_intelligence',
            prompt: reportTitle,
            content: insightContent,
            generated_by: user.email,
            confidence_score: confidence,
            requires_approval: requiresReview,
            approval_status: requiresReview ? 'pending' : 'approved',
            pinned: false,
          }).catch(() => null);
        }

        if (insight?.id) {
          for (const metric of createdMetrics.slice(0, 25)) {
            await base44.asServiceRole.entities.EvidenceLink.create({
              link_type: 'report_metric',
              insight_id: insight.id,
              metric_id: metric.id,
              metric_name: metric.name,
              source_name: reportTitle,
              evidence_grade: metric.evidence_grade || 'moderate',
              confidence_score: Number(metric.freshness_score || confidence),
              uncertainty: Number((1 - confidence).toFixed(3)),
              model_version: 'report-ingestion-v2',
            }).catch(() => {});
          }
        }

        let reviewTaskId: string | null = null;
        if (requiresReview && (knowledgeDoc?.id || currentQueueDocId)) {
          const reviewDocId = knowledgeDoc?.id || currentQueueDocId;
          const pendingTasks = await base44.asServiceRole.entities.ApprovalTask
            .filter({ entity_type: 'KnowledgeDocument', entity_id: reviewDocId, status: 'pending' }, '-created_date', 1)
            .catch(() => []);
          if (!pendingTasks.length) {
            const notes = [
              `Confidence=${confidence}`,
              `Provisional=${provisionalCount}`,
              `Suppressed=${suppressedCount}`,
              `Conflicts=${conflicts.length}`,
              `Anomalies=${anomaliesCount}`,
              `TokenUsed=${tokenUsed}/${tokenBudget}`,
            ].join(' | ');
            const taskRow = await createReportReviewTask({
              base44,
              docId: reviewDocId,
              docTitle: reportTitle,
              requester: user.email,
              priority: conflicts.length > 0 || highImpactLowConfidence ? 'high' : 'medium',
              notes,
            });
            reviewTaskId = taskRow?.id || null;
          } else {
            reviewTaskId = pendingTasks[0]?.id || null;
          }
        }

        const result = {
          file_url: currentFileUrl,
          report_title: reportTitle,
          metrics_imported: metricsImported,
          quantitative_extracted: quantitative.length,
          qualitative_extracted: qualitative.length,
          knowledge_document_id: knowledgeDoc?.id || currentQueueDocId || null,
          insight_id: insight?.id || null,
          review_task_id: reviewTaskId,
          confidence_score: confidence,
          provisional_count: provisionalCount,
          suppressed_count: suppressedCount,
          conflicts_detected: conflicts.length,
          blocked_from_policy: blockedFromPolicy,
          narrative_disabled_for_budget: useLlmSummary && tokenUsed >= disableNarrativeAt,
          token_budget: tokenBudget,
          token_used: tokenUsed,
          summary: synthesized.summary,
          idempotency_key: idempotencyKey,
          duration_ms: Date.now() - oneStart,
        };

        await base44.asServiceRole.entities.AIInsight.create({
          title: `Report Ingestion Cache - ${reportTitle.slice(0, 80)}`,
          type: 'report_intelligence_cache',
          prompt: idempotencyKey,
          content: JSON.stringify(result),
          generated_by: user.email,
          confidence_score: confidence,
          requires_approval: false,
          approval_status: 'approved',
          pinned: false,
        }).catch(() => {});

        if (currentFileUrl !== idempotencyKey) {
          await base44.asServiceRole.entities.AIInsight.create({
            title: `Report Ingestion Cache Legacy Key - ${reportTitle.slice(0, 70)}`,
            type: 'report_intelligence_cache',
            prompt: currentFileUrl,
            content: JSON.stringify(result),
            generated_by: user.email,
            confidence_score: confidence,
            requires_approval: false,
            approval_status: 'approved',
            pinned: false,
          }).catch(() => {});
        }

        processedResults.push(result);
      } catch (error: any) {
        failures.push({
          file_url: job.file_url || null,
          source_name: job.source_name || null,
          error: error.message,
        });
        if (currentQueueDocId) {
          const retriesRemaining = attemptCount < 3;
          const nextRetry = retriesRemaining ? nextRetryAt(attemptCount) : null;
          await safeUpdateKnowledgeDocument(base44, currentQueueDocId, {
            status: retriesRemaining ? 'queued' : 'failed',
            summary: retriesRemaining
              ? `Retry scheduled after failure (attempt ${attemptCount}/3).`
              : `Report processing failed after ${attemptCount} attempts: ${error.message}`,
            content: JSON.stringify({
              ...queuedContent,
              _ingestion: {
                ...queuedIngestion,
                idempotency_key: idempotencyKey,
                file_hash: fileHash,
                schema_version: schemaVersion,
                options_hash: optionsHash,
                attempt_count: attemptCount,
                finished_at: new Date().toISOString(),
                next_retry_at: nextRetry,
                error_message: error.message,
                token_budget: tokenBudget,
                token_used: tokenUsed,
              },
            }),
          }).catch(() => {});

          if (!retriesRemaining) {
            await createReportReviewTask({
              base44,
              docId: currentQueueDocId,
              docTitle: String(job.source_name || currentQueueDocId),
              requester: user.email,
              priority: 'high',
              notes: `Ingestion failed after retries. Error: ${error.message}`,
            }).catch(() => null);
          }
        }
      }
    }

    const summary = `Processed ${processedResults.length} report(s), failed ${failures.length}.`;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: failures.length && processedResults.length === 0 ? 'failed' : 'completed',
      summary,
      items_processed: jobs.length,
      items_actioned: processedResults.length,
      duration_ms: Date.now() - start,
      output: JSON.stringify({ processedResults, failures }, null, 2),
      error_message: failures.length ? failures.map((f) => `${f.source_name || f.file_url}: ${f.error}`).join(' | ') : undefined,
    }).catch(() => {});

    return Response.json({
      success: failures.length === 0,
      processed: processedResults.length,
      failed: failures.length,
      results: processedResults,
      errors: failures,
    });
  } catch (error) {
    if (base44 && task?.id) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'failed',
        summary: `Report ingestion failed: ${error.message}`,
        duration_ms: Date.now() - start,
        error_message: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
