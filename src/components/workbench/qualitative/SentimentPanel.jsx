/**
 * SentimentPanel — AI-driven sentiment distribution and emotional-tone
 * analysis of a qualitative text column (e.g. oral history narratives).
 */

import React, { useState } from "react";
import { HeartPulse, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SENTIMENT_COLORS = {
  positive: "#00e676",
  neutral: "#8bafd4",
  mixed: "#FEDD00",
  negative: "#ff5252",
};

export default function SentimentPanel({ column, values }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const nonEmpty = values
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .map((v) => (v.length > 400 ? v.slice(0, 400) + "…" : v));
      const sample = nonEmpty.slice(0, 150);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a qualitative researcher analyzing the emotional register of narrative texts (e.g. oral histories, testimonies, open responses) from the column "${column}".

Below are ${sample.length} texts (of ${nonEmpty.length} total).

1. Classify the overall sentiment distribution across all texts: what percentage are predominantly positive, neutral, mixed, and negative (percentages must sum to 100).
2. Identify 3-6 distinct emotional tones present (e.g. nostalgia, grief, pride, resilience, humour). For each: name, a 1-2 sentence description of how it appears, a prevalence estimate 0-100, and one short verbatim example quote.
3. Write a 2-3 sentence summary of the overall emotional character of the material, with cultural sensitivity.

Texts:
${sample.map((v, i) => `${i + 1}. ${v}`).join("\n")}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            distribution: {
              type: "object",
              properties: {
                positive: { type: "number" },
                neutral: { type: "number" },
                mixed: { type: "number" },
                negative: { type: "number" },
              },
            },
            tones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  prevalence: { type: "number" },
                  example_quote: { type: "string" },
                },
              },
            },
          },
        },
      });
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Sentiment analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!result && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-default)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Analyze the emotional register of the material — sentiment balance and emotional tones such as nostalgia, pride, grief, or resilience.
          </span>
          <button onClick={run} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-all"
            style={{ background: "rgba(255,82,82,0.10)", border: "1px solid rgba(255,82,82,0.35)", color: "#ff8a95", opacity: loading ? 0.6 : 1 }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <HeartPulse size={12} />}
            {loading ? "Analyzing…" : "Run Sentiment Analysis"}
          </button>
        </div>
      )}

      {error && (
        <div className="text-xs px-3 py-2 rounded-md"
          style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.3)", color: "#ff6b81" }}>
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="depth-card p-3.5">
            <div className="dashboard-section-label">Overall Emotional Character</div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.summary}</p>
          </div>

          {/* Sentiment distribution bar */}
          <div className="depth-card p-3.5">
            <div className="dashboard-section-label">Sentiment Distribution</div>
            <div className="flex h-4 rounded-full overflow-hidden mb-2" style={{ border: "1px solid var(--border-subtle)" }}>
              {Object.entries(SENTIMENT_COLORS).map(([k, color]) => {
                const pct = result.distribution?.[k] ?? 0;
                return pct > 0 ? (
                  <div key={k} style={{ width: `${pct}%`, background: color, opacity: 0.75 }} title={`${k}: ${pct}%`} />
                ) : null;
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(SENTIMENT_COLORS).map(([k, color]) => (
                <span key={k} className="inline-flex items-center gap-1.5 text-xs capitalize" style={{ color: "var(--text-secondary)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {k} <b className="tabular-nums" style={{ color: "var(--text-primary)" }}>{result.distribution?.[k] ?? 0}%</b>
                </span>
              ))}
            </div>
          </div>

          {/* Emotional tones */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(result.tones || []).map((t, i) => (
              <div key={i} className="depth-card p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{t.name}</span>
                  <span className="ml-auto tag" style={{ fontSize: 9 }}>{Math.round(t.prevalence)}% prevalence</span>
                </div>
                <div className="h-1 rounded-full mb-2" style={{ background: "var(--bg-hover)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(t.prevalence, 100)}%`, background: "#ff8a95", opacity: 0.7 }} />
                </div>
                <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.description}</p>
                {t.example_quote && (
                  <blockquote className="text-xs italic pl-2.5 leading-relaxed"
                    style={{ borderLeft: "2px solid rgba(255,138,149,0.4)", color: "var(--text-muted)" }}>
                    “{t.example_quote}”
                  </blockquote>
                )}
              </div>
            ))}
          </div>

          <button onClick={run} disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-md"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            {loading ? "Re-analyzing…" : "Re-run analysis"}
          </button>
        </>
      )}
    </div>
  );
}