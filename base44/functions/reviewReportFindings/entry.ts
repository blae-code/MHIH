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

function toSet(value: any) {
  if (!Array.isArray(value)) return new Set<string>();
  return new Set(value.map((v) => String(v)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reportDocumentId = String(body.report_document_id || body.queue_doc_id || '').trim();
    const action = String(body.action || '').trim().toLowerCase();
    const reviewerNotes = String(body.reviewer_notes || body.notes || '').trim();
    const selectedFindingIds = toSet(body.selected_finding_ids || body.finding_ids || []);

    const validActions = ['approve_all', 'approve_selected', 'reject_with_reason', 'request_reprocess'];
    if (!reportDocumentId || !validActions.includes(action)) {
      return Response.json({ error: `report_document_id and valid action are required: ${validActions.join(', ')}` }, { status: 400 });
    }

    const doc = await base44.asServiceRole.entities.KnowledgeDocument.get(reportDocumentId).catch(async () => {
      const found = await base44.asServiceRole.entities.KnowledgeDocument.filter({ id: reportDocumentId }, '-created_date', 1);
      return found?.[0] || null;
    });
    if (!doc) {
      return Response.json({ error: 'Report document not found' }, { status: 404 });
    }

    const content = safeJsonParse(doc.content);
    const quantitative = Array.isArray(content?.quantitative_findings) ? content.quantitative_findings : [];
    const qualitative = Array.isArray(content?.qualitative_findings) ? content.qualitative_findings : [];

    const applyReviewAction = (rows: any[]) => rows.map((row: any) => {
      const id = String(row?.finding_id || row?.id || '');
      const state = String(row?.publish_state || '').toLowerCase();
      const reviewable = state === 'provisional' || state === 'candidate';
      const selected = selectedFindingIds.has(id);

      if (action === 'approve_all' && reviewable) {
        return { ...row, publish_state: 'approved', reviewed_by: user.email, reviewed_at: new Date().toISOString() };
      }
      if (action === 'approve_selected' && selected && reviewable) {
        return { ...row, publish_state: 'approved', reviewed_by: user.email, reviewed_at: new Date().toISOString() };
      }
      if (action === 'reject_with_reason' && reviewable) {
        return { ...row, publish_state: 'rejected', reviewed_by: user.email, reviewed_at: new Date().toISOString() };
      }
      return row;
    });

    const nextQuant = applyReviewAction(quantitative);
    const nextQual = applyReviewAction(qualitative);

    const approvedCount = [...nextQuant, ...nextQual].filter((r: any) => String(r.publish_state || '').toLowerCase() === 'approved').length;
    const provisionalCount = [...nextQuant, ...nextQual].filter((r: any) => String(r.publish_state || '').toLowerCase() === 'provisional').length;
    const rejectedCount = [...nextQuant, ...nextQual].filter((r: any) => String(r.publish_state || '').toLowerCase() === 'rejected').length;

    const nextContent = {
      ...content,
      quantitative_findings: nextQuant,
      qualitative_findings: nextQual,
      review: {
        action,
        reviewer: user.email,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewerNotes || null,
        approved_count: approvedCount,
        provisional_count: provisionalCount,
        rejected_count: rejectedCount,
      },
    };

    let nextStatus = String(doc.status || 'provisional').toLowerCase();
    if (action === 'request_reprocess') {
      nextStatus = 'queued';
      nextContent._ingestion = {
        ...(nextContent._ingestion || {}),
        attempt_count: 0,
        next_retry_at: null,
        error_message: null,
        reprocess_requested_by: user.email,
        reprocess_requested_at: new Date().toISOString(),
      };
    } else if (action === 'reject_with_reason') {
      nextStatus = 'review_rejected';
    } else if (provisionalCount > 0) {
      nextStatus = 'provisional';
    } else {
      nextStatus = approvedCount > 0 ? 'reviewed' : 'reviewed_no_approvals';
    }

    await safeUpdateKnowledgeDocument(base44, doc.id, {
      status: nextStatus,
      summary: action === 'request_reprocess'
        ? 'Reviewer requested reprocess.'
        : `Review action ${action} completed. Approved findings: ${approvedCount}.`,
      content: JSON.stringify(nextContent),
    });

    const tasks = await base44.asServiceRole.entities.ApprovalTask
      .filter({ entity_id: doc.id, status: 'pending' }, '-created_date', 100)
      .catch(() => []);

    await Promise.all(tasks.map((t: any) => base44.asServiceRole.entities.ApprovalTask.update(t.id, {
      status: action === 'request_reprocess' ? 'changes_requested' : 'completed',
      decision: action,
      reviewed_by: user.email,
      reviewed_date: new Date().toISOString(),
      notes: reviewerNotes || t.notes,
    })));

    if (action === 'request_reprocess') {
      await base44.asServiceRole.functions.invoke('reprocessReport', {
        report_document_id: doc.id,
        force_reprocess: true,
        auto_run_worker: Boolean(body.auto_run_worker),
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      report_document_id: doc.id,
      action,
      status: nextStatus,
      approved_count: approvedCount,
      provisional_count: provisionalCount,
      rejected_count: rejectedCount,
      approval_tasks_updated: tasks.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
