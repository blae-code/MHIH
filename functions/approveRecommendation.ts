import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      recommendation_id,
      action,
      reviewer_notes = '',
    } = body;

    if (!recommendation_id || !action) {
      return Response.json({ error: 'recommendation_id and action are required' }, { status: 400 });
    }

    const validActions = ['approve', 'reject', 'request_changes'];
    if (!validActions.includes(action)) {
      return Response.json({ error: `Invalid action. Use one of: ${validActions.join(', ')}` }, { status: 400 });
    }

    const recommendation = await base44.asServiceRole.entities.Recommendation.get(recommendation_id).catch(async () => {
      const found = await base44.asServiceRole.entities.Recommendation.filter({ id: recommendation_id }, '-created_date', 1);
      return found?.[0] || null;
    });

    if (!recommendation) {
      return Response.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const nextApprovalStatus = action === 'approve'
      ? 'approved'
      : action === 'reject'
        ? 'rejected'
        : 'changes_requested';

    const nextStatus = action === 'approve'
      ? 'approved'
      : action === 'reject'
        ? 'rejected'
        : 'pending';

    const updatedRecommendation = await base44.asServiceRole.entities.Recommendation.update(recommendation.id, {
      approval_status: nextApprovalStatus,
      status: nextStatus,
      reviewer_notes,
      reviewed_by: user.email,
      reviewed_date: new Date().toISOString(),
    });

    const tasks = await base44.asServiceRole.entities.ApprovalTask.filter({ entity_type: 'Recommendation', entity_id: recommendation.id, status: 'pending' }, '-created_date', 50);
    await Promise.all(tasks.map((t: any) => base44.asServiceRole.entities.ApprovalTask.update(t.id, {
      status: action === 'request_changes' ? 'changes_requested' : 'completed',
      decision: action,
      reviewed_by: user.email,
      reviewed_date: new Date().toISOString(),
      notes: reviewer_notes || t.notes,
    })));

    if (action === 'approve') {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'recommendation_approved',
        entity_type: 'Recommendation',
        entity_id: recommendation.id,
        entity_name: recommendation.title || recommendation.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        details: reviewer_notes || 'Recommendation approved for policy consideration',
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      recommendation_id: recommendation.id,
      approval_status: updatedRecommendation.approval_status,
      status: updatedRecommendation.status,
      action,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
