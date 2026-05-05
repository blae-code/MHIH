import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, source_id, source_name, source_type, sample_data, metrics_snapshot } = await req.json();

    if (!question) return Response.json({ error: 'Missing question' }, { status: 400 });

    // Build a rich context from whichever data we have
    let dataContext = "";

    if (sample_data && Array.isArray(sample_data) && sample_data.length > 0) {
      const cols = Object.keys(sample_data[0]);
      const rows = sample_data.slice(0, 60);
      dataContext = `DATA SOURCE: ${source_name} (${source_type})\n`;
      dataContext += `COLUMNS: ${cols.join(", ")}\n`;
      dataContext += `SAMPLE ROWS (${rows.length} of total):\n`;
      dataContext += rows.map(r => cols.map(c => `${c}=${r[c] ?? ""}`).join(" | ")).join("\n");
    } else if (metrics_snapshot && metrics_snapshot.length > 0) {
      dataContext = `DATA SOURCE: ${source_name}\n`;
      dataContext += `HEALTH METRICS (${metrics_snapshot.length} records):\n`;
      dataContext += metrics_snapshot.slice(0, 80).map(m =>
        `${m.name} | ${m.category} | ${m.region} | year:${m.year} | value:${m.value} ${m.unit || ""}`
      ).join("\n");
    } else {
      dataContext = `DATA SOURCE: ${source_name} (${source_type})\nNo sample data available — answer based on your knowledge of this type of dataset.`;
    }

    const prompt = `You are a data analyst for the BC Métis Nation Health Intelligence Platform. A user has selected a data source and is asking a question about it.

${dataContext}

USER QUESTION: ${question}

Provide a clear, structured analytical response. Your response must include:
1. A direct answer to the question (2-4 sentences)
2. Supporting data points or evidence from the dataset (use specific numbers/values where available)
3. Key insights or patterns noticed (1-3 bullet points)
4. Limitations or caveats about this analysis (1-2 sentences)

Format the supporting_data as an array of objects with "label" and "value" fields for the top findings.
Keep the answer concise and actionable. Focus on what matters for Indigenous health policy in BC.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          supporting_data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "string" }
              }
            }
          },
          insights: { type: "array", items: { type: "string" } },
          caveats: { type: "string" }
        }
      }
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});