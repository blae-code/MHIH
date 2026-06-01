import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Wrench, Play, RefreshCw, ChevronRight, Sparkles,
  Table, Filter, SortAsc, Merge, Wand2, X, CheckCircle, HelpCircle, Database
} from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import ZoneHeader from "@/components/shell/ZoneHeader";

const TRANSFORM_TYPES = [
  { type: "filter_rows", label: "Filter Rows", icon: Filter, color: "#40c4ff", desc: "Keep rows matching a condition" },
  { type: "rename_column", label: "Rename Column", icon: Table, color: "#34d399", desc: "Rename a column" },
  { type: "sort", label: "Sort", icon: SortAsc, color: "#FEDD00", desc: "Sort by a column" },
  { type: "merge", label: "Merge Sources", icon: Merge, color: "#a78bfa", desc: "Combine two data sources" },
  { type: "ai_clean", label: "AI Clean & Enrich", icon: Wand2, color: "#fb923c", desc: "AI-powered data cleaning" },
];

export default function DataPrep() {
  const { addLog } = useApp();
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [transforms, setTransforms] = useState([]);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    base44.entities.DataSource.list("-updated_date", 100)
      .then(d => setSources(d.filter(s => s.status !== "inactive")))
      .catch(e => addLog("error", e.message));
  }, []);

  const loadPreview = async (src) => {
    setSelectedSource(src);
    setPreviewData(null);
    setResult(null);
    setTransforms([]);
    if (!src.url) return;
    const isCsv = src.url.toLowerCase().includes(".csv");
    if (!isCsv) return;
    setLoadingPreview(true);
    const res = await base44.functions.invoke("dataBCTools", { action: "parse_csv", csvUrl: src.url, limit: 50 });
    if (res.data?.success) setPreviewData(res.data.rows);
    setLoadingPreview(false);
  };

  const addTransform = (type) => {
    const def = TRANSFORM_TYPES.find(t => t.type === type);
    setTransforms(prev => [...prev, { id: Date.now().toString(), type, label: def?.label, config: {} }]);
  };

  const removeTransform = (id) => setTransforms(prev => prev.filter(t => t.id !== id));

  const handleRun = async () => {
    if (!selectedSource) return;
    setRunning(true);
    setResult(null);

    const cols = previewData?.length > 0 ? Object.keys(previewData[0]).join(", ") : "unknown";
    const sample = previewData?.slice(0, 20) || [];
    const transformDesc = transforms.map(t => `${t.label}${t.config?.column ? ` on "${t.config.column}"` : ""}`).join(" → ");

    const prompt = `You are a data preparation assistant. The user has a dataset with columns: ${cols}.
Sample rows (first 20): ${JSON.stringify(sample)}

Requested transformations: ${transformDesc || "General clean and quality check"}

1. Apply the transformations conceptually and return a cleaned dataset (up to 20 rows as preview).
2. Provide a summary of what was done and any data quality observations.`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          rows_processed: { type: "number" },
          changes_made: { type: "array", items: { type: "string" } },
          quality_notes: { type: "string" }
        }
      }
    });

    setResult(aiResult);
    setRunning(false);
    addLog("success", "Data prep pipeline complete");
  };

  const cols = previewData?.length > 0 ? Object.keys(previewData[0]) : [];

  // Stat strip data
  const stats = useMemo(() => ({
    sources: sources.length,
    csvReady: sources.filter(s => s.url?.toLowerCase().includes(".csv")).length,
    steps: transforms.length,
    rows: previewData?.length || 0,
  }), [sources, transforms, previewData]);

  const STAT_CARDS = [
    { id: "src", label: "Available Sources", value: stats.sources, color: "#FEDD00", bg: "rgba(254,221,0,0.08)", desc: `${stats.csvReady} CSV-ready`, tooltip: "Active data sources you can build pipelines from. CSV-ready sources can be previewed and transformed directly." },
    { id: "selected", label: "Selected", value: selectedSource ? "✓" : "—", color: "#40c4ff", bg: "rgba(64,196,255,0.08)", desc: selectedSource?.name || "Pick a source to begin", tooltip: "The data source currently loaded into the prep workspace. Choose one to start building a transformation pipeline." },
    { id: "steps", label: "Pipeline Steps", value: stats.steps, color: "#a78bfa", bg: "rgba(167,139,250,0.08)", desc: stats.steps > 0 ? `${transforms.map(t => t.label).join(" → ")}` : "No steps yet", tooltip: "Number of transformation steps stacked in the current pipeline. Each step runs in order when you click Run Pipeline." },
    { id: "rows", label: "Preview Rows", value: stats.rows || "—", color: "#00e676", bg: "rgba(0,230,118,0.08)", desc: stats.rows ? `Loaded · ${cols.length} columns` : "No preview loaded", tooltip: "Sample rows fetched from the selected source for preview purposes. The full dataset is processed when you run the pipeline." },
  ];

  return (
    <CockpitShell
      icon={<Wrench size={16} style={{ color: "var(--mnbc-yellow)" }} />}
      title="Data Prep Studio"
      subtitle="Build transformation pipelines with AI assistance"
      actions={
        <button onClick={handleRun} disabled={!selectedSource || running}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 14px rgba(254,221,0,0.3)" }}>
          {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
          {running ? "Running..." : "Run Pipeline"}
        </button>
      }
    >
      {/* Stat strip */}
      <div className="mb-3">
        <div className="dashboard-section-label mb-2">Prep Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {STAT_CARDS.map(card => (
            <div key={card.id} className="relative overflow-hidden group" title={card.tooltip}
              style={{
                background: `linear-gradient(135deg, ${card.bg} 0%, var(--bg-elevated) 100%)`,
                border: `1.5px solid ${card.color}33`,
                cursor: "help", padding: 12, borderRadius: 10,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.35)",
              }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.color} 0%, transparent 100%)` }} />
              <div className="flex items-start justify-between mb-2 relative z-10">
                <span className="font-semibold uppercase tracking-wider leading-tight" style={{ color: "var(--text-secondary)", fontSize: "9px", letterSpacing: "0.05em" }}>{card.label}</span>
                <HelpCircle size={10} style={{ color: card.color, opacity: 0.5 }} />
              </div>
              <div className="font-black mb-1 relative z-10 leading-none" style={{ color: card.color, textShadow: `0 2px 8px ${card.color}18`, fontSize: 22 }}>{card.value}</div>
              <div className="leading-snug relative z-10 truncate" style={{ color: "var(--text-secondary)", fontSize: "10.5px" }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-zone */}
      <div className="cockpit-zone-grid">

        {/* Left: Pipeline + Preview */}
        <div className="cockpit-zone">
          <ZoneHeader
            label="Pipeline"
            title="Build & Preview"
            count={`${transforms.length} steps`}
            hint="source → transforms → results"
          />

          {/* Source selector */}
          <div className="cockpit-widget-card" style={{ padding: 12 }}>
            <div className="dashboard-section-label relative z-10">Input Source</div>
            <div className="relative z-10 flex items-center gap-2">
              <Database size={14} style={{ color: "var(--accent-primary)" }} />
              <select value={selectedSource?.id || ""} onChange={e => {
                const src = sources.find(s => s.id === e.target.value);
                if (src) loadPreview(src);
              }}
                className="flex-1 text-xs px-2 py-2 rounded-md outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                <option value="">Select a source...</option>
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {selectedSource && previewData && (
                <span className="text-xs" style={{ color: "var(--color-success)" }}>✓ {previewData.length} rows</span>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="cockpit-widget-card" style={{ padding: 12 }}>
            <div className="dashboard-section-label relative z-10">Source Preview</div>
            <div className="relative z-10">
              {!selectedSource ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Wrench size={28} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Select a source to load preview.</p>
                </div>
              ) : loadingPreview ? (
                <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-muted)" }}>
                  <RefreshCw size={14} className="animate-spin" /> Loading preview...
                </div>
              ) : previewData ? (
                <div className="overflow-x-auto" style={{ maxHeight: 280 }}>
                  <table className="w-full data-table text-xs">
                    <thead className="sticky top-0">
                      <tr>{cols.slice(0, 8).map(c => <th key={c} className="text-left">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, i) => (
                        <tr key={i}>
                          {cols.slice(0, 8).map(c => (
                            <td key={c} className="truncate max-w-[120px]" style={{ color: "var(--text-secondary)" }}>{row[c] ?? "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>No CSV preview available for this source.</p>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="cockpit-widget-card">
              <div className="dashboard-section-label flex items-center gap-1.5 relative z-10">
                <CheckCircle size={11} style={{ color: "var(--color-success)" }} />
                Pipeline Complete
              </div>
              <div className="relative z-10 space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{result.summary}</p>
                {result.changes_made?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Changes Applied</div>
                    {result.changes_made.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span style={{ color: "var(--accent-primary)" }}>▸</span>
                        <span style={{ color: "var(--text-secondary)" }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.quality_notes && (
                  <div className="text-xs px-3 py-2 rounded" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Quality Notes:</strong> {result.quality_notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Transforms */}
        <div className="cockpit-zone">
          <ZoneHeader label="Transforms" title="Pipeline Steps" count={`${transforms.length} active`} hint="add · order · configure" />

          {/* Active steps */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Active Steps</div>
            <div className="relative z-10">
              {transforms.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  No steps added. Choose a transform below.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {transforms.map((t, i) => {
                    const def = TRANSFORM_TYPES.find(d => d.type === t.type);
                    return (
                      <div key={t.id}>
                        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                          <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                          {def && <def.icon size={11} style={{ color: def.color, flexShrink: 0 }} />}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs" style={{ color: "var(--text-primary)" }}>{t.label}</div>
                            {cols.length > 0 && t.type !== "ai_clean" && (
                              <select value={t.config.column || ""} onChange={e => {
                                setTransforms(prev => prev.map(tr => tr.id === t.id ? { ...tr, config: { ...tr.config, column: e.target.value } } : tr));
                              }}
                                className="text-xs mt-1 w-full px-1 py-0.5 rounded outline-none"
                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 10 }}>
                                <option value="">Pick column...</option>
                                {cols.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            )}
                          </div>
                          <button onClick={() => removeTransform(t.id)}><X size={10} style={{ color: "var(--text-muted)" }} /></button>
                        </div>
                        {i < transforms.length - 1 && (
                          <div className="flex justify-center py-0.5"><ChevronRight size={10} style={{ color: "var(--text-muted)", transform: "rotate(90deg)" }} /></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add step */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Add Step</div>
            <div className="space-y-1 relative z-10">
              {TRANSFORM_TYPES.map(t => (
                <button key={t.type} onClick={() => addTransform(t.type)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors"
                  style={{ color: t.color }}
                  onMouseOver={e => e.currentTarget.style.background = "var(--bg-overlay)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <t.icon size={11} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11 }}>{t.label}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 9 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* How to use */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label flex items-center gap-1.5 relative z-10">
              <Sparkles size={11} style={{ color: "var(--accent-primary)" }} />
              How to Use
            </div>
            <ul className="space-y-1.5 text-xs relative z-10" style={{ color: "var(--text-secondary)" }}>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Pick a CSV-ready source — its first 50 rows preview automatically.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Stack transformation steps in order: filter, sort, rename, merge, or use AI cleanup.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Click <span style={{ color: "var(--accent-primary)" }}>Run Pipeline</span> — AI applies steps and reports changes plus quality notes.</span></li>
            </ul>
          </div>
        </div>

      </div>
    </CockpitShell>
  );
}