import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { description } = await req.json();

    if (!description) {
      return Response.json({ error: 'Description required' }, { status: 400 });
    }

    // Use AI to generate a meaningful stat configuration
    const prompt = `You are a health data analyst. Based on this user's request, generate a stat tile configuration.

User request: "${description}"

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "label": "Short stat title (max 20 chars)",
  "description": "One-line description of what this stat measures",
  "formula": "How to calculate this (e.g., 'avg of values where category = X')",
  "metricField": "Which field to use: 'value', 'comparison_value', or 'gap'"
}

Make it specific to health metrics and Métis health outcomes. Keep descriptions concise and actionable.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          label: { type: "string" },
          description: { type: "string" },
          formula: { type: "string" },
          metricField: { type: "string" }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});