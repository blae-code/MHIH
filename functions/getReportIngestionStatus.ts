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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reportDocumentId = String(body.report_document_id || body.queue_doc_id || '').trim();
    const fileUrl = String(body.file_url || '').trim();

    if (!reportDocumentId && !fileUrl) {
      return Response.json({ error: 'report_document_id (or queue_doc_id) or file_url is required' }, { status: 400 });
    }

    let doc: any = null;
    if (reportDocumentId) {
      doc = await base44.asServiceRole.entities.KnowledgeDocument.get(reportDocumentId).catch(async () => {
        const found = await base44.asServiceRole.entities.KnowledgeDocument.filter({ id: reportDocumentId }, '-created_date', 1);
        return found?.[0] || null;
      });
    } else {
      const found = await base44.asServiceRole.entities.KnowledgeDocument
        .filter({ source_type: 'uploaded_report', source_url: fileUrl }, '-created_date', 1)
        .catch(() => []);
      doc = found?.[0] || null;
    }

    if (!doc) {
      return Response.json({ error: 'Report document not found' }, { status: 404 });
    }

    const content = safeJsonParse(doc.content);
    const ingestion = content?._ingestion || {};
    const quantitative = Array.isArray(content?.quantitative_findings) ? content.quantitative_findings : [];
    const qualitative = Array.isArray(content?.qualitative_findings) ? content.qualitative_findings : [];

    const approvedQuant = quantitative.filter((q: any) => q?.publish_state === 'approved' || q?.publish_state === 'candidate').length;
    const provisionalQuant = quantitative.filter((q: any) => q?.publish_state === 'provisional').length;
    const suppressedQuant = quantitative.filter((q: any) => q?.publish_state === 'suppressed').length;

    const approvedQual = qualitative.filter((q: any) => q?.publish_state === 'approved' || q?.publish_state === 'candidate').length;
    const provisionalQual = qualitative.filter((q: any) => q?.publish_state === 'provisional').length;
    const suppressedQual = qualitative.filter((q: any) => q?.publish_state === 'suppressed').length;

    const approvalTasks = await base44.asServiceRole.entities.ApprovalTask
      .filter({ entity_id: doc.id }, '-created_date', 30)
      .catch(() => []);

    const pendingTasks = approvalTasks.filter((t: any) => String(t.status || '').toLowerCase() === 'pending');
    const reviewRequired = pendingTasks.length > 0 || String(doc.status || '').toLowerCase() === 'provisional';

    return Response.json({
      success: true,
      report_document_id: doc.id,
      title: doc.title,
      status: doc.status || 'unknown',
      source_url: doc.source_url || null,
      source_type: doc.source_type || null,
      summary: doc.summary || null,
      ingestion: {
        idempotency_key: ingestion.idempotency_key || null,
        file_hash: ingestion.file_hash || null,
        schema_version: ingestion.schema_version || null,
        attempt_count: Number(ingestion.attempt_count || 0),
        started_at: ingestion.started_at || null,
        finished_at: ingestion.finished_at || null,
        next_retry_at: ingestion.next_retry_at || null,
        error_message: ingestion.error_message || null,
        token_budget: Number(ingestion.token_budget || 0),
        token_used: Number(ingestion.token_used || 0),
      },
      findings: {
        quantitative_total: quantitative.length,
        qualitative_total: qualitative.length,
        quantitative: {
          approved_or_candidate: approvedQuant,
          provisional: provisionalQuant,
          suppressed: suppressedQuant,
        },
        qualitative: {
          approved_or_candidate: approvedQual,
          provisional: provisionalQual,
          suppressed: suppressedQual,
        },
      },
      review: {
        required: reviewRequired,
        pending_tasks: pendingTasks.length,
        latest_task: pendingTasks[0] || approvalTasks[0] || null,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
