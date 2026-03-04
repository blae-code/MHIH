import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Wrench, Play, Plus, Trash2, RefreshCw, ChevronRight,
  Table, Filter, SortAsc, Merge, Wand2, Download, X, CheckCircle
} from "lucide-react";

const TRANSFORM_TYPES = [
  { type: "filter_rows", label: "Filter Rows", icon: Filter, color: "#58a6ff", desc: "Keep rows matching a condition" },
  { type: "rename_column", label: "Rename Column", icon: Table, color: "#34d399", desc: "Rename a column" },
  { type: "sort", label: "Sort", icon: SortAsc, color: "#e6a817", desc: "Sort by a column" },
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
  const [activeTransform, setActiveTransform] = useState(null);

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

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: source + transforms */}
      <aside className="flex flex-col shrink-0 border-r"
        style={{ width: 280, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <Wrench size={14} style={{ color: "var(--accent-primary)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Data Prep</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Build transformation pipelines with AI assistance.</p>
        </div>

        {/* Source selection */}
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>Input Source</div>
          <select value={selectedSource?.id || ""} onChange={e => {
            const src = sources.find(s => s.id === e.target.value);
            if (src) loadPreview(src);
          }}
            className="w-full text-xs px-2 py-2 rounded-md outline-none"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
            <option value="">Select a source...</option>
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Transform steps */}
        <div className="px-3 py-2 border-b flex-1 overflow-y-auto" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>
            Pipeline Steps ({transforms.length})
          </div>
          {transforms.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No steps added. Choose a transform below.</p>
          ) : (
            <div className="space-y-1.5 mb-3">
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

          <div className="text-xs font-semibold uppercase tracking-wider mb-1.5 mt-3" style={{ color: "var(--text-muted)", fontSize: 10 }}>Add Step</div>
          <div className="space-y-1">
            {TRANSFORM_TYPES.map(t => (
              <button key={t.type} onClick={() => addTransform(t.type)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left"
                style={{ color: t.color }}
                onMouseOver={e => e.currentTarget.style.background = "var(--bg-elevated)"}
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

        <div className="p-3">
          <button onClick={handleRun} disabled={!selectedSource || running}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold disabled:opacity-40"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? "Running..." : "Run Pipeline"}
          </button>
        </div>
      </aside>

      {/* Main: preview + results */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedSource ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
            <Wrench size={36} className="mb-3 opacity-20" />
            <p className="text-sm">Select a data source to begin building your pipeline.</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b shrink-0"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selectedSource.name}</span>
              {previewData && <span className="text-xs ml-2" style={{ color: "var(--color-success)" }}>✓ {previewData.length} rows loaded</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Preview table */}
              {loadingPreview ? (
                <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-muted)" }}>
                  <RefreshCw size={14} className="animate-spin" /> Loading preview...
                </div>
              ) : previewData ? (
                <div className="metric-card overflow-x-auto">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Source Preview (first {Math.min(previewData.length, 10)} rows)
                  </div>
                  <table className="w-full data-table text-xs">
                    <thead>
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
                <div className="metric-card text-center py-6">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>No CSV preview available for this source.</p>
                </div>
              )}

              {/* Pipeline result */}
              {result && (
                <div className="metric-card space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--color-success)" }}>Pipeline Complete</span>
                  </div>
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}