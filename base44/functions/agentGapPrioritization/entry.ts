import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const EXPECTED_CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care"];
const EXPECTED_REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];
const CURRENT_YEAR = new Date().getFullYear();
const EXPECTED_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const start = Date.now();

    const task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: "Gap Prioritization Agent",
      task_type: "gap_prioritization",
      status: "running",
      triggered_by: "scheduled",
    });

    const metrics = await base44.asServiceRole.entities.HealthMetric.list('-year', 2000);

    // Map what we have
    const coverage = new Set(metrics.map(m => `${m.category}|${m.region}|${m.year}`));

    // Find gaps
    const gaps = [];
    for (const cat of EXPECTED_CATEGORIES) {
      for (const region of EXPECTED_REGIONS) {
        for (const year of EXPECTED_YEARS) {
          if (!coverage.has(`${cat}|${region}|${year}`)) {
            gaps.push({ category: cat, region, year });
          }
        }
      }
    }

    if (gaps.length === 0) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, { status: "completed", summary: "No critical gaps found. Coverage is complete for expected categories, regions, and years.", items_processed: 0, items_actioned: 0, duration_ms: Date.now() - start });
      return Response.json({ success: true, gaps_found: 0 });
    }

    // Use LLM to score and prioritize
    const gapList = gaps.slice(0, 40).map(g => `${g.category} / ${g.region} / ${g.year}`).join('\n');

    const prompt = `You are a health data strategist for the BC Métis Health Intelligence Platform.

The following data gaps have been identified (missing category + region + year combinations). 
Score each gap from 0-100 for strategic priority (100 = most urgent to fill).

Consider:
- Clinical urgency: mental health, substance use, maternal/child health are high priority
- Equity lens: Northern BC and Indigenous-specific regions are higher priority
- Recency: recent years are more valuable than older gaps
- Policy relevance: demographics and social determinants inform funding decisions

Gaps to prioritize:
${gapList}

Return prioritized gaps with scores and brief reasoning. Also suggest the most likely data source for each (StatCan, FNHA, BC CDC, CIHI, etc.).`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          prioritized_gaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                region: { type: "string" },
                year: { type: "number" },
                priority_score: { type: "number" },
                priority_reason: { type: "string" },
                suggested_source: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Clear old open gaps, insert fresh
    const existing = await base44.asServiceRole.entities.DataGap.filter({ status: "open" }, '-created_date', 2000);
    await Promise.all(existing.map(g => base44.asServiceRole.entities.DataGap.delete(g.id)));

    let created = 0;
    for (const g of (result.prioritized_gaps || [])) {
      await base44.asServiceRole.entities.DataGap.create({
        category: g.category,
        region: g.region,
        year: g.year,
        missing_indicator: `${g.category} data for ${g.region} (${g.year})`,
        priority_score: g.priority_score,
        priority_reason: g.priority_reason,
        suggested_source: g.suggested_source,
        status: "open",
      });
      created++;
    }

    const duration = Date.now() - start;
    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: "completed",
      summary: `Identified ${gaps.length} data gaps. Prioritized and stored top ${created}.`,
      items_processed: gaps.length,
      items_actioned: created,
      duration_ms: duration,
    });

    return Response.json({ success: true, gaps_found: gaps.length, gaps_stored: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});