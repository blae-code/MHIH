import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function hoursUntil(dueDate?: string) {
  if (!dueDate) return Number.POSITIVE_INFINITY;
  return (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let authorized = false;
    let actorEmail = 'system@mhip';
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin' || user?.role === 'user') {
        authorized = true;
        actorEmail = user.email || actorEmail;
      }
    } catch {
      authorized = true;
    }

    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const warningWindowHours = Number(body.warning_window_hours ?? 24);

    const tasks = await base44.asServiceRole.entities.ApprovalTask.filter({ status: 'pending' }, '-due_date', 2000);
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 20).catch(() => []);
    const fallbackOwner = admins[0] || null;

    let nearDue = 0;
    let overdue = 0;
    const escalated: any[] = [];

    for (const task of tasks) {
      const remaining = hoursUntil(task.due_date);
      if (remaining > warningWindowHours) continue;

      const isOverdue = remaining < 0;
      if (isOverdue) overdue += 1;
      else nearDue += 1;

      const existingNotes = String(task.notes || '');
      const escalationNote = isOverdue
        ? `[SLA] Overdue by ${Math.abs(remaining).toFixed(1)}h. Escalated ${new Date().toISOString()}.`
        : `[SLA] Due in ${remaining.toFixed(1)}h. Escalation warning ${new Date().toISOString()}.`;

      const updated = await base44.asServiceRole.entities.ApprovalTask.update(task.id, {
        priority: isOverdue ? 'critical' : task.priority || 'high',
        assigned_to: task.assigned_to || fallbackOwner?.id || null,
        assigned_to_email: task.assigned_to_email || fallbackOwner?.email || null,
        notes: `${existingNotes}\n${escalationNote}`.trim(),
      });

      escalated.push(updated);

      await base44.asServiceRole.entities.AlertEvent.create({
        alert_type: 'approval_sla',
        severity: isOverdue ? 'critical' : 'high',
        status: 'open',
        category: 'governance',
        region: 'BC',
        metric_name: 'Approval SLA',
        summary: `${task.title || `Approval task ${task.id.slice(-6)}`} ${isOverdue ? 'is overdue' : 'is near due'} (${task.due_date || 'no due date'})`,
        description: `Task ${task.id} owned by ${task.assigned_to_email || 'unassigned'} triggered SLA ${isOverdue ? 'breach' : 'warning'} window (${warningWindowHours}h).`,
        detected_by: 'runApprovalSLAEscalation',
        detected_at: new Date().toISOString(),
        metadata: {
          task_id: task.id,
          due_date: task.due_date,
          remaining_hours: Number(remaining.toFixed(2)),
          escalation_level: isOverdue ? 'breach' : 'warning',
        },
      });
    }

    if (overdue > 0 || nearDue > 0) {
      await base44.asServiceRole.entities.AIInsight.create({
        title: `Approval SLA Watch — ${new Date().toLocaleDateString('en-CA')}`,
        type: 'operations',
        content: `SLA monitor flagged ${nearDue} near-due and ${overdue} overdue approval tasks. Escalations applied automatically to protect human-gate workflow integrity.`,
        generated_by: 'SLA Monitor',
        confidence_score: 0.95,
        requires_approval: false,
        approval_status: 'approved',
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      scanned: tasks.length,
      near_due: nearDue,
      overdue,
      escalated_count: escalated.length,
      warning_window_hours: warningWindowHours,
      escalated_task_ids: escalated.map(t => t.id),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
