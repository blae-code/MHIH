import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function gradeScore(value?: string) {
  const g = String(value || '').toLowerCase();
  if (g === 'high') return 0.95;
  if (g === 'moderate') return 0.75;
  if (g === 'low') return 0.45;
  return 0.6;
}

function isRecent(ts: string | undefined, minutes: number) {
  if (!ts || minutes <= 0) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < minutes * 60 * 1000;
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
    const minConfidence = clamp(Number(body.min_confidence ?? 0.58));
    const minFreshness = clamp(Number(body.min_freshness ?? 0.45));
    const minEvidenceLinks = Math.max(1, Number(body.min_evidence_links ?? 2));
    const autoRouteTopN = Math.max(0, Number(body.auto_route_top_n ?? 6));
    const minPriorityForTask = Math.max(1, Math.min(100, Number(body.min_priority_for_task ?? 72)));
    const slaHours = Math.max(4, Number(body.sla_hours ?? 72));
    const triggeredBy = String(body.triggered_by || 'manual').toLowerCase() === 'scheduled' ? 'scheduled' : 'manual';
    const forceRun = Boolean(body.force_run);
    const minIntervalMinutes = Math.max(0, Number(body.min_interval_minutes ?? (triggeredBy === 'scheduled' ? 360 : 0)));

    if (!forceRun && minIntervalMinutes > 0) {
      const recentRuns = await base44.asServiceRole.entities.AgentTask.filter(
        { task_type: 'recommendation_ranker', status: 'completed' },
        '-created_date',
        1
      );
      const latest = recentRuns[0];
      if (latest && isRecent(latest.created_date, minIntervalMinutes)) {
        return Response.json({
          success: true,
          skipped: true,
          reason: `Run suppressed by min interval (${minIntervalMinutes}m).`,
          last_run_at: latest.created_date,
        });
      }
    }

    task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: 'Recommendation Ranker',
      task_type: 'recommendation_ranker',
      status: 'running',
      triggered_by: triggeredBy,
    });

    const [recommendations, evidenceLinks, metrics] = await Promise.all([
      base44.asServiceRole.entities.Recommendation.list('-created_date', 1000),
      base44.asServiceRole.entities.EvidenceLink.list('-created_date', 5000),
      base44.asServiceRole.entities.HealthMetric.list('-year', 5000),
    ]);

    const metricById = new Map<string, any>();
    for (const m of metrics) metricById.set(m.id, m);

    const linksByRun = new Map<string, any[]>();
    for (const link of evidenceLinks) {
      if (!link.run_id) continue;
      if (!linksByRun.has(link.run_id)) linksByRun.set(link.run_id, []);
      linksByRun.get(link.run_id)!.push(link);
    }

    const candidates = recommendations.filter((r: any) => {
      const approval = String(r.approval_status || '').toLowerCase();
      return approval !== 'approved' && approval !== 'rejected';
    });

    const scored = candidates.map((rec: any) => {
      const runLinks = rec.scenario_run_id ? (linksByRun.get(rec.scenario_run_id) || []) : [];
      const evidenceCount = runLinks.length;
      const evidenceStrength = mean(runLinks.map((l) => gradeScore(l.evidence_grade)));
      const evidenceConfidence = mean(
        runLinks
          .map((l) => Number(l.confidence_score))
          .filter((v) => Number.isFinite(v))
      ) || Number(rec.confidence_score || 0.55);
      const freshness = mean(
        runLinks
          .map((l) => Number(metricById.get(l.metric_id)?.freshness_score))
          .filter((v) => Number.isFinite(v))
      ) || 0.6;
      const baselineConfidence = clamp(Number(rec.confidence_score ?? 0.55));
      const uncertainty = clamp(1 - ((baselineConfidence + evidenceConfidence) / 2));

      let composite = (
        baselineConfidence * 0.45 +
        evidenceStrength * 0.2 +
        evidenceConfidence * 0.2 +
        freshness * 0.15
      );

      if (evidenceCount < minEvidenceLinks) composite *= 0.85;
      composite = clamp(composite);

      const suppressed = composite < minConfidence || freshness < minFreshness;
      const priorityScore = Math.max(1, Math.min(100, Math.round(composite * 100 + (1 - uncertainty) * 10)));

      return {
        rec,
        composite: Number(composite.toFixed(3)),
        evidence_strength: Number(evidenceStrength.toFixed(3)),
        freshness: Number(freshness.toFixed(3)),
        uncertainty: Number(uncertainty.toFixed(3)),
        evidence_count: evidenceCount,
        priority_score: priorityScore,
        suppressed,
      };
    });

    const active = scored
      .filter((s) => !s.suppressed)
      .sort((a, b) => b.priority_score - a.priority_score);
    const suppressed = scored.filter((s) => s.suppressed);

    const rankById = new Map<string, number>();
    for (let i = 0; i < active.length; i++) {
      rankById.set(active[i].rec.id, i + 1);
    }

    for (const s of scored) {
      await base44.asServiceRole.entities.Recommendation.update(s.rec.id, {
        confidence_score: s.composite,
        priority_score: s.priority_score,
        status: s.suppressed ? 'suppressed' : 'pending',
        rank: s.suppressed ? 9999 : rankById.get(s.rec.id),
      });
    }

    const pendingApprovalTasks = await base44.asServiceRole.entities.ApprovalTask.filter({ entity_type: 'Recommendation', status: 'pending' }, '-created_date', 2000);
    const hasPendingTask = new Set(pendingApprovalTasks.map((t: any) => t.entity_id).filter(Boolean));

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 20);
    const fallback = await base44.asServiceRole.entities.User.list('-created_date', 1);
    const reviewer = admins[0] || fallback[0] || null;

    const autoRouted = active
      .filter((a) => (rankById.get(a.rec.id) || 9999) <= autoRouteTopN)
      .filter((a) => a.priority_score >= minPriorityForTask)
      .filter((a) => a.rec.requires_approval !== false)
      .filter((a) => !hasPendingTask.has(a.rec.id));

    let approvalTasksCreated = 0;
    for (const item of autoRouted) {
      const due = new Date();
      due.setHours(due.getHours() + slaHours);

      await base44.asServiceRole.entities.ApprovalTask.create({
        entity_type: 'Recommendation',
        entity_id: item.rec.id,
        title: `Review recommendation: ${String(item.rec.title || item.rec.id).slice(0, 140)}`,
        status: 'pending',
        priority: item.priority_score >= 85 ? 'high' : 'medium',
        assigned_to: reviewer?.id || null,
        assigned_to_email: reviewer?.email || null,
        requested_by: user.email,
        due_date: due.toISOString(),
        sla_hours: slaHours,
        notes: `Auto-routed by Recommendation Ranker (score=${item.composite}, priority=${item.priority_score}, rank=${rankById.get(item.rec.id)}).`,
      });
      approvalTasksCreated += 1;
      hasPendingTask.add(item.rec.id);
    }

    const topSummary = active
      .slice(0, 5)
      .map((a) => `- [rank ${rankById.get(a.rec.id)}] ${a.rec.title} (score ${(a.composite * 100).toFixed(0)}%, evidence ${a.evidence_count})`)
      .join('\n');

    await base44.asServiceRole.entities.AIInsight.create({
      title: `Recommendation Confidence Scan - ${new Date().toLocaleDateString('en-CA')}`,
      type: 'recommendation_ranking',
      content: topSummary || 'No recommendations met current confidence thresholds.',
      generated_by: 'Recommendation Ranker',
      confidence_score: Number((mean(active.slice(0, 10).map((a) => a.composite)) || 0.55).toFixed(2)),
      requires_approval: false,
      approval_status: 'approved',
      pinned: false,
    }).catch(() => {});

    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: 'completed',
      summary: `Scored ${scored.length} recommendations; active=${active.length}, suppressed=${suppressed.length}, auto-routed=${approvalTasksCreated}.`,
      items_processed: scored.length,
      items_actioned: active.length + approvalTasksCreated,
      duration_ms: Date.now() - start,
      output: topSummary || 'No eligible recommendations for ranking.',
    }).catch(() => {});

    return Response.json({
      success: true,
      recommendations_scored: scored.length,
      active_count: active.length,
      suppressed_count: suppressed.length,
      approval_tasks_created: approvalTasksCreated,
      thresholds: {
        min_confidence: minConfidence,
        min_freshness: minFreshness,
        min_evidence_links: minEvidenceLinks,
        auto_route_top_n: autoRouteTopN,
        min_priority_for_task: minPriorityForTask,
      },
      top_active: active.slice(0, 10).map((a) => ({
        id: a.rec.id,
        title: a.rec.title,
        confidence_score: a.composite,
        priority_score: a.priority_score,
        rank: rankById.get(a.rec.id),
      })),
      suppressed: suppressed.slice(0, 20).map((s) => ({
        id: s.rec.id,
        title: s.rec.title,
        confidence_score: s.composite,
        freshness: s.freshness,
        evidence_count: s.evidence_count,
      })),
    });
  } catch (error) {
    if (base44 && task?.id) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'failed',
        summary: `Recommendation ranking failed: ${error.message}`,
        duration_ms: Date.now() - start,
        error_message: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
