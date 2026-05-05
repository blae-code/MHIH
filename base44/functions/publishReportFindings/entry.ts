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

function normalizeText(value: any) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toNumber(value: any) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/,/g, '').replace(/%/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
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
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reportDocumentId = String(body.report_document_id || body.queue_doc_id || '').trim();
    const includeMetrics = body.include_metrics !== false;
    const includeInsight = body.include_insight !== false;
    const forcePublish = Boolean(body.force_publish);

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
    const quantitative = Array.isArray(content?.quantitative_findings) ? content.quantitative_findings : [];
    const qualitative = Array.isArray(content?.qualitative_findings) ? content.qualitative_findings : [];

    const publishable = (row: any) => {
      const state = String(row?.publish_state || '').toLowerCase();
      if (state === 'approved' || state === 'candidate') return true;
      if (forcePublish && state !== 'suppressed' && state !== 'rejected') return true;
      return false;
    };

    const quantApproved = quantitative.filter(publishable);
    const qualApproved = qualitative.filter(publishable);

    if (!quantApproved.length && !qualApproved.length) {
      return Response.json({
        error: 'No approved/candidate findings available for publish. Review findings first.',
      }, { status: 400 });
    }

    let metricsCreated = 0;
    if (includeMetrics && quantApproved.length) {
      const existing = await base44.asServiceRole.entities.HealthMetric.list('-created_date', 4000).catch(() => []);
      const byLineage = new Set(existing.map((m: any) => String(m.lineage_id || '')));
      const nowYear = new Date().getFullYear();

      for (let i = 0; i < quantApproved.length; i++) {
        const row = quantApproved[i];
        const lineageId = `reportdoc:${doc.id}:${String(row.finding_id || i + 1)}`;
        if (byLineage.has(lineageId)) continue;

        const year = toNumber(row.year);
        const metric = {
          name: normalizeText(row.metric_name || row.name || `Report metric ${i + 1}`),
          category: normalizeText(row.category || 'other') || 'other',
          region: normalizeText(row.region || 'BC') || 'BC',
          year: year && year >= 1900 && year <= nowYear + 1 ? year : nowYear,
          value: toNumber(row.metric_value ?? row.value),
          unit: normalizeText(row.unit || ''),
          comparison_value: toNumber(row.comparison_value),
          confidence_level: normalizeText(row.confidence_level || row.confidence || 'medium') || 'medium',
          data_source_name: doc.title,
          notes: normalizeText(row.notes || row.finding || ''),
          metis_specific: true,
          evidence_grade: normalizeText(row.evidence_grade || 'moderate') || 'moderate',
          freshness_score: Number(row.freshness_score ?? 0.65),
          version: 1,
          lineage_id: lineageId,
          ingest_job_id: String(content?._ingestion?.idempotency_key || doc.id),
        };

        if (metric.value == null) continue;
        await base44.asServiceRole.entities.HealthMetric.create(metric).catch(() => null);
        byLineage.add(lineageId);
        metricsCreated += 1;
      }
    }

    let insightId: string | null = null;
    if (includeInsight) {
      const summary = normalizeText(doc.summary || content.summary_hint || 'Report findings were reviewed and published.');
      const keyLines = [
        ...quantApproved.slice(0, 8).map((q: any) => `- ${q.metric_name}: ${q.metric_value}${q.unit ? ` ${q.unit}` : ''}`),
        ...qualApproved.slice(0, 8).map((q: any) => `- ${q.theme || 'theme'}: ${q.finding || q.recommendation || ''}`),
      ];

      const insight = await base44.asServiceRole.entities.AIInsight.create({
        title: `Published Report Intelligence - ${String(doc.title || '').slice(0, 100)}`,
        type: 'report_intelligence',
        prompt: String(doc.title || 'uploaded report'),
        content: [
          'Published report intelligence',
          summary,
          '',
          'Approved findings',
          ...keyLines,
          '',
          `Source: ${doc.source_url || 'n/a'}`,
        ].join('\n'),
        generated_by: user.email,
        confidence_score: Number(content?.confidence_score ?? 0.78),
        requires_approval: false,
        approval_status: 'approved',
        pinned: false,
      }).catch(() => null);

      insightId = insight?.id || null;
    }

    const nextContent = {
      ...content,
      publish: {
        published_by: user.email,
        published_at: new Date().toISOString(),
        quant_published_count: quantApproved.length,
        qual_published_count: qualApproved.length,
        metrics_created: metricsCreated,
        insight_id: insightId,
      },
    };

    await safeUpdateKnowledgeDocument(base44, doc.id, {
      status: 'published',
      summary: `Published ${quantApproved.length + qualApproved.length} approved findings.`,
      content: JSON.stringify(nextContent),
    });

    return Response.json({
      success: true,
      report_document_id: doc.id,
      status: 'published',
      quantitative_published: quantApproved.length,
      qualitative_published: qualApproved.length,
      metrics_created: metricsCreated,
      insight_id: insightId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
