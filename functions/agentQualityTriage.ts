import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const start = Date.now();

    const task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: "Quality Triage Agent",
      task_type: "quality_triage",
      status: "running",
      triggered_by: "scheduled",
    });

    // Get open flags and team members
    const [flags, users] = await Promise.all([
      base44.asServiceRole.entities.DataQualityFlag.filter({ status: "open" }, '-created_date', 200),
      base44.asServiceRole.entities.User.list(),
    ]);

    if (flags.length === 0) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, { status: "completed", summary: "No open flags to triage.", items_processed: 0, items_actioned: 0, duration_ms: Date.now() - start });
      return Response.json({ success: true, triaged: 0 });
    }

    // Identify analysts/admins for assignment
    const assignable = users.filter(u => u.role === 'admin' || u.role === 'analyst');

    const flagSummary = flags.slice(0, 30).map(f =>
      `ID:${f.id.slice(-6)} | ${f.severity} | ${f.flag_type} | Metric: "${f.metric_name}" | ${f.description}`
    ).join('\n');

    const userList = assignable.map(u => `${u.email} (${u.role})`).join(', ') || 'No analysts available';

    const prompt = `You are a data quality triage agent for the BC Métis Health Intelligence Platform.

Review the following open data quality flags and for each one:
1. Assess whether the issue is likely a real data problem or could be explainable (e.g. policy change, known data collection gap)
2. Suggest a resolution approach in 1-2 sentences
3. Assign to the most appropriate team member from the available users list
4. Set a recommended priority (critical, high, medium, low)

Available team members: ${userList}

Open flags (showing ${Math.min(30, flags.length)} of ${flags.length}):
${flagSummary}

Provide your triage output. Be concise and actionable.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          triaged_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                flag_id_suffix: { type: "string" },
                assessment: { type: "string" },
                suggested_resolution: { type: "string" },
                assign_to_email: { type: "string" },
                recommended_priority: { type: "string" }
              }
            }
          },
          overall_summary: { type: "string" }
        }
      }
    });

    let actioned = 0;
    for (const t of (result.triaged_flags || [])) {
      const flag = flags.find(f => f.id.endsWith(t.flag_id_suffix));
      if (!flag) continue;
      const assignedUser = assignable.find(u => u.email === t.assign_to_email);
      const updates = {
        status: "in_review",
        resolution_notes: `[AI Triage] ${t.assessment}\n\nSuggested resolution: ${t.suggested_resolution}`,
      };
      if (assignedUser) {
        updates.assigned_to_email = assignedUser.email;
        updates.assigned_to_name = assignedUser.full_name;
      }
      await base44.asServiceRole.entities.DataQualityFlag.update(flag.id, updates);
      actioned++;
    }

    const duration = Date.now() - start;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: "completed",
      summary: result.overall_summary || `Triaged ${actioned} of ${flags.length} open flags.`,
      output: result.overall_summary,
      items_processed: flags.length,
      items_actioned: actioned,
      duration_ms: duration,
    });

    return Response.json({ success: true, triaged: actioned, duration_ms: duration });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});