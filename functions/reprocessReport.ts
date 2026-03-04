import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function safeJsonParse(input: any) {
  if (!input) return {};
  if (typeof input === 'object') return input;
  try {
    return JSON.parse(String(input));
  } catch {
    return {};
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
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reportDocumentId = String(body.report_document_id || body.queue_doc_id || '').trim();
    const forceReprocess = body.force_reprocess !== false;

    if (!reportDocumentId) {
      return Response.json({ error: 'report_document_id (or queue_doc_id) is required' }, { status: 400 });
    }

    const doc = await base44.asServiceRole.entities.KnowledgeDocument.get(reportDocumentId).catch(async () => {
      const found = await base44.asServiceRole.entities.KnowledgeDocument.filter({ id: reportDocumentId }, '-created_date', 1);
      return found?.[0] || null;
    });
    if (!doc) {
      return Response.json({ error: 'Report document not found' }, { status: 404 });
    }

    const content = safeJsonParse(doc.content);
    const ingestion = content?._ingestion || {};
    const nextContent = {
      ...content,
      _ingestion: {
        ...ingestion,
        attempt_count: 0,
        started_at: null,
        finished_at: null,
        next_retry_at: null,
        error_message: null,
        token_used: 0,
        reprocess_requested_by: user.email,
        reprocess_requested_at: new Date().toISOString(),
      },
    };

    await safeUpdateKnowledgeDocument(base44, doc.id, {
      status: 'queued',
      summary: 'Reprocessing requested and queued.',
      content: JSON.stringify(nextContent),
    });

    const queueRes = await base44.asServiceRole.functions.invoke('queueReportIngestion', {
      file_url: doc.source_url,
      file_name: doc.title,
      source_name: doc.title,
      source_type: doc.source_type || 'uploaded_report',
      force_reprocess: forceReprocess,
      pre_extracted_data: content?.pre_extracted_data || null,
      auto_run_worker: Boolean(body.auto_run_worker),
      import_metrics: body.import_metrics !== false,
      index_knowledge: body.index_knowledge !== false,
      create_insight: body.create_insight !== false,
      use_llm_summary: body.use_llm_summary !== false,
      token_budget: Number(ingestion.token_budget || body.token_budget || 120000),
    });

    return Response.json({
      success: true,
      report_document_id: doc.id,
      queued: true,
      queue: queueRes?.data || queueRes || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
