import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function isRecent(ts: string | undefined, hours: number) {
  if (!ts || hours <= 0) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000;
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
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
      status: payload.status || 'queued',
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
      status: payload.status,
    };
    return await base44.asServiceRole.entities.KnowledgeDocument.update(id, fallback);
  }
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
    const schemaVersion = String(body.schema_version || 'report_ingestion_v2').slice(0, 60);
    const cacheTtlHours = Math.max(1, Math.min(72, Number(body.cache_ttl_hours ?? 24)));
    const forceReprocess = Boolean(body.force_reprocess);
    const autoRunWorker = Boolean(body.auto_run_worker);
    const tokenBudget = Math.max(10000, Math.min(500000, Number(body.token_budget ?? 120000)));

    if (!fileUrl) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    const options = {
      import_metrics: body.import_metrics !== false,
      index_knowledge: body.index_knowledge !== false,
      create_insight: body.create_insight !== false,
      use_llm_summary: body.use_llm_summary !== false,
      max_metrics: Math.max(1, Math.min(600, Number(body.max_metrics ?? 600))),
      max_qual_findings: Math.max(1, Math.min(180, Number(body.max_qual_findings ?? 180))),
      max_context_chars: Math.max(900, Math.min(2800, Number(body.max_context_chars ?? 2800))),
      max_chars_per_extraction_pass: Math.max(3000, Math.min(12000, Number(body.max_chars_per_extraction_pass ?? 9000))),
    };

    const [fileHash, optionsHash] = await Promise.all([
      sha256(`${fileUrl}|${fileName}|${sourceType}`),
      sha256(JSON.stringify(options)),
    ]);
    const idempotencyKey = `${fileHash}:${schemaVersion}:${optionsHash}`;

    task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: 'Report Ingestion Agent',
      task_type: 'report_ingestion_queue',
      status: 'running',
      triggered_by: String(body.triggered_by || 'manual').toLowerCase() === 'scheduled' ? 'scheduled' : 'manual',
    });

    if (!forceReprocess) {
      const cacheRows = await base44.asServiceRole.entities.AIInsight
        .filter({ type: 'report_intelligence_cache' }, '-created_date', 120)
        .catch(() => []);
      const cached = cacheRows.find((r: any) => r.prompt === idempotencyKey && isRecent(r.created_date, cacheTtlHours));
      if (cached?.content) {
        const parsed = safeJsonParse(cached.content);
        await base44.asServiceRole.entities.AgentTask.update(task.id, {
          status: 'completed',
          summary: 'Queue request reused cached report ingestion result.',
          items_processed: 1,
          items_actioned: 0,
          duration_ms: Date.now() - start,
          output: JSON.stringify({ cache_hit: true, cached_result: parsed }, null, 2),
        }).catch(() => {});

        return Response.json({
          success: true,
          cache_hit: true,
          idempotency_key: idempotencyKey,
          cached_result: parsed,
        });
      }
    }

    const existingDocs = await base44.asServiceRole.entities.KnowledgeDocument
      .filter({ source_type: sourceType, source_url: fileUrl }, '-created_date', 25)
      .catch(() => []);

    let queuedDoc = null;
    for (const doc of existingDocs) {
      const content = safeJsonParse(doc.content);
      const ingest = content?._ingestion || {};
      const sameHash = String(ingest.file_hash || '') === fileHash;
      const sameSchema = String(ingest.schema_version || '') === schemaVersion;
      if (sameHash && sameSchema) {
        queuedDoc = doc;
        break;
      }
    }

    const ingestionMeta = {
      idempotency_key: idempotencyKey,
      file_hash: fileHash,
      schema_version: schemaVersion,
      options_hash: optionsHash,
      options,
      attempt_count: 0,
      started_at: null,
      finished_at: null,
      next_retry_at: null,
      error_message: null,
      token_budget: tokenBudget,
      token_used: 0,
      extractor_version: 'report-ingestion-v2',
    };

    if (queuedDoc) {
      const existingContent = safeJsonParse(queuedDoc.content);
      const updated = {
        ...existingContent,
        _ingestion: {
          ...ingestionMeta,
          attempt_count: forceReprocess ? 0 : Number(existingContent?._ingestion?.attempt_count || 0),
          token_used: forceReprocess ? 0 : Number(existingContent?._ingestion?.token_used || 0),
        },
        pre_extracted_data: body.pre_extracted_data || existingContent.pre_extracted_data || null,
      };

      queuedDoc = await safeUpdateKnowledgeDocument(base44, queuedDoc.id, {
        title: sourceName,
        source_url: fileUrl,
        source_type: sourceType,
        content: JSON.stringify(updated),
        status: 'queued',
        summary: forceReprocess
          ? 'Queued for reprocessing.'
          : String(queuedDoc.status || '').toLowerCase() === 'queued'
            ? 'Already queued.'
            : 'Queued for ingestion.',
      });
    } else {
      const content = JSON.stringify({
        _ingestion: ingestionMeta,
        pre_extracted_data: body.pre_extracted_data || null,
        quantitative_findings: [],
        qualitative_findings: [],
      });

      queuedDoc = await safeCreateKnowledgeDocument(base44, {
        title: sourceName,
        content,
        summary: 'Queued for ingestion.',
        keywords: ['uploaded_report', 'queued'],
        tags: ['uploaded_report', 'queued'],
        source_url: fileUrl,
        source_type: sourceType,
        indexed_by: user.email,
        indexed_at: new Date().toISOString(),
        status: 'queued',
      });
    }

    if (base44?.asServiceRole?.entities?.ReportIngestionJob?.create) {
      await base44.asServiceRole.entities.ReportIngestionJob.create({
        status: 'queued',
        source_url: fileUrl,
        file_name: fileName || sourceName,
        file_hash: fileHash,
        schema_version: schemaVersion,
        attempt_count: 0,
        started_at: null,
        finished_at: null,
        error_message: null,
        token_budget: tokenBudget,
        token_used: 0,
        report_document_id: queuedDoc?.id || null,
        idempotency_key: idempotencyKey,
      }).catch(() => null);
    }

    let workerResult: any = null;
    if (autoRunWorker && queuedDoc?.id) {
      const invoked = await base44.asServiceRole.functions.invoke('runReportIngestionWorker', {
        queue_doc_id: queuedDoc.id,
        queue_limit: 1,
        import_metrics: options.import_metrics,
        index_knowledge: options.index_knowledge,
        create_insight: options.create_insight,
        use_llm_summary: options.use_llm_summary,
        max_metrics: options.max_metrics,
        max_qual_findings: options.max_qual_findings,
        max_context_chars: options.max_context_chars,
        token_budget: tokenBudget,
      }).catch(() => null);
      workerResult = invoked?.data || invoked || null;
    }

    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: 'completed',
      summary: `Queued report ingestion for ${sourceName}.`,
      items_processed: 1,
      items_actioned: 1,
      duration_ms: Date.now() - start,
      output: JSON.stringify({
        queue_doc_id: queuedDoc?.id || null,
        file_hash: fileHash,
        idempotency_key: idempotencyKey,
        worker_result: workerResult,
      }, null, 2),
    }).catch(() => {});

    return Response.json({
      success: true,
      queued: true,
      queue_doc_id: queuedDoc?.id || null,
      file_hash: fileHash,
      schema_version: schemaVersion,
      idempotency_key: idempotencyKey,
      worker_result: workerResult,
    });
  } catch (error) {
    if (base44 && task?.id) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'failed',
        summary: `Queue report ingestion failed: ${error.message}`,
        duration_ms: Date.now() - start,
        error_message: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
