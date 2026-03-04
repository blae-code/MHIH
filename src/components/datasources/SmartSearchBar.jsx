import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Sparkles, Loader2, X, History } from "lucide-react";

/**
 * SmartSearchBar — reusable AI-powered search bar for data source browsers.
 *
 * Props:
 *   value, onChange, onSearch  — controlled input + submit handler
 *   placeholder                — input placeholder text
 *   quickSearches              — array of { label, query } OR string[]
 *   aiContext                  — brief context string sent to LLM for better suggestions
 *   filterSlot                 — optional JSX rendered below the bar (sort/filter controls)
 */
export default function SmartSearchBar({ value, onChange, onSearch, placeholder, quickSearches = [], aiContext = "", filterSlot, recentSearches = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced AI autocomplete
  useEffect(() => {
    if (!value || value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a search assistant for a BC Métis health data platform. The user is searching a dataset catalogue.
Context: ${aiContext}
User typed: "${value}"
Return 5 short, relevant search query suggestions (max 6 words each) that would help find relevant health datasets. Focus on Indigenous health, BC health authority data, social determinants, and related topics.
Return as a JSON array of strings only. No explanations.`,
          response_json_schema: {
            type: "object",
            properties: { suggestions: { type: "array", items: { type: "string" } } }
          }
        });
        const s = res?.suggestions || [];
        setSuggestions(s.slice(0, 5));
        setShowSuggestions(s.length > 0);
      } catch (_) { setSuggestions([]); }
      setAiLoading(false);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const handleSelect = (s) => {
    onChange(s);
    setShowSuggestions(false);
    setShowHistory(false);
    setSuggestions([]);
    onSearch(s);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setShowSuggestions(false);
    setShowHistory(false);
    onSearch(value);
  };

  const qs = quickSearches.map(q => typeof q === "string" ? { label: q, query: q } : q);

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                autoFocus
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: "var(--text-primary)" }}
                placeholder={placeholder || "Search datasets..."}
                value={value}
                onChange={e => { onChange(e.target.value); }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                  else if (!value && recentSearches.length > 0) setShowHistory(true);
                }}
                onBlur={() => setTimeout(() => { setShowSuggestions(false); setShowHistory(false); }, 150)}
              />
              {aiLoading && <Loader2 size={12} className="animate-spin shrink-0" style={{ color: "var(--accent-primary)" }} />}
              {!aiLoading && value && (
                <button type="button" onClick={() => { onChange(""); setSuggestions([]); setShowSuggestions(false); }}>
                  <X size={12} style={{ color: "var(--text-muted)" }} />
                </button>
              )}
              {!aiLoading && (
                <Sparkles size={12} style={{ color: "var(--accent-primary)", opacity: 0.6, flexShrink: 0 }} title="AI autocomplete active" />
              )}
            </div>

            {/* Recent searches dropdown */}
            {showHistory && !value && recentSearches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-md overflow-hidden shadow-xl z-50"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <div className="px-3 py-1 border-b flex items-center gap-1"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                  <History size={10} style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Recent searches</span>
                </div>
                {recentSearches.slice(0, 5).map((s, i) => (
                  <button key={i} type="button"
                    className="w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    onMouseDown={() => handleSelect(s)}>
                    <History size={10} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-md overflow-hidden shadow-xl z-50"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <div className="px-3 py-1 border-b flex items-center gap-1"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                  <Sparkles size={10} style={{ color: "var(--accent-primary)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>AI suggestions</span>
                </div>
                {suggestions.map((s, i) => (
                  <button key={i} type="button"
                    className="w-full text-left px-3 py-2 text-xs transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    onMouseOver={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    onMouseDown={() => handleSelect(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium shrink-0"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            <Search size={12} /> Search
          </button>
        </div>
      </form>

      {/* Quick searches */}
      {qs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {qs.map(q => (
            <button key={q.query}
              onClick={() => handleSelect(q.query)}
              className="text-xs px-2 py-0.5 rounded-full transition-colors"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
              onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Extra filter/sort slot */}
      {filterSlot && <div>{filterSlot}</div>}
    </div>
  );
}