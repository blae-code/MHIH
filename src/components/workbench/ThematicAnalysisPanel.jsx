/**
 * ThematicAnalysisPanel — qualitative + quantitative thematic analysis of a
 * text column: keyword frequencies (client-side) and AI theme identification.
 */

import React, { useMemo, useState } from "react";
import { Sparkles, Loader2, MessageSquareText, Layers3, Quote, HeartPulse, Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { keywordFrequencies, textColumnStats, countMentions } from "@/lib/textStats";
import KeywordFrequencyChart from "@/components/workbench/KeywordFrequencyChart";
import ThemeResults from "@/components/workbench/ThemeResults";
import WorkbenchSelect from "@/components/workbench/WorkbenchSelect";
import ExcerptExplorer from "@/components/workbench/qualitative/ExcerptExplorer";
import SentimentPanel from "@/components/workbench/qualitative/SentimentPanel";
import CooccurrencePanel from "@/components/workbench/qualitative/CooccurrencePanel";
import MethodologyNotice from "@/components/workbench/MethodologyNotice";

const QUAL_TOOLS = [
  { id: "themes", label: "Themes", icon: Layers3 },
  { id: "excerpts", label: "Excerpts", icon: Quote },
  { id: "sentiment", label: "Sentiment", icon: HeartPulse },
  { id: "cooccurrence", label: "Co-occurrence", icon: Link2 },
];

export default function ThematicAnalysisPanel({ columns, rows, columnTypes }) {
  const textColumns = useMemo(
    () => columnTypes.filter((c) => c.type === "categorical").map((c) => c.name),
    [columnTypes]
  );
  const [column, setColumn] = useState(textColumns[0] ?? null);
  const [tool, setTool] = useState("themes");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const values = useMemo(
    () => (column ? rows.map((r) => r[column]) : []),
    [rows, column]
  );
  const stats = useMemo(() => (column ? textColumnStats(values) : null), [values, column]);
  const keywords = useMemo(() => (column ? keywordFrequencies(values, 20) : []), [values, column]);

  const runAI = async () => {
    setLoading(true);
    setError(null);
    setAiResult(null);
    try {
      const nonEmpty = values
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .map((v) => (v.length > 300 ? v.slice(0, 300) + "…" : v));
      const sample = nonEmpty.slice(0, 200);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a qualitative researcher performing thematic analysis on survey/open-text responses from the column "${column}".

Below are ${sample.length} responses (of ${nonEmpty.length} total). Identify 4-8 distinct themes using inductive coding. For each theme provide: a concise name, a 1-2 sentence description, 3-6 lowercase keywords/phrases that reliably signal the theme in a response, and 2 short representative quotes taken verbatim from the responses.

Also write a 2-3 sentence overall summary of the qualitative findings.

Responses:
${sample.map((v, i) => `${i + 1}. ${v}`).join("\n")}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            themes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } },
                  example_quotes: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });
      // Quantify each theme against the FULL dataset via keyword matching
      const themes = (result.themes || []).map((t) => ({
        ...t,
        mention_count: countMentions(values, t.keywords),
      })).sort((a, b) => b.mention_count - a.mention_count);
      setAiResult({ summary: result.summary, themes });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Theme analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!textColumns.length) {
    return (
      <div className="text-xs py-10 text-center" style={{ color: "var(--text-muted)" }}>
        No text columns found in this dataset — thematic analysis needs at least one non-numeric column.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Column picker + stats */}
      <div className="flex items-end gap-3 flex-wrap">
        <WorkbenchSelect
          label="Text column"
          value={column ?? ""}
          onChange={(v) => { setColumn(v); setAiResult(null); setError(null); }}
          options={textColumns}
        />
        {stats && (
          <span className="tag mb-1">
            {stats.responses.toLocaleString()} responses · {stats.unique.toLocaleString()} unique ·{" "}
            {stats.avgWords.toFixed(1)} avg words
          </span>
        )}
        <div className="flex-1" />
        {tool === "themes" && (
          <button
            onClick={runAI}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={{
              background: "rgba(64,196,255,0.12)",
              border: "1px solid rgba(64,196,255,0.35)",
              color: "#40c4ff",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? "Analyzing themes…" : "Identify Themes with AI"}
          </button>
        )}
      </div>

      {/* Qualitative tool switcher */}
      <div className="flex rounded-md overflow-hidden w-fit" style={{ border: "1px solid var(--border-default)", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
        {QUAL_TOOLS.map((t) => {
          const active = tool === t.id;
          const TIcon = t.icon;
          return (
            <button key={t.id} onClick={() => setTool(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: active ? "rgba(64,196,255,0.15)" : "var(--bg-overlay)",
                color: active ? "#40c4ff" : "var(--text-secondary)",
                borderRight: "1px solid var(--border-subtle)",
                boxShadow: active ? "inset 0 0 12px rgba(64,196,255,0.10)" : "none",
              }}>
              <TIcon size={11} style={{ opacity: active ? 1 : 0.6 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Methodology disclosure for the selected qualitative tool */}
      <MethodologyNotice toolKey={tool} />

      {error && tool === "themes" && (
        <div className="text-xs px-3 py-2 rounded-md"
          style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.3)", color: "#ff6b81" }}>
          {error}
        </div>
      )}

      {tool === "themes" && (
        <>
          {/* Qualitative — AI themes */}
          {aiResult && (
            <div>
              <div className="dashboard-section-label">Qualitative — AI-Identified Themes</div>
              <ThemeResults result={aiResult} />
            </div>
          )}
          {!aiResult && !loading && (
            <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg"
              style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-default)", color: "var(--text-muted)" }}>
              <MessageSquareText size={12} />
              Run the AI analysis to inductively code responses into themes with descriptions and representative quotes.
            </div>
          )}

          {/* Quantitative — keyword frequencies */}
          <div>
            <div className="dashboard-section-label">Quantitative — Keyword Frequency</div>
            <div className="depth-card p-3">
              <KeywordFrequencyChart keywords={keywords} />
            </div>
          </div>
        </>
      )}

      {tool === "excerpts" && <ExcerptExplorer values={values} />}
      {tool === "sentiment" && <SentimentPanel key={column} column={column} values={values} />}
      {tool === "cooccurrence" && <CooccurrencePanel values={values} />}
    </div>
  );
}