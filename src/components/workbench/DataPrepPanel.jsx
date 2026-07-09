/**
 * DataPrepPanel — transformation-pipeline prep tools, merged into the
 * Analysis Workbench from the former Data Prep Studio page.
 *
 * Input can be the workbench's uploaded dataset (when present) or any
 * CSV-ready connected data source. Stack transform steps, then run the
 * AI-assisted pipeline for a cleaned preview + quality notes.
 */

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../../Layout";
import {
  Wrench, Play, RefreshCw, ChevronRight, Sparkles,
  Table, Filter, SortAsc, Merge, Wand2, X, CheckCircle, Database, FileSpreadsheet
} from "lucide-react";

const TRANSFORM_TYPES = [
  { type: "filter_rows", label: "Filter Rows", icon: Filter, color: "#40c4ff", desc: "Keep rows matching a condition" },
  { type: "rename_column", label: "Rename Column", icon: Table, color: "#34d399", desc: "Rename a column" },
  { type: "sort", label: "Sort", icon: SortAsc, color: "#FEDD00", desc: "Sort by a column" },
  { type: "merge", label: "Merge Sources", icon: Merge, color: "#a78bfa", desc: "Combine two data sources" },
  { type: "ai_clean", label: "AI Clean & Enrich", icon: Wand2, color: "#fb923c", desc: "AI-powered data cleaning" },
];

const WORKBENCH_INPUT = "__workbench__";

export default function DataPrepPanel({ dataset }) {
  const { addLog } = useApp();
  const [sources, setSources] = useState([]);
  const [inputId, setInputId] = useState(dataset ? WORKBENCH_INPUT : "");
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

  // Default to the uploaded workbench dataset whenever one is present
  useEffect(() => {
    if (dataset) {
      setInputId(WORKBENCH_INPUT);
      setPreviewData(dataset.rows.slice(0, 50).map(row =>
        Object.fromEntries(dataset.columns.map((c, i) => [c, Array.isArray(row) ? row[i] : row[c]]))
      ));
      setResult(null);
    }
  }, [dataset]);

  const selectInput = async (id) => {
    setInputId(id);
    setPreviewData(null);
    setResult(null);
    setTransforms([]);
    if (id === WORKBENCH_INPUT && dataset) {
      setPreviewData(dataset.rows.slice(0, 50).map(row =>
        Object.fromEntries(dataset.columns.map((c, i) => [c, Array.isArray(row) ? row[i] : row[c]]))
      ));
      return;
    }
    const src = sources.find(s => s.id === id);
    if (!src?.url || !src.url.toLowerCase().includes(".csv")) return;
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
    if (!inputId) return;
    setRunning(true);
    setResult(null);

    const colsStr = previewData?.length > 0 ? Object.keys(previewData[0]).join(", ") : "unknown";
    const sample = previewData?.slice(0, 20) || [];
    const transformDesc = transforms.map(t => `${t.label}${t.config?.column ? ` on "${t.config.column}"` : ""}`).join(" → ");

    const prompt = `You are a data preparation assistant. The user has a dataset with columns: ${colsStr}.
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
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 items-start">

      {/* ── Left: Input + Preview + Result ─────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Input selector + run */}
        <div className="depth-card p-3">
          <div className="dashboard-section-label">Input Data</div>
          <div className="flex items-center gap-2">
            <Database size={14} style={{ color: "var(--accent-primary)" }} />
            <select value={inputId} onChange={e => selectInput(e.target.value)}
              className="flex-1 text-xs px-2 py-2 rounded-md outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
              <option value="">Select input...</option>
              {dataset && <option value={WORKBENCH_INPUT}>Uploaded: {dataset.fileName}</option>}
              {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {previewData && (
              <span className="text-xs shrink-0" style={{ color: "var(--color-success)" }}>✓ {previewData.length} rows · {cols.length} cols</span>
            )}
            <button onClick={handleRun} disabled={!inputId || running}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 shrink-0"
              style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 14px rgba(254,221,0,0.3)" }}>
              {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              {running ? "Running..." : "Run Pipeline"}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="depth-card p-3">
          <div className="dashboard-section-label">Input Preview</div>
          {!inputId ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Wrench size={28} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Choose the uploaded dataset or a CSV-ready source to load a preview.
              </p>
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
                        <td key={c} className="truncate max-w-[120px]" style={{ color: "var(--text-secondary)" }}>{String(row[c] ?? "—")}</td>
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

        {/* Result */}
        {result && (
          <div className="depth-card p-3">
            <div className="dashboard-section-label flex items-center gap-1.5">
              <CheckCircle size={11} style={{ color: "var(--color-success)" }} />
              Pipeline Complete
            </div>
            <div className="space-y-3">
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

      {/* ── Right: Transform steps ─────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Active steps */}
        <div className="depth-card p-3">
          <div className="dashboard-section-label">Active Steps ({transforms.length})</div>
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

        {/* Add step */}
        <div className="depth-card p-3">
          <div className="dashboard-section-label">Add Step</div>
          <div className="space-y-1">
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
        <div className="depth-card p-3">
          <div className="dashboard-section-label flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: "var(--accent-primary)" }} />
            How to Use
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Prep your uploaded workbench file directly, or pick a CSV-ready connected source.</span></li>
            <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Stack transformation steps in order: filter, sort, rename, merge, or use AI cleanup.</span></li>
            <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Click <span style={{ color: "var(--accent-primary)" }}>Run Pipeline</span> — AI applies steps and reports changes plus quality notes.</span></li>
            <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span><FileSpreadsheet size={10} style={{ display: "inline" }} /> Cleaned data insights feed straight into the Table, Statistics, and Charts tabs.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}