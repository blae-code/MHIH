import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function isRecent(ts: string | undefined, hours: number) {
  if (!ts || hours <= 0) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000;
}

function pickLatest(tasks: any[], taskType: string) {
  return tasks.find((t) => String(t.task_type || '').toLowerCase() === taskType.toLowerCase());
}

Deno.serve(async (req) => {
  const start = Date.now();
  let base44: any = null;
  let task: any = null;

  try {
    base44 = createClientFromRequest(req);

    let authorized = false;
    let actor = 'system';
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin' || user?.role === 'user') {
        authorized = true;
        actor = user.email || 'system';
      }
    } catch {
      authorized = true;
    }

    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const forceRun = Boolean(body.force_run);
    const runRanker = body.run_ranker !== false;
    const runDigest = body.run_conflict_digest !== false;
    const runSLA = body.run_sla !== false;
    const runConflictScan = body.run_conflict_scan === true;
    const runHansard = body.run_hansard === true;
    const runReportIngestion = body.run_report_ingestion === true;

    const rankerIntervalHours = Math.max(1, Number(body.ranker_interval_hours ?? 12));
    const digestIntervalHours = Math.max(12, Number(body.digest_interval_hours ?? 168));
    const slaIntervalHours = Math.max(1, Number(body.sla_interval_hours ?? 4));
    const conflictScanIntervalHours = Math.max(12, Number(body.conflict_scan_interval_hours ?? 72));
    const hansardIntervalHours = Math.max(6, Number(body.hansard_interval_hours ?? 24));
    const reportIngestionIntervalHours = Math.max(2, Number(body.report_ingestion_interval_hours ?? 8));

    task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: 'Policy Governance Scheduler',
      task_type: 'policy_governance_scheduler',
      status: 'running',
      triggered_by: 'scheduled',
    });

    const [recentTasks, pendingApprovalTasks, recentOpsInsights, latestConflictDetection] = await Promise.all([
      base44.asServiceRole.entities.AgentTask.list('-created_date', 500),
      base44.asServiceRole.entities.ApprovalTask.filter({ status: 'pending' }, '-created_date', 500),
      base44.asServiceRole.entities.AIInsight.filter({ type: 'operations' }, '-created_date', 50),
      base44.asServiceRole.entities.AlertEvent.filter({ detected_by: 'reconcileSourceConflict' }, '-created_date', 1),
    ]);

    const latestRanker = pickLatest(recentTasks, 'recommendation_ranker');
    const latestDigest = pickLatest(recentTasks, 'conflict_adjudication_digest');
    const latestHansard = pickLatest(recentTasks, 'hansard_intelligence');
    const latestReportIngestion = pickLatest(recentTasks, 'report_ingestion_worker') || pickLatest(recentTasks, 'report_ingestion');
    const latestSLAInsight = recentOpsInsights.find((i: any) => String(i.title || '').toLowerCase().includes('approval sla watch'));
    const latestConflictScan = latestConflictDetection[0] || null;

    const dueRanker = runRanker && (forceRun || !latestRanker || !isRecent(latestRanker.created_date, rankerIntervalHours));
    const dueDigest = runDigest && (forceRun || !latestDigest || !isRecent(latestDigest.created_date, digestIntervalHours));
    const hasPendingApprovals = pendingApprovalTasks.length > 0;
    const dueSLA = runSLA && hasPendingApprovals && (forceRun || !latestSLAInsight || !isRecent(latestSLAInsight.created_date, slaIntervalHours));
    const dueConflictScan = runConflictScan && (forceRun || !latestConflictScan || !isRecent(latestConflictScan.created_date, conflictScanIntervalHours));
    const dueHansard = runHansard && (forceRun || !latestHansard || !isRecent(latestHansard.created_date, hansardIntervalHours));
    const dueReportIngestion = runReportIngestion && (forceRun || !latestReportIngestion || !isRecent(latestReportIngestion.created_date, reportIngestionIntervalHours));

    const invoked: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];

    if (dueRanker) {
      try {
        const res = await base44.asServiceRole.functions.invoke('rankRecommendations', {
          triggered_by: 'scheduled',
          min_interval_minutes: Math.round(rankerIntervalHours * 60),
        });
        invoked.push({ fn: 'rankRecommendations', result: res.data || res });
      } catch (e: any) {
        errors.push({ fn: 'rankRecommendations', error: e.message });
      }
    } else {
      skipped.push({ fn: 'rankRecommendations', reason: 'not_due' });
    }

    if (dueDigest) {
      try {
        const res = await base44.asServiceRole.functions.invoke('agentConflictAdjudicationDigest', {
          triggered_by: 'scheduled',
          min_interval_hours: digestIntervalHours,
        });
        invoked.push({ fn: 'agentConflictAdjudicationDigest', result: res.data || res });
      } catch (e: any) {
        errors.push({ fn: 'agentConflictAdjudicationDigest', error: e.message });
      }
    } else {
      skipped.push({ fn: 'agentConflictAdjudicationDigest', reason: 'not_due' });
    }

    if (dueSLA) {
      try {
        const res = await base44.asServiceRole.functions.invoke('runApprovalSLAEscalation', { warning_window_hours: 24 });
        invoked.push({ fn: 'runApprovalSLAEscalation', result: res.data || res });
      } catch (e: any) {
        errors.push({ fn: 'runApprovalSLAEscalation', error: e.message });
      }
    } else {
      skipped.push({ fn: 'runApprovalSLAEscalation', reason: hasPendingApprovals ? 'not_due' : 'no_pending_approvals' });
    }

    if (dueConflictScan) {
      try {
        const res = await base44.asServiceRole.functions.invoke('reconcileSourceConflict', {});
        invoked.push({ fn: 'reconcileSourceConflict', result: res.data || res });
      } catch (e: any) {
        errors.push({ fn: 'reconcileSourceConflict', error: e.message });
      }
    } else if (runConflictScan) {
      skipped.push({ fn: 'reconcileSourceConflict', reason: 'not_due' });
    }

    if (dueHansard) {
      try {
        const res = await base44.asServiceRole.functions.invoke('scanHansards', {
          triggered_by: 'scheduled',
          use_cache: true,
          cache_ttl_hours: Math.max(4, hansardIntervalHours),
          max_docs_per_jurisdiction: 3,
          max_context_chars: 3200,
          min_relevance_score: 0.14,
        });
        invoked.push({ fn: 'scanHansards', result: res.data || res });
      } catch (e: any) {
        errors.push({ fn: 'scanHansards', error: e.message });
      }
    } else if (runHansard) {
      skipped.push({ fn: 'scanHansards', reason: 'not_due' });
    }

    if (dueReportIngestion) {
      try {
        const res = await base44.asServiceRole.functions.invoke('runReportIngestionWorker', {
          triggered_by: 'scheduled',
          queue_limit: 5,
          import_metrics: true,
          index_knowledge: true,
          create_insight: true,
        });
        invoked.push({ fn: 'runReportIngestionWorker', result: res.data || res });
      } catch (e: any) {
        errors.push({ fn: 'runReportIngestionWorker', error: e.message });
      }
    } else if (runReportIngestion) {
      skipped.push({ fn: 'runReportIngestionWorker', reason: 'not_due' });
    }

    const summary = `Governance tick: invoked=${invoked.length}, skipped=${skipped.length}, errors=${errors.length}.`;
    const status = errors.length && invoked.length === 0 ? 'failed' : 'completed';

    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status,
      summary,
      items_processed: pendingApprovalTasks.length,
      items_actioned: invoked.length,
      duration_ms: Date.now() - start,
      output: JSON.stringify({ invoked, skipped, errors }, null, 2),
      error_message: errors.length ? errors.map((e: any) => `${e.fn}: ${e.error}`).join(' | ') : undefined,
    }).catch(() => {});

    return Response.json({
      success: status === 'completed',
      scheduler: {
        actor,
        due: {
          ranker: dueRanker,
          digest: dueDigest,
          sla: dueSLA,
          conflict_scan: dueConflictScan,
          hansard: dueHansard,
          report_ingestion: dueReportIngestion,
        },
        pending_approvals: pendingApprovalTasks.length,
      },
      invoked,
      skipped,
      errors,
      duration_ms: Date.now() - start,
    });
  } catch (error) {
    if (base44 && task?.id) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'failed',
        summary: `Policy governance scheduler failed: ${error.message}`,
        duration_ms: Date.now() - start,
        error_message: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
