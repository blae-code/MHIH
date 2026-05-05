import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const alertId = String(body.alert_id || '').trim();
    const action = String(body.action || 'resolve').trim().toLowerCase();
    const preferredSource = body.preferred_source ? String(body.preferred_source).trim() : null;
    const reason = String(body.reason || '').trim();

    if (!alertId) {
      return Response.json({ error: 'alert_id is required' }, { status: 400 });
    }
    if (!['resolve', 'dismiss', 'escalate'].includes(action)) {
      return Response.json({ error: 'action must be resolve, dismiss, or escalate' }, { status: 400 });
    }

    let alert: any = null;
    try {
      alert = await base44.asServiceRole.entities.AlertEvent.get(alertId);
    } catch {
      const found = await base44.asServiceRole.entities.AlertEvent.filter({ id: alertId }, '-created_date', 1);
      alert = found?.[0] || null;
    }

    if (!alert) {
      return Response.json({ error: 'AlertEvent not found' }, { status: 404 });
    }
    if (alert.alert_type !== 'source_conflict') {
      return Response.json({ error: 'alert_id must reference a source_conflict alert' }, { status: 400 });
    }

    const metadata = alert.metadata || {};
    const adjudication = {
      action,
      preferred_source: preferredSource,
      reason: reason || null,
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
    };

    let nextStatus = 'resolved';
    if (action === 'escalate') nextStatus = 'acknowledged';
    if (action === 'dismiss') nextStatus = 'resolved';

    const updatedAlert = await base44.asServiceRole.entities.AlertEvent.update(alert.id, {
      status: nextStatus,
      summary: action === 'resolve'
        ? `Resolved source conflict with preferred source ${preferredSource || 'unspecified'}.`
        : action === 'dismiss'
          ? 'Conflict dismissed after review.'
          : 'Conflict escalated for formal adjudication.',
      metadata: {
        ...metadata,
        adjudication,
      },
    });

    const metricName = metadata.metric_name || alert.metric_name;
    const region = metadata.region || alert.region;
    const year = metadata.year || null;

    const openFlags = await base44.asServiceRole.entities.DataQualityFlag.filter({ flag_type: 'inconsistency', status: 'open' }, '-created_date', 1000);
    const matchingFlags = openFlags.filter((f: any) => {
      const nameMatch = !metricName || String(f.metric_name || '').toLowerCase() === String(metricName).toLowerCase();
      const regionMatch = !region || String(f.region || '').toLowerCase() === String(region).toLowerCase();
      const yearMatch = !year || Number(f.year) === Number(year);
      return nameMatch && regionMatch && yearMatch;
    });

    if (action === 'resolve' || action === 'dismiss') {
      for (const flag of matchingFlags.slice(0, 30)) {
        await base44.asServiceRole.entities.DataQualityFlag.update(flag.id, {
          status: 'resolved',
          description: action === 'resolve'
            ? `Resolved by ${user.email}. Preferred source: ${preferredSource || 'n/a'}. ${reason || ''}`.trim()
            : `Dismissed by ${user.email}. ${reason || ''}`.trim(),
        });
      }
    }

    let approvalTaskId: string | null = null;
    if (action === 'escalate') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 20);
      const fallback = await base44.asServiceRole.entities.User.list('-created_date', 1);
      const reviewer = admins[0] || fallback[0] || null;
      const due = new Date();
      due.setHours(due.getHours() + 48);

      const task = await base44.asServiceRole.entities.ApprovalTask.create({
        entity_type: 'AlertEvent',
        entity_id: alert.id,
        title: `Adjudicate source conflict: ${metricName || alert.metric_name || alert.id.slice(-6)}`,
        status: 'pending',
        priority: alert.severity === 'critical' ? 'high' : 'medium',
        assigned_to: reviewer?.id || null,
        assigned_to_email: reviewer?.email || null,
        requested_by: user.email,
        due_date: due.toISOString(),
        sla_hours: 48,
        notes: `Escalated source conflict adjudication. Preferred source candidate: ${preferredSource || 'none'}. ${reason || ''}`.trim(),
      });
      approvalTaskId = task.id;
    }

    if (action === 'resolve' && preferredSource) {
      const existingProfiles = await base44.asServiceRole.entities.SourceReliabilityProfile.filter({ source_name: preferredSource }, '-updated_date', 1);
      if (existingProfiles.length) {
        const profile = existingProfiles[0];
        const current = Number(profile.reliability_score || 70);
        await base44.asServiceRole.entities.SourceReliabilityProfile.update(profile.id, {
          reliability_score: Number(clamp(current + 2, 0, 100).toFixed(1)),
          notes: `Boosted after conflict adjudication on ${new Date().toISOString().slice(0, 10)} by ${user.email}.`,
          updated_date: new Date().toISOString(),
        });
      }
    }

    await base44.asServiceRole.entities.AIInsight.create({
      title: `Conflict Adjudication - ${metricName || alert.metric_name || 'Source Conflict'}`,
      type: 'conflict_adjudication',
      content: `Action: ${action}\nPreferred source: ${preferredSource || 'n/a'}\nReason: ${reason || 'n/a'}\nReviewer: ${user.email}`,
      generated_by: user.email,
      confidence_score: 0.85,
      requires_approval: false,
      approval_status: 'approved',
      pinned: false,
    }).catch(() => {});

    return Response.json({
      success: true,
      alert_id: alert.id,
      status: updatedAlert.status,
      action,
      preferred_source: preferredSource,
      quality_flags_updated: matchingFlags.length,
      approval_task_id: approvalTaskId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
