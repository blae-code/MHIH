import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BC_LIMS_BASE = 'https://lims.leg.bc.ca';
const BC_PUBLIC_BASE = 'https://www.leg.bc.ca';
const FEDERAL_BASE = 'https://www.ourcommons.ca';
const FEDERAL_HANSARD_SEARCH = `${FEDERAL_BASE}/Search/en/publications/hansard`;

const DEFAULT_TOPICS = [
  'metis',
  'indigenous',
  'first nations',
  'health',
  'mental health',
  'substance use',
  'overdose',
  'maternal',
  'housing',
  'primary care',
  'wait time',
];

type SignalDoc = {
  jurisdiction: 'bc' | 'federal';
  source_name: string;
  title: string;
  date_iso: string | null;
  source_url: string;
  reference_id: string;
  relevance_score: number;
  freshness_score: number;
  evidence_grade: string;
  matched_keywords: string[];
  excerpt: string;
  metadata: Record<string, any>;
};

type ScanBody = {
  topics?: string[] | string;
  jurisdictions?: string[] | string;
  days_lookback?: number;
  max_docs_per_jurisdiction?: number;
  max_text_chars_per_doc?: number;
  max_context_chars?: number;
  min_relevance_score?: number;
  cache_ttl_hours?: number;
  use_cache?: boolean;
  use_llm?: boolean;
  force_llm?: boolean;
  triggered_by?: string;
};

type JurisdictionResult = {
  docs: SignalDoc[];
  scanned: number;
  errors: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function isRecent(ts: string | undefined, hours: number) {
  if (!ts || hours <= 0) return false;
  const ageMs = Date.now() - new Date(ts).getTime();
  return ageMs >= 0 && ageMs < hours * 60 * 60 * 1000;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeTopics(input?: string[] | string) {
  const source = Array.isArray(input)
    ? input
    : String(input || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const unique = new Set<string>();
  for (const topic of source) {
    const clean = normalizeWhitespace(String(topic || '').toLowerCase());
    if (clean.length >= 2) unique.add(clean);
  }

  if (!unique.size) {
    for (const fallback of DEFAULT_TOPICS) unique.add(fallback);
  }

  return Array.from(unique).slice(0, 30);
}

function normalizeJurisdictions(input?: string[] | string) {
  const source = Array.isArray(input)
    ? input
    : String(input || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const normalized = new Set<string>();
  for (const entry of source) {
    const v = String(entry || '').toLowerCase();
    if (v === 'bc' || v === 'british_columbia') normalized.add('bc');
    if (v === 'federal' || v === 'canada' || v === 'canadian') normalized.add('federal');
  }

  if (!normalized.size) {
    normalized.add('bc');
    normalized.add('federal');
  }

  return Array.from(normalized) as Array<'bc' | 'federal'>;
}

function cacheKey(params: {
  topics: string[];
  jurisdictions: string[];
  daysLookback: number;
  maxDocsPerJurisdiction: number;
  maxTextCharsPerDoc: number;
  maxContextChars: number;
  minRelevanceScore: number;
  useLlm: boolean;
}) {
  return JSON.stringify(params);
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, ' ');
}

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  const withNamed = value.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => named[m] || m);
  return withNamed
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function cleanText(value: string, maxChars: number) {
  const noScripts = value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = normalizeWhitespace(decodeEntities(stripTags(noScripts)));
  return text.slice(0, maxChars);
}

function extractBcTranscriptText(html: string, maxChars: number) {
  const transcriptMatch = html.match(/<div class="transcript">([\s\S]*?)<\/div>\s*<\/main>/i);
  return cleanText(transcriptMatch?.[1] || html, maxChars);
}

function extractFederalTranscriptText(xml: string, maxChars: number) {
  const chunks: string[] = [];
  for (const match of xml.matchAll(/<ParaText[^>]*>([\s\S]*?)<\/ParaText>/gi)) {
    const chunk = normalizeWhitespace(decodeEntities(stripTags(match[1] || '')));
    if (chunk) chunks.push(chunk);
    if (chunks.join(' ').length > maxChars * 1.6) break;
  }
  return normalizeWhitespace(chunks.join(' ')).slice(0, maxChars);
}

function parseFederalDateIso(xml: string) {
  const match = xml.match(/<ExtractedItem Name="Date">([\s\S]*?)<\/ExtractedItem>/i);
  if (!match?.[1]) return null;
  const parsed = new Date(normalizeWhitespace(stripTags(match[1])));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function withinLookback(value: string | null, daysLookback: number) {
  const date = parseDate(value);
  if (!date) return true;
  const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= daysLookback;
}

function scoreFreshness(value: string | null, daysLookback: number) {
  const date = parseDate(value);
  if (!date) return 0.45;
  const ageDays = Math.max(0, (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  return Number(clamp(1 - ageDays / Math.max(7, daysLookback * 1.6), 0.2, 1).toFixed(3));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scoreTopicRelevance(topics: string[], text: string) {
  const lower = String(text || '').toLowerCase();
  if (!lower) return { score: 0, matched: [] as string[], hits: 0 };

  const matched: string[] = [];
  let hits = 0;

  for (const topic of topics) {
    const normalized = String(topic || '').trim().toLowerCase();
    if (!normalized) continue;

    let count = 0;
    if (normalized.includes(' ')) {
      const rx = new RegExp(escapeRegex(normalized), 'gi');
      count = (lower.match(rx) || []).length;
    } else {
      const rx = new RegExp(`\\b${escapeRegex(normalized)}\\b`, 'gi');
      count = (lower.match(rx) || []).length;
    }

    if (count > 0) {
      matched.push(normalized);
      hits += count;
    }
  }

  const coverage = matched.length / Math.max(1, topics.length);
  const density = Math.min(1, hits / 35);
  const score = coverage * 0.65 + density * 0.35;
  return { score: Number(score.toFixed(3)), matched, hits };
}

function buildExcerpt(text: string, topics: string[], maxChars = 680) {
  if (!text) return '';
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const topicTokens = topics.map((t) => t.toLowerCase());

  const picks: string[] = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (topicTokens.some((t) => lower.includes(t))) {
      picks.push(sentence);
      if (picks.join(' ').length > maxChars) break;
      if (picks.length >= 4) break;
    }
  }

  const fallback = picks.length ? picks : sentences.slice(0, 2);
  return normalizeWhitespace(fallback.join(' ')).slice(0, maxChars);
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(25000),
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent': 'MHIP-Hansard-Scanner/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return await response.json();
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(25000),
    headers: {
      Accept: 'text/html,application/xml,text/xml,text/plain,*/*',
      'User-Agent': 'MHIP-Hansard-Scanner/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return await response.text();
}

async function collectBcSignals(params: {
  topics: string[];
  daysLookback: number;
  maxDocsPerJurisdiction: number;
  maxTextCharsPerDoc: number;
  minRelevanceScore: number;
}): Promise<JurisdictionResult> {
  const errors: string[] = [];

  try {
    const parliaments = await fetchJson(`${BC_LIMS_BASE}/lims/parliaments`);
    const nodes = parliaments?.allParliaments?.nodes || [];
    if (!nodes.length) {
      return { docs: [], scanned: 0, errors: ['BC parliaments endpoint returned no nodes'] };
    }

    const activeParliament = nodes.find((p: any) => !p.endDate) || nodes[0];
    const sessions = activeParliament?.sessionsByParliamentId?.nodes || [];
    const activeSession = sessions.find((s: any) => !s.endDate) || sessions[0];
    if (!activeParliament || !activeSession) {
      return { docs: [], scanned: 0, errors: ['BC active parliament/session could not be resolved'] };
    }

    const periodCode = `${activeParliament.number}${activeParliament.annotation}${activeSession.number}${activeSession.annotation}`;
    const debates = await fetchJson(`${BC_LIMS_BASE}/hdms/debates/${periodCode}`);
    const debateNodes = (debates?.allHansardFileAttributes?.nodes || []) as any[];

    const candidates = debateNodes
      .map((node: any) => {
        const attr = node?.debateAttributes?.nodes?.[0] || {};
        const dateIso = attr?.date ? new Date(attr.date).toISOString() : null;
        return { node, attr, dateIso };
      })
      .filter((item) => withinLookback(item.dateIso, params.daysLookback))
      .sort((a, b) => {
        const ta = parseDate(a.dateIso)?.getTime() || 0;
        const tb = parseDate(b.dateIso)?.getTime() || 0;
        return tb - ta;
      })
      .slice(0, Math.max(params.maxDocsPerJurisdiction * 3, params.maxDocsPerJurisdiction));

    const docs: SignalDoc[] = [];
    for (const item of candidates) {
      try {
        const filePath = String(item.node?.filePath || '');
        const fileName = String(item.node?.fileName || '');
        if (!filePath || !fileName) continue;

        const rawUrl = `${BC_LIMS_BASE}/hdms/file${filePath}/${fileName}`;
        const publicUrl = `${BC_PUBLIC_BASE}/hansard-content${filePath}/${fileName}`;
        const transcriptHtml = await fetchText(rawUrl);
        const transcriptText = extractBcTranscriptText(transcriptHtml, params.maxTextCharsPerDoc);
        const score = scoreTopicRelevance(params.topics, transcriptText);
        if (score.score < params.minRelevanceScore && score.matched.length === 0) continue;

        const title = String(item.node?.title || fileName);
        const freshness = scoreFreshness(item.dateIso, params.daysLookback);
        docs.push({
          jurisdiction: 'bc',
          source_name: 'BC Legislative Assembly Hansard',
          title,
          date_iso: item.dateIso,
          source_url: publicUrl,
          reference_id: `bc:${periodCode}:${fileName}`,
          relevance_score: score.score,
          freshness_score: freshness,
          evidence_grade: score.score >= 0.24 ? 'high' : score.score >= 0.12 ? 'moderate' : 'low',
          matched_keywords: score.matched.slice(0, 10),
          excerpt: buildExcerpt(transcriptText, params.topics),
          metadata: {
            period_code: periodCode,
            file_path: filePath,
            file_name: fileName,
            time_of_day: item.attr?.timeOfDay?.name || null,
            debate_type: item.attr?.debateType?.name || null,
            blues_status: item.attr?.bluesStatus?.name || null,
          },
        });
      } catch (error: any) {
        errors.push(`BC transcript fetch failed: ${error.message}`);
      }
    }

    docs.sort((a, b) => b.relevance_score - a.relevance_score);
    return {
      docs: docs.slice(0, params.maxDocsPerJurisdiction),
      scanned: candidates.length,
      errors,
    };
  } catch (error: any) {
    errors.push(`BC source failed: ${error.message}`);
    return { docs: [], scanned: 0, errors };
  }
}

async function collectFederalSignals(params: {
  topics: string[];
  daysLookback: number;
  maxDocsPerJurisdiction: number;
  maxTextCharsPerDoc: number;
  minRelevanceScore: number;
}): Promise<JurisdictionResult> {
  const errors: string[] = [];
  try {
    const html = await fetchText(FEDERAL_HANSARD_SEARCH);
    const pdfMatches = Array.from(
      new Set(
        Array.from(html.matchAll(/\/Content\/House\/\d+\/Debates\/\d+\/HAN\d+-E\.PDF/gi)).map((m) => m[0]),
      ),
    );

    const candidates = pdfMatches.slice(
      0,
      Math.max(params.maxDocsPerJurisdiction * 3, params.maxDocsPerJurisdiction),
    );
    const docs: SignalDoc[] = [];

    for (const pdfPath of candidates) {
      try {
        const xmlPath = pdfPath.replace(/-E\.PDF$/i, '-E.XML');
        const xmlUrl = `${FEDERAL_BASE}${xmlPath}`;
        const xml = await fetchText(xmlUrl);
        const dateIso = parseFederalDateIso(xml);
        if (!withinLookback(dateIso, params.daysLookback)) continue;

        const transcriptText = extractFederalTranscriptText(xml, params.maxTextCharsPerDoc);
        const score = scoreTopicRelevance(params.topics, transcriptText);
        if (score.score < params.minRelevanceScore && score.matched.length === 0) continue;

        const pathParts = xmlPath.match(/\/Content\/House\/(\d+)\/Debates\/(\d+)\/(HAN\d+-E)\.XML/i);
        const parliamentCode = pathParts?.[1] || null;
        const sittingCode = pathParts?.[2] || null;
        const docCode = pathParts?.[3] || 'HAN';
        const titleDate = dateIso ? new Date(dateIso).toLocaleDateString('en-CA') : 'date-unknown';
        const freshness = scoreFreshness(dateIso, params.daysLookback);

        docs.push({
          jurisdiction: 'federal',
          source_name: 'House of Commons Hansard',
          title: `Federal Hansard ${docCode} (${titleDate})`,
          date_iso: dateIso,
          source_url: `${FEDERAL_BASE}${pdfPath}`,
          reference_id: `federal:${docCode}`,
          relevance_score: score.score,
          freshness_score: freshness,
          evidence_grade: score.score >= 0.24 ? 'high' : score.score >= 0.12 ? 'moderate' : 'low',
          matched_keywords: score.matched.slice(0, 10),
          excerpt: buildExcerpt(transcriptText, params.topics),
          metadata: {
            xml_url: xmlUrl,
            parliament_code: parliamentCode,
            sitting_code: sittingCode,
            doc_code: docCode,
          },
        });
      } catch (error: any) {
        errors.push(`Federal transcript fetch failed: ${error.message}`);
      }
    }

    docs.sort((a, b) => b.relevance_score - a.relevance_score);
    return {
      docs: docs.slice(0, params.maxDocsPerJurisdiction),
      scanned: candidates.length,
      errors,
    };
  } catch (error: any) {
    errors.push(`Federal source failed: ${error.message}`);
    return { docs: [], scanned: 0, errors };
  }
}

function heuristicSummary(docs: SignalDoc[], topics: string[]) {
  if (!docs.length) {
    return {
      summary: 'No strong Hansard signals met the relevance threshold in the selected scan window.',
      key_signals: [
        'No topical debate segments reached minimum relevance.',
        'Consider broadening the topic list or increasing lookback days.',
      ],
      policy_implications: [
        'No immediate parliamentary signal requiring policy response was detected.',
      ],
      watch_items: topics.slice(0, 5).map((t) => `Continue monitoring: ${t}`),
      risk_level: 'low',
    };
  }

  const top = docs.slice(0, 4);
  const keySignals = top.map(
    (d) =>
      `${d.jurisdiction.toUpperCase()} ${d.date_iso ? new Date(d.date_iso).toLocaleDateString('en-CA') : 'unknown date'}: ${d.title} (relevance ${(d.relevance_score * 100).toFixed(0)}%).`,
  );
  const summary = `Detected ${docs.length} relevant Hansard signals across ${new Set(docs.map((d) => d.jurisdiction)).size} jurisdiction(s), led by ${top[0].jurisdiction.toUpperCase()} coverage on ${top[0].matched_keywords.slice(0, 3).join(', ') || 'tracked topics'}.`;
  const avgRelevance = mean(docs.map((d) => d.relevance_score));

  return {
    summary,
    key_signals: keySignals,
    policy_implications: [
      'Flag emerging debates for policy team review before recommendation cycles.',
      'Cross-check recurring topics against active interventions and watchlist missions.',
    ],
    watch_items: topics.slice(0, 6).map((t) => `Track mention velocity for "${t}" in upcoming sittings.`),
    risk_level: avgRelevance >= 0.35 ? 'high' : avgRelevance >= 0.2 ? 'medium' : 'low',
  };
}

function formatInsightContent(params: {
  summary: string;
  keySignals: string[];
  policyImplications: string[];
  watchItems: string[];
  docs: SignalDoc[];
  riskLevel: string;
}) {
  const lines: string[] = [];
  lines.push('Executive Summary');
  lines.push(params.summary);
  lines.push('');
  lines.push(`Risk Level: ${params.riskLevel}`);
  lines.push('');
  lines.push('Key Signals');
  lines.push(...(params.keySignals.length ? params.keySignals.map((s) => `- ${s}`) : ['- No key signals detected.']));
  lines.push('');
  lines.push('Policy Implications');
  lines.push(
    ...(params.policyImplications.length
      ? params.policyImplications.map((s) => `- ${s}`)
      : ['- No immediate policy implications identified.']),
  );
  lines.push('');
  lines.push('Watch Items');
  lines.push(...(params.watchItems.length ? params.watchItems.map((s) => `- ${s}`) : ['- No watch items generated.']));
  lines.push('');
  lines.push('Evidence');
  lines.push(
    ...(params.docs.length
      ? params.docs.map(
          (d) =>
            `- [${d.jurisdiction.toUpperCase()}] ${d.title} | relevance ${(d.relevance_score * 100).toFixed(0)}% | ${d.source_url}`,
        )
      : ['- No evidence documents selected.']),
  );
  return lines.join('\n');
}

Deno.serve(async (req) => {
  const start = Date.now();
  let base44: any = null;
  let task: any = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'user'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as ScanBody;
    const topics = normalizeTopics(body.topics);
    const jurisdictions = normalizeJurisdictions(body.jurisdictions);
    const daysLookback = Math.max(3, Math.min(120, Number(body.days_lookback ?? 21)));
    const maxDocsPerJurisdiction = Math.max(1, Math.min(8, Number(body.max_docs_per_jurisdiction ?? 4)));
    const maxTextCharsPerDoc = Math.max(1200, Math.min(24000, Number(body.max_text_chars_per_doc ?? 9000)));
    const maxContextChars = Math.max(1200, Math.min(9000, Number(body.max_context_chars ?? 4200)));
    const minRelevanceScore = clamp(Number(body.min_relevance_score ?? 0.12), 0, 1);
    const cacheTtlHours = Math.max(1, Math.min(72, Number(body.cache_ttl_hours ?? 6)));
    const useCache = body.use_cache !== false;
    const useLlm = body.use_llm !== false;
    const forceLlm = Boolean(body.force_llm);
    const triggeredBy = String(body.triggered_by || 'manual').toLowerCase() === 'scheduled' ? 'scheduled' : 'manual';

    task = await base44.asServiceRole.entities.AgentTask.create({
      agent_name: 'Hansard Intelligence Agent',
      task_type: 'hansard_intelligence',
      status: 'running',
      triggered_by: triggeredBy,
    });

    const requestFingerprint = cacheKey({
      topics,
      jurisdictions,
      daysLookback,
      maxDocsPerJurisdiction,
      maxTextCharsPerDoc,
      maxContextChars,
      minRelevanceScore,
      useLlm,
    });

    if (useCache) {
      const cachedRows = await base44.asServiceRole.entities.AIInsight.filter(
        { type: 'hansard_intelligence_cache' },
        '-created_date',
        80,
      ).catch(() => []);

      const cached = cachedRows.find(
        (row: any) => row.prompt === requestFingerprint && isRecent(row.created_date, cacheTtlHours),
      );

      if (cached?.content) {
        try {
          const parsed = JSON.parse(cached.content);
          await base44.asServiceRole.entities.AgentTask.update(task.id, {
            status: 'completed',
            summary: `Cache hit: reused prior hansard scan (${parsed?.signals?.length || 0} signals).`,
            items_processed: 0,
            items_actioned: parsed?.signals?.length || 0,
            duration_ms: Date.now() - start,
            output: `cache_key=${requestFingerprint}`,
          }).catch(() => {});

          return Response.json({
            success: true,
            cache_hit: true,
            ...parsed,
          });
        } catch {
          // Ignore malformed cache rows and continue to a fresh scan.
        }
      }
    }

    const bcResult: JurisdictionResult = jurisdictions.includes('bc')
      ? await collectBcSignals({
          topics,
          daysLookback,
          maxDocsPerJurisdiction,
          maxTextCharsPerDoc,
          minRelevanceScore,
        })
      : { docs: [], scanned: 0, errors: [] };

    const federalResult: JurisdictionResult = jurisdictions.includes('federal')
      ? await collectFederalSignals({
          topics,
          daysLookback,
          maxDocsPerJurisdiction,
          maxTextCharsPerDoc,
          minRelevanceScore,
        })
      : { docs: [], scanned: 0, errors: [] };

    const signals = [...bcResult.docs, ...federalResult.docs]
      .sort((a, b) => {
        if (b.relevance_score !== a.relevance_score) return b.relevance_score - a.relevance_score;
        const ta = parseDate(a.date_iso)?.getTime() || 0;
        const tb = parseDate(b.date_iso)?.getTime() || 0;
        return tb - ta;
      })
      .slice(0, Math.max(6, maxDocsPerJurisdiction * 2));

    const heuristic = heuristicSummary(signals, topics);
    let llmUsed = false;
    let summary = heuristic.summary;
    let keySignals = heuristic.key_signals;
    let policyImplications = heuristic.policy_implications;
    let watchItems = heuristic.watch_items;
    let riskLevel = heuristic.risk_level;

    const avgRelevance = mean(signals.map((d) => d.relevance_score));
    const avgFreshness = mean(signals.map((d) => d.freshness_score));
    const heuristicConfidence = Number(clamp(avgRelevance * 0.7 + avgFreshness * 0.3, 0.2, 0.92).toFixed(2));
    let confidenceScore = heuristicConfidence;

    const strongEnough = signals.length > 0 && (avgRelevance >= 0.16 || signals[0].relevance_score >= 0.24);
    if (useLlm && (forceLlm || strongEnough)) {
      const contextBlocks = signals.slice(0, 6).map((d, idx) => [
        `[#${idx + 1}] ${d.jurisdiction.toUpperCase()} | ${d.date_iso ? new Date(d.date_iso).toLocaleDateString('en-CA') : 'unknown date'}`,
        `Title: ${d.title}`,
        `Relevance: ${(d.relevance_score * 100).toFixed(0)}%`,
        `Keywords: ${d.matched_keywords.join(', ') || 'n/a'}`,
        `Excerpt: ${String(d.excerpt || '').slice(0, 520)}`,
        `Source: ${d.source_url}`,
      ].join('\n'));

      const boundedContext = contextBlocks.join('\n\n').slice(0, maxContextChars);
      try {
        const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a Canadian policy intelligence analyst.\nCreate a concise update for BC Metis health policy teams from Hansard evidence only.\n\nTopics of interest: ${topics.join(', ')}\n\nSignals:\n${boundedContext}\n\nRules:\n- Ground claims only in provided signals.\n- Highlight uncertainty if evidence is thin.\n- Keep implications practical.\n`,
          response_json_schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              key_signals: { type: 'array', items: { type: 'string' } },
              policy_implications: { type: 'array', items: { type: 'string' } },
              watch_items: { type: 'array', items: { type: 'string' } },
              risk_level: { type: 'string' },
              confidence: { type: 'number' },
            },
          },
        });

        llmUsed = true;
        summary = String(llmResult?.summary || summary);
        keySignals = Array.isArray(llmResult?.key_signals) ? llmResult.key_signals.slice(0, 8) : keySignals;
        policyImplications = Array.isArray(llmResult?.policy_implications)
          ? llmResult.policy_implications.slice(0, 8)
          : policyImplications;
        watchItems = Array.isArray(llmResult?.watch_items) ? llmResult.watch_items.slice(0, 8) : watchItems;
        riskLevel = String(llmResult?.risk_level || riskLevel || 'medium').toLowerCase();
        confidenceScore = Number(clamp(Number(llmResult?.confidence ?? heuristicConfidence), 0.2, 0.95).toFixed(2));
      } catch {
        llmUsed = false;
      }
    }

    const insightContent = formatInsightContent({
      summary,
      keySignals,
      policyImplications,
      watchItems,
      docs: signals,
      riskLevel,
    });

    const insight = await base44.asServiceRole.entities.AIInsight.create({
      title: `Hansard Intelligence - ${new Date().toLocaleDateString('en-CA')}`,
      type: 'hansard_intelligence',
      prompt: topics.join(', '),
      content: insightContent,
      generated_by: user.email || 'hansard-intel',
      confidence_score: confidenceScore,
      requires_approval: false,
      approval_status: 'approved',
      pinned: false,
    }).catch(() => null);

    if (insight?.id) {
      for (const doc of signals.slice(0, 10)) {
        await base44.asServiceRole.entities.EvidenceLink.create({
          link_type: 'hansard_signal',
          insight_id: insight.id,
          metric_name: doc.title,
          source_name: doc.source_name,
          evidence_grade: doc.evidence_grade,
          confidence_score: doc.relevance_score,
          uncertainty: Number((1 - doc.relevance_score).toFixed(3)),
          model_version: 'hansard-intel-v1',
        }).catch(() => {});
      }
    }

    const responsePayload = {
      topics,
      jurisdictions,
      days_lookback: daysLookback,
      scanned_documents: {
        bc: bcResult.scanned,
        federal: federalResult.scanned,
      },
      summary,
      risk_level: riskLevel,
      confidence_score: confidenceScore,
      policy_implications: policyImplications,
      watch_items: watchItems,
      key_signals: keySignals,
      signals,
      llm_used: llmUsed,
      errors: [...bcResult.errors, ...federalResult.errors].slice(0, 20),
      insight_id: insight?.id || null,
    };

    await base44.asServiceRole.entities.AIInsight.create({
      title: `Hansard Cache - ${new Date().toLocaleDateString('en-CA')}`,
      type: 'hansard_intelligence_cache',
      prompt: requestFingerprint,
      content: JSON.stringify(responsePayload),
      generated_by: user.email || 'hansard-intel-cache',
      confidence_score: confidenceScore,
      requires_approval: false,
      approval_status: 'approved',
      pinned: false,
    }).catch(() => {});

    await base44.asServiceRole.entities.AgentTask.update(task.id, {
      status: 'completed',
      summary: `Hansard scan complete: signals=${signals.length}, llm_used=${llmUsed}, bc_scanned=${bcResult.scanned}, federal_scanned=${federalResult.scanned}.`,
      items_processed: bcResult.scanned + federalResult.scanned,
      items_actioned: signals.length,
      duration_ms: Date.now() - start,
      output: JSON.stringify(
        {
          summary,
          risk_level: riskLevel,
          confidence_score: confidenceScore,
          errors: responsePayload.errors,
        },
        null,
        2,
      ),
    }).catch(() => {});

    return Response.json({
      success: true,
      cache_hit: false,
      ...responsePayload,
    });
  } catch (error: any) {
    if (base44 && task?.id) {
      await base44.asServiceRole.entities.AgentTask.update(task.id, {
        status: 'failed',
        summary: `Hansard scan failed: ${error.message}`,
        duration_ms: Date.now() - start,
        error_message: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
