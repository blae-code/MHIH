import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function normalizeDoc(doc: any) {
  return {
    title: doc.title || doc.name || 'Untitled',
    content: doc.content || doc.body || doc.text || '',
    source_url: doc.source_url || doc.url || null,
    source_type: doc.source_type || 'manual',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
  };
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
      documents = [],
      include_approved_memos = true,
      replace_existing = false,
    } = body;

    const normalized = (documents || []).map(normalizeDoc).filter((d: any) => d.content || d.source_url);

    if (include_approved_memos) {
      const memos = await base44.asServiceRole.entities.DecisionMemo.filter({ approval_status: 'approved' }, '-approved_date', 200);
      for (const m of memos) {
        normalized.push({
          title: m.title,
          content: JSON.stringify(m.content || {}),
          source_url: null,
          source_type: 'approved_memo',
          tags: ['decision_memo', m.category || 'general', m.region || 'BC'].filter(Boolean),
          external_id: m.id,
        });
      }
    }

    let indexed = 0;
    const indexedDocs = [];

    for (const doc of normalized) {
      const summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Summarize this policy document for retrieval index use.\nTitle: ${doc.title}\nSource Type: ${doc.source_type}\nContent:\n${String(doc.content).slice(0, 6000)}\n\nReturn summary and searchable keywords.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      if (replace_existing && doc.source_url) {
        const duplicates = await base44.asServiceRole.entities.KnowledgeDocument.filter({ source_url: doc.source_url }, '-created_date', 100);
        await Promise.all(duplicates.map((d: any) => base44.asServiceRole.entities.KnowledgeDocument.delete(d.id)));
      }

      const created = await base44.asServiceRole.entities.KnowledgeDocument.create({
        title: doc.title,
        content: doc.content,
        summary: summary.summary || null,
        keywords: summary.keywords || [],
        tags: [...new Set([...(doc.tags || []), ...(summary.keywords || []).slice(0, 8)])],
        source_url: doc.source_url,
        source_type: doc.source_type,
        indexed_by: user.email,
        indexed_at: new Date().toISOString(),
        status: 'indexed',
      });

      indexed += 1;
      indexedDocs.push(created);
    }

    return Response.json({
      success: true,
      indexed,
      documents: indexedDocs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
