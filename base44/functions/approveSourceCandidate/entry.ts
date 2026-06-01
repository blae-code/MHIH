/**
 * approveSourceCandidate — promote a SourceCandidate to a live DataSource.
 *
 * Body: { candidate_id: string, overrides?: Partial<DataSource> }
 * Auth: admin only.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const candidateId = body?.candidate_id;
    const overrides = body?.overrides || {};

    if (!candidateId) {
      return Response.json({ error: 'candidate_id is required' }, { status: 400 });
    }

    const candidate = await base44.asServiceRole.entities.SourceCandidate
      .filter({ id: candidateId }, '-created_date', 1)
      .then(rows => rows[0])
      .catch(() => null);

    if (!candidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.status === 'approved') {
      return Response.json({ error: 'Candidate already approved', source_id: candidate.approved_source_id }, { status: 409 });
    }

    const approverName = user.full_name || user.email;
    const approvedAt = new Date().toISOString();

    const sourcePayload = {
      name: overrides.name || candidate.name,
      type: overrides.type || candidate.suggested_type || 'other',
      url: overrides.url || candidate.url,
      description: overrides.description || candidate.summary,
      category: overrides.category || candidate.suggested_category || 'other',
      region: overrides.region || candidate.suggested_region || 'BC',
      // Compact note — just who approved it. Full detail lives in metadata.approval.
      notes: overrides.notes || `Approved by ${approverName}`,
      sync_frequency: overrides.sync_frequency || 'manual',
      status: overrides.status || 'pending',
      metadata: {
        ...(overrides.metadata || {}),
        approval: {
          approved_by_name: approverName,
          approved_by_email: user.email,
          approved_at: approvedAt,
          candidate_id: candidate.id,
          relevance_score: candidate.relevance_score ?? null,
          relevance_reason: candidate.relevance_reason || '',
          summary: candidate.summary || '',
          suggested_region: candidate.suggested_region || '',
          suggested_type: candidate.suggested_type || '',
          suggested_category: candidate.suggested_category || '',
          publisher: candidate.publisher || '',
          publication_date: candidate.publication_date || '',
          original_url: candidate.url || '',
          discovered_by: candidate.discovered_by || '',
          discovery_run_id: candidate.discovery_run_id || '',
        },
      },
    };

    const created = await base44.asServiceRole.entities.DataSource.create(sourcePayload);

    await base44.asServiceRole.entities.SourceCandidate.update(candidateId, {
      status: 'approved',
      approved_source_id: created.id,
    });

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'candidate_approved',
      entity_type: 'SourceCandidate',
      entity_id: candidateId,
      entity_name: candidate.name,
      user_email: user.email,
      user_name: user.full_name || user.email,
      details: `Promoted to DataSource ${created.id}`,
    }).catch(() => {});

    return Response.json({ success: true, source_id: created.id, candidate_id: candidateId });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});