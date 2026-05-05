import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function normalize(value: any) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isRecent(ts?: string, hours = 24) {
  if (!ts) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000;
}

function sameIdArray(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function severityWeight(level?: string) {
  const s = String(level || '').toLowerCase();
  if (s === 'critical') return 4;
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  return 1;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      title,
      policy_question,
      category = 'all',
      region = 'all',
      scenario_run_id = null,
      recommendation_ids = [],
      include_recent_alerts = true,
      force_regenerate = false,
      reuse_window_hours = 24,
      max_metric_rows = 45,
      max_recommendation_rows = 8,
      max_alert_rows = 8,
    } = body;

    const targetCategory = category === 'all' ? null : category;
    const targetRegion = region === 'all' ? null : region;
    const normalizedQuestion = normalize(policy_question || 'Summarize current signals and recommended actions.');
    const recommendationIds = (recommendation_ids || []).map((id: string) => String(id)).filter(Boolean).sort();
    const reuseWindowHours = Math.max(1, Number(reuse_window_hours || 24));

    if (!force_regenerate) {
      const recentMemos = await base44.asServiceRole.entities.DecisionMemo.list('-created_date', 200);
      const reused = recentMemos.find((m: any) => {
        if (!isRecent(m.created_date || m.generated_date, reuseWindowHours)) return false;
        if (normalize(m.policy_question) !== normalizedQuestion) return false;
        if ((m.category || null) !== targetCategory) return false;
        if ((m.region || null) !== targetRegion) return false;
        if (String(m.scenario_run_id || '') !== String(scenario_run_id || '')) return false;
        if (!recommendationIds.length) return true;

        const metaIds = ((m.content || {})._request_meta?.recommendation_ids || [])
          .map((id: any) => String(id))
          .sort();
        return sameIdArray(metaIds, recommendationIds);
      });

      if (reused) {
        const tasks = await base44.asServiceRole.entities.ApprovalTask.filter({ entity_type: 'DecisionMemo', entity_id: reused.id, status: 'pending' }, '-created_date', 1);
        return Response.json({
          success: true,
          reused: true,
          memo_id: reused.id,
          approval_task_id: tasks[0]?.id || null,
          approval_status: reused.approval_status,
          confidence_score: reused.confidence_score,
          message: 'Reused recent memo to reduce token/API usage.',
        });
      }
    }

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 1200);
    const alerts = include_recent_alerts
      ? await base44.asServiceRole.entities.AlertEvent.list('-created_date', 40)
      : [];

    const scopedMetrics = metrics.filter((m: any) => {
      const catOk = category === 'all' || m.category === category;
      const regOk = region === 'all' || m.region === region;
      return catOk && regOk;
    });

    const scopedRecommendations = recommendation_ids?.length
      ? await Promise.all(recommendation_ids.map((id: string) => base44.asServiceRole.entities.Recommendation.get(id).catch(() => null)))
      : await base44.asServiceRole.entities.Recommendation.filter({ approval_status: 'pending' }, '-created_date', 12);

    const recs = (scopedRecommendations || []).filter(Boolean)
      .sort((a: any, b: any) => Number(b.priority_score || 0) - Number(a.priority_score || 0));

    if (!scopedMetrics.length && !recs.length && !alerts.length) {
      return Response.json({ error: 'No scoped data found to generate memo.' }, { status: 400 });
    }

    const metricsSummary = scopedMetrics
      .sort((a: any, b: any) => Number(b.year || 0) - Number(a.year || 0))
      .slice(0, Math.max(10, Math.min(80, Number(max_metric_rows || 45))))
      .map((m: any) =>
        `${m.name} | ${m.region || 'BC'} | ${m.year} | value=${m.value} ${m.unit || ''} | fresh=${m.freshness_score ?? 'n/a'} | evidence=${m.evidence_grade || 'unknown'}`
      )
      .join('\n');

    const recSummary = recs
      .slice(0, Math.max(3, Math.min(12, Number(max_recommendation_rows || 8))))
      .map((r: any) =>
        `- ${r.title}: ${String(r.summary || '').slice(0, 220)} (priority=${r.priority_score}, confidence=${r.confidence_score})`
      )
      .join('\n');

    const alertSummary = alerts
      .sort((a: any, b: any) => severityWeight(b.severity) - severityWeight(a.severity))
      .slice(0, Math.max(3, Math.min(12, Number(max_alert_rows || 8))))
      .map((a: any) =>
        `- ${a.alert_type} ${a.severity} (${a.region || 'BC'}): ${String(a.summary || a.description || '').slice(0, 200)}`
      )
      .join('\n');

    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are writing a policy memo for BC Metis health stakeholders.\n\nPolicy question: ${policy_question || 'Summarize current signals and recommended actions.'}\nCategory filter: ${category}\nRegion filter: ${region}\n\nEvidence metrics (sample):\n${metricsSummary || 'None'}\n\nPrioritized recommendations:\n${recSummary || 'None'}\n\nRecent alerts:\n${alertSummary || 'None'}\n\nReturn a decision-grade memo with explicit uncertainty, risks, and evidence language. Be concise and avoid repetition.`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          key_findings: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          uncertainty_notes: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const evidenceStrength = mean(scopedMetrics.slice(0, 200).map((m: any) => {
      const fresh = Number(m.freshness_score ?? 0.6);
      const grade = String(m.evidence_grade || '').toLowerCase();
      const gradeScore = grade === 'high' ? 0.95 : grade === 'moderate' ? 0.75 : grade === 'low' ? 0.45 : 0.6;
      return fresh * 0.5 + gradeScore * 0.5;
    }));

    const confidenceScore = Number(Math.max(0.2, Math.min(0.95, evidenceStrength)).toFixed(2));

    const memo = await base44.asServiceRole.entities.DecisionMemo.create({
      title: title || `Decision Memo - ${new Date().toLocaleDateString('en-CA')}`,
      policy_question: policy_question || null,
      category: category === 'all' ? null : category,
      region: region === 'all' ? null : region,
      scenario_run_id,
      content: {
        ...generated,
        _request_meta: {
          recommendation_ids: recommendationIds,
          generated_by_fn: 'generateDecisionMemo',
          generated_at: new Date().toISOString(),
        },
        _source_counts: {
          metrics: scopedMetrics.length,
          recommendations: recs.length,
          alerts: alerts.length,
        },
      },
      confidence_score: confidenceScore,
      requires_approval: true,
      approval_status: 'pending',
      status: 'draft',
      generated_by: user.email,
      generated_date: new Date().toISOString(),
    });

    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 20);
    const fallback = await base44.asServiceRole.entities.User.list('-created_date', 1);
    const reviewer = adminUsers[0] || fallback[0] || null;

    const due = new Date();
    due.setDate(due.getDate() + 3);

    const approvalTask = await base44.asServiceRole.entities.ApprovalTask.create({
      entity_type: 'DecisionMemo',
      entity_id: memo.id,
      title: `Approve memo: ${memo.title}`,
      status: 'pending',
      priority: confidenceScore < 0.5 ? 'high' : 'medium',
      assigned_to: reviewer?.id || null,
      assigned_to_email: reviewer?.email || null,
      requested_by: user.email,
      due_date: due.toISOString(),
      sla_hours: 72,
      notes: `Auto-generated memo requires human gate approval before export/publish. Confidence=${confidenceScore}`,
    });

    for (const metric of scopedMetrics.slice(0, 30)) {
      await base44.asServiceRole.entities.EvidenceLink.create({
        link_type: 'memo_evidence',
        run_id: scenario_run_id || null,
        metric_id: metric.id,
        metric_name: metric.name,
        source_name: metric.data_source_name || 'HealthMetric',
        evidence_grade: metric.evidence_grade || 'moderate',
        confidence_score: confidenceScore,
        model_version: 'memo-generator-v1',
        memo_id: memo.id,
      });
    }

    return Response.json({
      success: true,
      memo_id: memo.id,
      approval_task_id: approvalTask.id,
      approval_status: memo.approval_status,
      confidence_score: confidenceScore,
      message: 'Decision memo created and routed for approval.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
