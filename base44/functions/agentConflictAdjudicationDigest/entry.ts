import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function daysOld(ts?: string) {
  if (!ts) return 999;
  const ms = Date.now() - new Date(ts).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

function severityWeight(level?: string) {
  const s = String(level || '').toLowerCase();
  if (s === 'critical') return 4;
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  return 1;
}

function isRecent(ts: string | undefined, hours: number) {
  if (!ts || hours <= 0) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000;
}

Deno.serve(async (req) => {
  const start = Date.now();
  let base44: any = null;
  let task: any = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const triggeredBy = String(body.triggered_by || 'manual').toLowerCase() === 'scheduled' ? 'scheduled' : 'manual';
    const lowReliabilityThreshold = Math.max(1, Math.min(99, Number(body.low_reliability_threshold ?? 65)));
    const backlogThreshold = Math.max(1, Number(body.backlog_threshold ?? 8));
    const forceRun = Boolean(body.force_run);
    const minIntervalHours = Math.max(0, Number(body.min_interval_hours ?? (triggeredBy === 'scheduled' ? 168 : 0)));

    if (!forceRun && minIntervalHours > 0) {
      const recentRuns = await base44.asServiceRole.entities.AgentTask.filter(
        { task_type: 'conflict_adjudication_digest', status: 'completed' },
        '-created_date',
        1
      );
      const latest = recentRuns[0];
      if (latest && isRecent(latest.created_date, minIntervalHours)) {
        return Response.json({
          success: true,
          skipped: true,
          reason: `Run suppressed by min interval (${minIntervalHours}h).`,
          last_run_at: latest.created_date,
        });
      }
    }

    task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: 'Conflict Adjudication Digest',
      task_type: 'conflict_adjudication_digest',
      status: 'running',
      triggered_by: triggeredBy,
    });

    const [conflicts, approvalTasks, profiles] = await Promise.all([
      base44.asServiceRole.entities.AlertEvent.filter({ alert_type: 'source_conflict' }, '-created_date', 2000),
      base44.asServiceRole.entities.ApprovalTask.filter({ entity_type: 'AlertEvent', status: 'pending' }, '-due_date', 1200),
      base44.asServiceRole.entities.SourceReliabilityProfile.list('-reliability_score', 600),
    ]);

    const openConflicts = conflicts.filter((a: any) => ['open', 'acknowledged'].includes(String(a.status || '').toLowerCase()));
    const criticalOpen = openConflicts.filter((a: any) => String(a.severity || '').toLowerCase() === 'critical');
    const highOpen = openConflicts.filter((a: any) => String(a.severity || '').toLowerCase() === 'high');
    const agingOver7 = openConflicts.filter((a: any) => daysOld(a.detected_at || a.created_date) >= 7);

    const overdueApprovals = approvalTasks.filter((t: any) => t.due_date && new Date(t.due_date).getTime() < Date.now());
    const lowReliability = profiles.filter((p: any) => Number(p.reliability_score || 0) < lowReliabilityThreshold);

    const highestRisk = [...openConflicts]
      .sort((a: any, b: any) => {
        const sev = severityWeight(b.severity) - severityWeight(a.severity);
        if (sev !== 0) return sev;
        return daysOld(b.detected_at || b.created_date) - daysOld(a.detected_at || a.created_date);
      })
      .slice(0, 6);

    const lines = [
      `Conflict digest (${new Date().toLocaleDateString('en-CA')})`,
      `Open conflicts: ${openConflicts.length} (critical ${criticalOpen.length}, high ${highOpen.length})`,
      `Aging >7 days: ${agingOver7.length}`,
      `Pending adjudication approvals: ${approvalTasks.length} (overdue ${overdueApprovals.length})`,
      `Low-reliability sources (<${lowReliabilityThreshold}): ${lowReliability.length}`,
      '',
      'Top unresolved conflicts:',
      ...(highestRisk.length
        ? highestRisk.map((a: any, i: number) => `${i + 1}. [${a.severity}] ${a.metric_name || a.alert_type} (${a.region || 'BC'}) - ${a.summary || a.description || 'no summary'}`)
        : ['1. None']),
    ];

    const digestText = lines.join('\n');

    await base44.asServiceRole.entities.AIInsight.create({
      title: `Conflict Adjudication Digest - ${new Date().toLocaleDateString('en-CA')}`,
      type: 'conflict_digest',
      content: digestText,
      generated_by: 'Conflict Governance Agent',
      confidence_score: 0.88,
      requires_approval: false,
      approval_status: 'approved',
      pinned: false,
    }).catch(() => {});

    const backlogRisk = criticalOpen.length + overdueApprovals.length;
    if (backlogRisk >= backlogThreshold) {
      const existing = await base44.asServiceRole.entities.AlertEvent.filter(
        { alert_type: 'conflict_backlog', detected_by: 'agentConflictAdjudicationDigest', status: 'open' },
        '-created_date',
        1
      );

      const payload = {
        alert_type: 'conflict_backlog',
        severity: backlogRisk >= backlogThreshold * 2 ? 'critical' : 'high',
        status: 'open',
        category: 'governance',
        region: 'BC',
        metric_name: 'Conflict Backlog',
        lead_time_score: Math.min(100, backlogRisk * 8),
        confidence_score: 0.9,
        summary: `Conflict adjudication backlog risk: critical open=${criticalOpen.length}, overdue approvals=${overdueApprovals.length}.`,
        description: `Weekly digest flagged backlog pressure above threshold (${backlogThreshold}).`,
        detected_by: 'agentConflictAdjudicationDigest',
        detected_at: new Date().toISOString(),
        metadata: {
          backlog_risk: backlogRisk,
          critical_open: criticalOpen.length,
          overdue_approvals: overdueApprovals.length,
        },
      };

      if (existing.length) {
        await base44.asServiceRole.entities.AlertEvent.update(existing[0].id, payload);
      } else {
        await base44.asServiceRole.entities.AlertEvent.create(payload);
      }
    }

    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: 'completed',
      summary: `Digest complete: open_conflicts=${openConflicts.length}, overdue_adjudications=${overdueApprovals.length}, low_reliability_sources=${lowReliability.length}.`,
      items_processed: conflicts.length + approvalTasks.length + profiles.length,
      items_actioned: highestRisk.length,
      duration_ms: Date.now() - start,
      output: digestText,
    }).catch(() => {});

    return Response.json({
      success: true,
      open_conflicts: openConflicts.length,
      critical_open: criticalOpen.length,
      overdue_adjudications: overdueApprovals.length,
      low_reliability_sources: lowReliability.length,
      backlog_threshold: backlogThreshold,
      digest: digestText,
    });
  } catch (error) {
    if (base44 && task?.id) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'failed',
        summary: `Conflict digest failed: ${error.message}`,
        duration_ms: Date.now() - start,
        error_message: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
