import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
      try {
        await base44.asServiceRole.entities.AgentTask.list('-created_date', 1);
        authorized = true;
      } catch {
        authorized = false;
      }
    }

    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const payload = {
      queue_doc_id: body.queue_doc_id ? String(body.queue_doc_id) : null,
      queue_limit: Math.max(1, Math.min(20, Number(body.queue_limit ?? 5))),
      import_metrics: body.import_metrics !== false,
      index_knowledge: body.index_knowledge !== false,
      create_insight: body.create_insight !== false,
      use_llm_summary: body.use_llm_summary !== false,
      force_reprocess: Boolean(body.force_reprocess),
      max_metrics: Math.max(1, Math.min(600, Number(body.max_metrics ?? 600))),
      max_qual_findings: Math.max(1, Math.min(180, Number(body.max_qual_findings ?? 180))),
      max_context_chars: Math.max(900, Math.min(2800, Number(body.max_context_chars ?? 2800))),
      max_chars_per_extraction_pass: Math.max(3000, Math.min(12000, Number(body.max_chars_per_extraction_pass ?? 9000))),
      token_budget: Math.max(10000, Math.min(500000, Number(body.token_budget ?? 120000))),
      triggered_by: String(body.triggered_by || 'scheduled').toLowerCase() === 'manual' ? 'manual' : 'scheduled',
    };

    task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: 'Report Ingestion Agent',
      task_type: 'report_ingestion_worker',
      status: 'running',
      triggered_by: payload.triggered_by,
    });

    const invoked = await base44.asServiceRole.functions.invoke('processImportedReport', payload);
    const data = invoked?.data || invoked || {};

    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: data?.error ? 'failed' : 'completed',
      summary: data?.message
        || `Worker run complete: processed=${Number(data?.processed || 0)}, failed=${Number(data?.failed || 0)}.`,
      items_processed: Number(data?.processed || 0) + Number(data?.failed || 0),
      items_actioned: Number(data?.processed || 0),
      duration_ms: Date.now() - start,
      output: JSON.stringify({ actor, payload, result: data }, null, 2),
      error_message: data?.error || undefined,
    }).catch(() => {});

    return Response.json({
      success: !data?.error,
      actor,
      worker: data,
      duration_ms: Date.now() - start,
    });
  } catch (error) {
    if (base44 && task?.id) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'failed',
        summary: `Report ingestion worker failed: ${error.message}`,
        duration_ms: Date.now() - start,
        error_message: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
