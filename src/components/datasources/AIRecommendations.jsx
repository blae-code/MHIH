import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronDown, ChevronUp, Loader2, Search, RefreshCw } from "lucide-react";

/**
 * AIRecommendations — proactively suggests related datasets based on context.
 *
 * Props:
 *   context: {
 *     currentQuery: string,
 *     recentSearches: string[],
 *     importedNames: string[],
 *     activeFilters: string[],
 *     sourceName: string,  // e.g. "BC Data Catalogue"
 *   }
 *   onSearchSuggestion: (query: string) => void
 */
export default function AIRecommendations({ context, onSearchSuggestion }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [generated, setGenerated] = useState(false);
  const abortRef = useRef(false);

  const generate = async () => {
    if (!context?.currentQuery && !context?.importedNames?.length && !context?.recentSearches?.length) return;
    setLoading(true);
    abortRef.current = false;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a health data librarian for a BC Métis health intelligence platform.

Based on the user's activity below, suggest 4 highly relevant dataset searches they should try next.

Source catalogue: ${context.sourceName || "health data catalogue"}
Current search query: "${context.currentQuery || "none"}"
Recent searches: ${(context.recentSearches || []).join(", ") || "none"}
Already imported datasets: ${(context.importedNames || []).join(", ") || "none"}
Active filters: ${(context.activeFilters || []).join(", ") || "none"}

Rules:
- Each suggestion must be a short search query (2–6 words) the user can click to search
- Focus on BC Indigenous health, social determinants, Métis-specific data, or gaps not covered by what they've already imported
- Include a 1-sentence rationale for each
- Do not repeat their existing searches or imports

Return as JSON only.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  rationale: { type: "string" },
                }
              }
            }
          }
        }
      });
      if (!abortRef.current) {
        setRecs(res?.recommendations?.slice(0, 4) || []);
        setGenerated(true);
      }
    } catch (_) {}
    setLoading(false);
  };

  // Auto-generate when context has enough signal
  useEffect(() => {
    if (!generated && (context?.currentQuery?.length > 2 || context?.importedNames?.length > 0)) {
      generate();
    }
    return () => { abortRef.current = true; };
  }, [context?.currentQuery, context?.importedNames?.join(",")]);

  if (!generated && !loading) return null;

  return (
    <div className="mt-3 rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => setCollapsed(v => !v)}
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
            AI Recommendations
          </span>
          {loading && <Loader2 size={11} className="animate-spin ml-1" style={{ color: "var(--text-muted)" }} />}
        </div>
        <div className="flex items-center gap-2">
          {generated && !loading && (
            <button onClick={e => { e.stopPropagation(); setGenerated(false); generate(); }}
              className="activity-icon" style={{ width: 20, height: 20 }} title="Refresh recommendations">
              <RefreshCw size={11} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
          {collapsed ? <ChevronDown size={13} style={{ color: "var(--text-muted)" }} /> : <ChevronUp size={13} style={{ color: "var(--text-muted)" }} />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-3">
          {loading && recs.length === 0 && (
            <div className="flex items-center gap-2 py-2" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs">Generating recommendations based on your activity...</span>
            </div>
          )}
          {recs.length > 0 && (
            <div className="space-y-2">
              {recs.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <button
                    onClick={() => onSearchSuggestion?.(rec.query)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-all"
                    style={{
                      background: "var(--accent-muted)",
                      color: "var(--accent-primary)",
                      border: "1px solid var(--border-default)",
                      whiteSpace: "nowrap",
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-default)"}>
                    <Search size={10} />
                    {rec.query}
                  </button>
                  <span className="text-xs leading-relaxed pt-0.5" style={{ color: "var(--text-muted)" }}>
                    {rec.rationale}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}