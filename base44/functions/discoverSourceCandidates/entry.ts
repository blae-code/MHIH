/**
 * discoverSourceCandidates — uses an LLM with internet context to find new
 * publications, datasets, and reports from reliable sources relevant to
 * Métis health and policy. Creates SourceCandidate records awaiting review.
 *
 * Trigger paths:
 *   - Scheduled (weekly automation): no body required.
 *   - Manual (admin): { topics?: string[], max_candidates?: number }
 *
 * Auth: admin only for manual; scheduled allowed without user.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_TOPICS = [
  'Métis health statistics in British Columbia',
  'Indigenous health data BC 2025 2026',
  'BC Indigenous chronic disease prevalence',
  'Métis Nation BC wellness survey',
  'StatsCan Indigenous identity health PUMF',
  'FNHA First Nations Health Authority new datasets',
  'BC health authority Métis specific indicators',
];

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          url: { type: 'string' },
          publisher: { type: 'string' },
          publication_date: { type: 'string' },
          summary: { type: 'string' },
          relevance_score: { type: 'number' },
          relevance_reason: { type: 'string' },
          suggested_type: {
            type: 'string',
            enum: ['statcan', 'bc_health', 'fnha', 'manual_upload', 'api', 'other'],
          },
          suggested_category: {
            type: 'string',
            enum: [
              'chronic_disease',
              'mental_health',
              'substance_use',
              'maternal_child',
              'social_determinants',
              'demographics',
              'mortality',
              'access_to_care',
              'other',
            ],
          },
          suggested_region: { type: 'string' },
        },
        required: ['name', 'url', 'publisher', 'summary', 'relevance_score'],
      },
    },
  },
  required: ['candidates'],
};

function normalizeUrl(u) {
  if (!u) return '';
  return String(u).trim().toLowerCase().replace(/\/+$/, '').replace(/[?#].*$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const isScheduled = body?.trigger === 'scheduled' || body?.event?.type === 'scheduled';

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    if (!isScheduled) {
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    const topics = Array.isArray(body?.topics) && body.topics.length > 0 ? body.topics : DEFAULT_TOPICS;
    const maxCandidates = Math.min(Number(body?.max_candidates) || 12, 25);
    const runId = `discovery_${Date.now().toString(36)}`;

    // Pull existing DataSource URLs + existing pending/approved candidate URLs to dedupe.
    const [existingSources, existingCandidates] = await Promise.all([
      base44.asServiceRole.entities.DataSource.list('-updated_date', 500).catch(() => []),
      base44.asServiceRole.entities.SourceCandidate.filter(
        { status: 'pending' }, '-created_date', 500
      ).catch(() => []),
    ]);
    const knownUrls = new Set([
      ...existingSources.map(s => normalizeUrl(s.url)).filter(Boolean),
      ...existingCandidates.map(c => normalizeUrl(c.url)).filter(Boolean),
    ]);

    const prompt = `You are a research librarian for the Métis Nation BC health policy team. Your task is to discover NEW publicly available datasets, statistical reports, and structured health/social publications that would be valuable additions to a Métis health data repository.

Search the web for sources matching these topics:
${topics.map(t => `- ${t}`).join('\n')}

Prioritize sources from:
- Statistics Canada (statcan.gc.ca)
- BC Government / BC Stats / DataBC
- First Nations Health Authority (fnha.ca)
- BC Centre for Disease Control (bccdc.ca)
- Health Canada (canada.ca/en/health-canada)
- Public Health Agency of Canada
- Métis Nation BC and other Métis governance bodies
- Peer-reviewed Canadian Indigenous health research published 2024-2026

For each candidate:
- Provide the DIRECT URL to the publication or dataset landing page (not a generic homepage)
- Give a 1-2 sentence summary of what it contains and why it matters for Métis health policy
- Score relevance from 0-100 (100 = highly Métis-specific BC data; 50 = Indigenous-relevant Canadian data; 20 = general health data with potential subgroup analysis)
- Suggest the best matching DataSource type and category enum value

Return at most ${maxCandidates} of the most relevant, recently published sources. Do not include sources you cannot directly verify exist.`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: DISCOVERY_SCHEMA,
      model: 'gemini_3_flash',
    });

    const candidates = Array.isArray(llmResult?.candidates) ? llmResult.candidates : [];

    let created = 0;
    let skipped = 0;
    const createdRecords = [];

    for (const c of candidates) {
      const url = String(c.url || '').trim();
      if (!url) { skipped += 1; continue; }
      const norm = normalizeUrl(url);
      if (knownUrls.has(norm)) { skipped += 1; continue; }
      knownUrls.add(norm);

      const record = {
        name: String(c.name || '').slice(0, 300),
        url,
        publisher: String(c.publisher || '').slice(0, 200),
        publication_date: typeof c.publication_date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(c.publication_date)
          ? c.publication_date.slice(0, 10)
          : undefined,
        summary: String(c.summary || '').slice(0, 1000),
        relevance_score: Math.max(0, Math.min(100, Number(c.relevance_score) || 0)),
        relevance_reason: String(c.relevance_reason || '').slice(0, 500),
        suggested_type: c.suggested_type || 'other',
        suggested_category: c.suggested_category || 'other',
        suggested_region: String(c.suggested_region || 'BC').slice(0, 100),
        status: 'pending',
        discovered_by: isScheduled ? 'scheduled' : 'manual',
        discovery_run_id: runId,
      };

      try {
        const result = await base44.asServiceRole.entities.SourceCandidate.create(record);
        createdRecords.push({ id: result.id, name: record.name, score: record.relevance_score });
        created += 1;
      } catch (err) {
        skipped += 1;
      }
    }

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'discovery_run',
      entity_type: 'SourceCandidate',
      entity_id: runId,
      entity_name: `Discovery run ${runId}`,
      user_email: user?.email || 'system@mhip',
      user_name: user?.full_name || 'Scheduled Discovery',
      details: `topics=${topics.length}, llm_returned=${candidates.length}, created=${created}, skipped=${skipped}`,
    }).catch(() => {});

    return Response.json({
      success: true,
      run_id: runId,
      llm_returned: candidates.length,
      created,
      skipped_duplicates: skipped,
      candidates: createdRecords,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error?.message || String(error),
    }, { status: 500 });
  }
});