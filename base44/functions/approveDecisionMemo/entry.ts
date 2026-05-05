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
      memo_id,
      action,
      reviewer_notes = '',
    } = body;

    if (!memo_id || !action) {
      return Response.json({ error: 'memo_id and action are required' }, { status: 400 });
    }

    const memo = await base44.asServiceRole.entities.DecisionMemo.get(memo_id).catch(async () => {
      const found = await base44.asServiceRole.entities.DecisionMemo.filter({ id: memo_id }, '-created_date', 1);
      return found?.[0] || null;
    });

    if (!memo) {
      return Response.json({ error: 'Decision memo not found' }, { status: 404 });
    }

    const validActions = ['approve', 'reject', 'request_changes'];
    if (!validActions.includes(action)) {
      return Response.json({ error: `Invalid action. Use one of: ${validActions.join(', ')}` }, { status: 400 });
    }

    const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested';
    const nextMemoStatus = action === 'approve' ? 'published' : 'draft';

    const updatedMemo = await base44.asServiceRole.entities.DecisionMemo.update(memo.id, {
      approval_status: nextStatus,
      status: nextMemoStatus,
      approved_by: user.email,
      approved_date: new Date().toISOString(),
      reviewer_notes,
    });

    const tasks = await base44.asServiceRole.entities.ApprovalTask.filter({ entity_id: memo.id, status: 'pending' }, '-created_date', 20);
    await Promise.all(tasks.map((t: any) => base44.asServiceRole.entities.ApprovalTask.update(t.id, {
      status: action === 'request_changes' ? 'changes_requested' : 'completed',
      decision: action,
      reviewed_by: user.email,
      reviewed_date: new Date().toISOString(),
      notes: reviewer_notes || t.notes,
    })));

    if (action === 'approve') {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'decision_memo_approved',
        entity_type: 'DecisionMemo',
        entity_id: memo.id,
        entity_name: memo.title,
        user_email: user.email,
        user_name: user.full_name || user.email,
        details: reviewer_notes || 'Approved for publish/export',
      });
    }

    return Response.json({
      success: true,
      memo_id: memo.id,
      approval_status: updatedMemo.approval_status,
      status: updatedMemo.status,
      action,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
