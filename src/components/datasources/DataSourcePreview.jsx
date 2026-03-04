import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Eye, Sparkles, Download, ExternalLink, Table2, FileText } from "lucide-react";

/**
 * DataSourcePreview — modal that shows a sample data preview + AI summary
 * for a data source before importing.
 *
 * Props:
 *   item       — { title, url, description, tags, organization, format }
 *   onClose    — close callback
 *   onImport   — import callback (optional, if not provided hides import button)
 */
export default function DataSourcePreview({ item, onClose, onImport }) {
  const [preview, setPreview] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadPreview = async () => {
    if (!item.url) return;
    setLoading(true);
    setError(null);
    try {
      // Try CSV preview first (DataBC CSV parser), fallback to fetch
      const isCsv = item.url.toLowerCase().includes(".csv") || item.format?.toLowerCase() === "csv";
      if (isCsv) {
        const res = await base44.functions.invoke("dataBCTools", {
          action: "parse_csv",
          csvUrl: item.url,
          limit: 20,
        });
        if (res.data?.success) {
          setPreview({ type: "table", rows: res.data.rows, columns: res.data.columns, total: res.data.total });
        } else {
          setPreview({ type: "unavailable" });
        }
      } else {
        setPreview({ type: "unavailable" });
      }
    } catch (e) {
      setError("Could not load preview: " + e.message);
    }
    setLoading(false);
  };

  const loadAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a health data analyst for the BC Métis Nation. Analyze this dataset and provide a brief, useful summary for a health data analyst.

Dataset title: ${item.title || "Unknown"}
Organization: ${item.organization || "Unknown"}
Description: ${item.description || "No description"}
Tags: ${(item.tags || []).join(", ") || "None"}
Format: ${item.format || "Unknown"}
URL: ${item.url || "Unknown"}

Provide:
1. A 2-sentence plain-language summary of what this dataset contains
2. How it might be relevant to BC Métis health research (1-2 sentences)
3. Data quality considerations (1 sentence)
4. Suggested health categories it fits: pick from [chronic_disease, mental_health, substance_use, maternal_child, social_determinants, demographics, mortality, access_to_care, other]

Be concise and practical.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            metis_relevance: { type: "string" },
            quality_note: { type: "string" },
            suggested_categories: { type: "array", items: { type: "string" } },
          }
        }
      });
      setAiSummary(res);
    } catch (e) {
      setAiSummary({ error: e.message });
    }
    setAiLoading(false);
  };

  // Auto-load AI summary on mount
  React.useEffect(() => {
    loadAISummary();
    if (item.url?.toLowerCase().includes(".csv")) loadPreview();
  }, []);

  const tabs = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "preview", label: "Data Preview", icon: Table2 },
    { key: "ai", label: "AI Analysis", icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="flex flex-col w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "88vh" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <Eye size={15} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {item.organization && <span>{item.organization} · </span>}
                {item.format && <span className="tag" style={{ fontSize: 9, padding: "1px 6px" }}>{item.format}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="activity-icon" style={{ width: 26, height: 26 }} title="Open source URL">
                <ExternalLink size={12} />
              </a>
            )}
            {onImport && (
              <button onClick={() => { onImport(); onClose(); }}
                className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium"
                style={{ background: "var(--accent-primary)", color: "#000" }}>
                <Download size={11} /> Import
              </button>
            )}
            <button onClick={onClose} className="activity-icon" style={{ width: 26, height: 26 }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); if (t.key === "preview" && !preview) loadPreview(); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors"
              style={{
                color: activeTab === t.key ? "var(--accent-primary)" : "var(--text-muted)",
                borderBottom: activeTab === t.key ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {item.description && (
                <div>
                  <div className="section-label mb-1">Description</div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
                </div>
              )}
              {item.tags?.length > 0 && (
                <div>
                  <div className="section-label mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(t => <span key={t} className="tag" style={{ fontSize: 10 }}>{t}</span>)}
                  </div>
                </div>
              )}
              {item.url && (
                <div>
                  <div className="section-label mb-1">Source URL</div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs break-all" style={{ color: "var(--color-info)" }}>
                    {item.url}
                  </a>
                </div>
              )}
              {item.license && (
                <div>
                  <div className="section-label mb-1">License</div>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.license}</span>
                </div>
              )}
              {/* Resources list */}
              {item.resources?.length > 0 && (
                <div>
                  <div className="section-label mb-2">Resources ({item.resources.length})</div>
                  <div className="space-y-1">
                    {item.resources.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded"
                        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                        <FileText size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{r.name || r.url}</span>
                        {r.format && <span className="tag shrink-0" style={{ fontSize: 9 }}>{r.format}</span>}
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="shrink-0" style={{ color: "var(--color-info)" }}>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Preview tab */}
          {activeTab === "preview" && (
            <div>
              {loading && (
                <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs">Loading sample data...</span>
                </div>
              )}
              {error && <p className="text-xs py-4" style={{ color: "var(--color-error)" }}>{error}</p>}
              {!loading && !error && preview?.type === "table" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Showing {preview.rows.length} of {preview.total?.toLocaleString()} rows · {preview.columns.length} columns
                    </span>
                  </div>
                  <div className="overflow-auto rounded" style={{ border: "1px solid var(--border-subtle)", maxHeight: 320 }}>
                    <table className="data-table w-full text-xs" style={{ minWidth: preview.columns.length * 100 }}>
                      <thead>
                        <tr>
                          {preview.columns.map(c => <th key={c} className="whitespace-nowrap">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i}>
                            {preview.columns.map(c => (
                              <td key={c} style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {String(row[c] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {!loading && !error && preview?.type === "unavailable" && (
                <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                  <Table2 size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs">Live preview is available for CSV resources only.</p>
                  <p className="text-xs mt-1">Open the source URL to inspect the data directly.</p>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-3 text-xs px-3 py-1.5 rounded-md"
                      style={{ background: "var(--bg-overlay)", color: "var(--color-info)", border: "1px solid var(--border-subtle)" }}>
                      Open data source →
                    </a>
                  )}
                </div>
              )}
              {!loading && !error && !preview && (
                <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                  <p className="text-xs">Click the "Data Preview" tab again to load a sample.</p>
                </div>
              )}
            </div>
          )}

          {/* AI Analysis tab */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              {aiLoading && (
                <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Generating AI analysis...</span>
                </div>
              )}
              {!aiLoading && aiSummary?.error && (
                <p className="text-xs" style={{ color: "var(--color-error)" }}>AI analysis failed: {aiSummary.error}</p>
              )}
              {!aiLoading && aiSummary && !aiSummary.error && (
                <>
                  <div className="rounded-lg p-3" style={{ background: "var(--accent-muted)", border: "1px solid var(--border-default)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles size={12} style={{ color: "var(--accent-primary)" }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>AI Summary</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{aiSummary.summary}</p>
                  </div>
                  {aiSummary.metis_relevance && (
                    <div>
                      <div className="section-label mb-1">Métis Research Relevance</div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{aiSummary.metis_relevance}</p>
                    </div>
                  )}
                  {aiSummary.quality_note && (
                    <div>
                      <div className="section-label mb-1">Data Quality Note</div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{aiSummary.quality_note}</p>
                    </div>
                  )}
                  {aiSummary.suggested_categories?.length > 0 && (
                    <div>
                      <div className="section-label mb-1">Suggested Categories</div>
                      <div className="flex flex-wrap gap-1">
                        {aiSummary.suggested_categories.map(c => (
                          <span key={c} className="tag" style={{ fontSize: 10, color: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}>
                            {c.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}