import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function overlapScore(queryTokens: string[], text: string) {
  if (!text) return 0;
  const tokens = new Set(tokenize(text));
  let score = 0;
  for (const q of queryTokens) {
    if (tokens.has(q)) score += 1;
  }
  return queryTokens.length ? score / queryTokens.length : 0;
}

function normalizeQuery(value: string) {
  return tokenize(value).join(' ').slice(0, 300);
}

function isRecent(ts?: string, minutes = 30) {
  if (!ts) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < minutes * 60 * 1000;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim().slice(0, 600);
    const topK = Number(body.top_k || 6);
    const cacheTtlMinutes = Math.max(1, Number(body.cache_ttl_minutes ?? 30));
    const minRetrievalScore = Math.max(0, Math.min(1, Number(body.min_retrieval_score ?? 0.2)));
    const maxContextChars = Math.max(600, Math.min(5000, Number(body.max_context_chars ?? 2600)));

    if (!query) {
      return Response.json({ error: 'query is required' }, { status: 400 });
    }

    const normalized = normalizeQuery(query);
    const cacheCandidates = await base44.asServiceRole.entities.AIInsight.filter({ type: 'knowledge_query_cache' }, '-created_date', 120).catch(() => []);
    const cached = cacheCandidates.find((c: any) =>
      isRecent(c.created_date, cacheTtlMinutes) && normalizeQuery(c.prompt || '') === normalized
    );
    if (cached) {
      return Response.json({
        success: true,
        query,
        answer: cached.content || 'Cached answer unavailable.',
        confidence: cached.confidence_score ?? 0.7,
        citations: (cached.related_metrics || []).slice(0, topK),
        documents: [],
        cache_hit: true,
      });
    }

    const docs = await base44.asServiceRole.entities.KnowledgeDocument.list('-indexed_at', 1000);
    const qTokens = tokenize(query);

    const ranked = docs
      .map((doc: any) => {
        const titleScore = overlapScore(qTokens, doc.title || '') * 1.5;
        const keywordScore = overlapScore(qTokens, (doc.keywords || []).join(' ')) * 2;
        const summaryScore = overlapScore(qTokens, doc.summary || '');
        const contentScore = overlapScore(qTokens, String(doc.content || '').slice(0, 3000)) * 0.8;
        return {
          ...doc,
          retrieval_score: Number((titleScore + keywordScore + summaryScore + contentScore).toFixed(3)),
        };
      })
      .filter((d: any) => d.retrieval_score > 0)
      .sort((a: any, b: any) => b.retrieval_score - a.retrieval_score)
      .slice(0, topK);

    if (!ranked.length || Number(ranked[0].retrieval_score || 0) < minRetrievalScore) {
      return Response.json({
        success: true,
        query,
        answer: 'No sufficiently relevant policy documents were retrieved for a grounded answer. Try adding program name, region, or policy title.',
        confidence: 0.2,
        citations: [],
        documents: ranked,
        low_signal: true,
        cache_hit: false,
      });
    }

    const context = ranked
      .slice(0, Math.min(4, topK))
      .map((d: any, i: number) => `[#${i + 1}] ${d.title}\nSummary: ${String(d.summary || 'n/a').slice(0, 280)}\nKeywords: ${(d.keywords || []).slice(0, 12).join(', ')}\nSnippet: ${String(d.content || '').slice(0, 420)}`)
      .join('\n\n');

    const boundedContext = context.slice(0, maxContextChars);

    const synthesis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a policy knowledge assistant.\nUser query: ${query}\n\nRetrieved documents:\n${boundedContext}\n\nReturn a concise answer grounded only in retrieved docs. Include citations by index like [#1], [#2]. If uncertain, say so directly.`,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          citations: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
        },
      },
    });

    await base44.asServiceRole.entities.AIInsight.create({
      title: `Knowledge Cache: ${query.slice(0, 70)}`,
      type: 'knowledge_query_cache',
      prompt: query,
      content: synthesis.answer || '',
      confidence_score: Number(synthesis.confidence ?? 0.7),
      related_metrics: (synthesis.citations || []).slice(0, topK),
      generated_by: user.email || 'policy-knowledge',
      requires_approval: false,
      approval_status: 'approved',
      pinned: false,
    }).catch(() => {});

    return Response.json({
      success: true,
      query,
      answer: synthesis.answer,
      confidence: synthesis.confidence,
      citations: synthesis.citations,
      documents: ranked,
      cache_hit: false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
