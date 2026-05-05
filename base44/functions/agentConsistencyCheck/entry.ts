import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const start = Date.now();

    const task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: "Consistency Checker",
      task_type: "consistency_check",
      status: "running",
      triggered_by: "scheduled",
    });

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 2000);

    // Group by name + year + region — find where multiple sources give different values
    const grouped = {};
    for (const m of metrics) {
      if (!m.name || !m.year || !m.region || !m.data_source_name) continue;
      const key = `${m.name.toLowerCase().trim()}|${m.year}|${m.region}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    }

    const conflicts = [];
    for (const [key, items] of Object.entries(grouped)) {
      const sources = [...new Set(items.map(i => i.data_source_name))];
      if (sources.length < 2) continue;
      const values = items.map(i => i.value).filter(v => v != null);
      if (values.length < 2) continue;
      const max = Math.max(...values), min = Math.min(...values);
      const divergence = max === 0 ? 0 : ((max - min) / Math.abs(max)) * 100;
      if (divergence > 5) {
        conflicts.push({
          indicator: items[0].name,
          year: items[0].year,
          region: items[0].region,
          category: items[0].category,
          sources: sources.join(' vs '),
          values: items.map(i => `${i.data_source_name}: ${i.value}`).join(', '),
          divergence_pct: divergence,
        });
      }
    }

    conflicts.sort((a, b) => b.divergence_pct - a.divergence_pct);

    // Use LLM to interpret and create meaningful flags for top conflicts
    let flagsCreated = 0;
    if (conflicts.length > 0) {
      const conflictSummary = conflicts.slice(0, 20).map(c =>
        `"${c.indicator}" (${c.year}, ${c.region}): ${c.values} — ${c.divergence_pct.toFixed(1)}% divergence`
      ).join('\n');

      const prompt = `You are a data quality analyst for a health intelligence platform.

The following health indicators have conflicting values from different data sources. For each conflict, provide:
1. A brief contextual explanation of why this conflict might exist
2. Which source is more likely to be authoritative and why
3. Recommended action

Conflicts:
${conflictSummary}

Be concise (1-2 sentences per conflict).`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            analyses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indicator: { type: "string" },
                  explanation: { type: "string" },
                  recommended_action: { type: "string" }
                }
              }
            }
          }
        }
      });

      for (let i = 0; i < Math.min(conflicts.length, 20); i++) {
        const c = conflicts[i];
        const analysis = result.analyses?.find(a => a.indicator?.toLowerCase().includes(c.indicator.toLowerCase().slice(0, 10)));
        await base44.asServiceRole.entities.DataQualityFlag.create({
          metric_name: c.indicator,
          flag_type: "inconsistency",
          severity: c.divergence_pct > 30 ? "high" : "medium",
          description: `Cross-source conflict: ${c.values}. Divergence: ${c.divergence_pct.toFixed(1)}%. Sources: ${c.sources}.`,
          affected_field: "value",
          affected_value: c.values,
          status: "open",
          auto_detected: true,
          category: c.category,
          region: c.region,
          year: c.year,
          resolution_notes: analysis ? `[AI Analysis] ${analysis.explanation}\n\nRecommendation: ${analysis.recommended_action}` : undefined,
        });
        flagsCreated++;
      }
    }

    const duration = Date.now() - start;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: "completed",
      summary: `Found ${conflicts.length} cross-source conflicts. Created ${flagsCreated} quality flags.`,
      items_processed: metrics.length,
      items_actioned: flagsCreated,
      duration_ms: duration,
    });

    return Response.json({ success: true, conflicts_found: conflicts.length, flags_created: flagsCreated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});