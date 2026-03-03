import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, Database, ChevronDown, ChevronRight, Plus, Loader, X, BarChart3, Info } from "lucide-react";

const FREQ_LABELS = { 1: "Annual", 2: "Semi-Annual", 4: "Quarterly", 6: "Bi-Monthly", 8: "3x/Year", 12: "Monthly", 24: "Semi-Monthly", 26: "Bi-Weekly", 52: "Weekly", 365: "Daily", 9999: "Occasional" };

export default function StatsCanWDSBrowser({ onImport, onClose }) {
  const [query, setQuery] = useState("");
  const [cubes, setCubes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [metaLoading, setMetaLoading] = useState(null);
  const [imported, setImported] = useState(new Set());

  const search = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setCubes([]);
    setExpanded(null);
    try {
      const res = await base44.functions.invoke("statsCanWDS", { action: "search", query: query.trim() });
      setCubes(res.data?.cubes || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (cube) => {
    if (expanded === cube.pid) { setExpanded(null); return; }
    setExpanded(cube.pid);
    if (metadata[cube.pid]) return;
    setMetaLoading(cube.pid);
    try {
      const res = await base44.functions.invoke("statsCanWDS", { action: "metadata", pid: cube.pid });
      setMetadata(prev => ({ ...prev, [cube.pid]: res.data?.metadata }));
    } finally {
      setMetaLoading(null);
    }
  };

  const handleImport = (cube) => {
    onImport({
      name: cube.title,
      type: "statcan",
      url: cube.url,
      description: `Statistics Canada WDS cube. PID: ${cube.pid}. Subject: ${cube.subject}. Frequency: ${FREQ_LABELS[cube.frequency] || cube.frequency}.`,
      category: "other",
      sync_frequency: "manual",
      status: "pending",
      metadata: { pid: cube.pid, subject: cube.subject, frequency: cube.frequency },
    });
    setImported(prev => new Set([...prev, cube.pid]));
  };

  const QUICK_SEARCHES = [
    "Indigenous", "First Nations", "health", "mental health", "mortality",
    "chronic disease", "population", "income",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", width: "min(800px, 96vw)", maxHeight: "88vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--accent-muted)" }}>
              <BarChart3 size={14} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Statistics Canada WDS</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Web Data Service · www150.statcan.gc.ca</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}><X size={14} /></button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <form onSubmit={search} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                autoFocus
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: "var(--text-primary)" }}
                placeholder="Search StatsCan cubes (e.g. 'Indigenous', 'health', 'mortality')..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              {loading ? <Loader size={12} className="animate-spin" /> : <Search size={12} />}
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_SEARCHES.map(q => (
              <button key={q} onClick={() => { setQuery(q); setTimeout(() => search(), 50); }}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Info size={10} />
            <span>Browsing all StatsCan cubes. Leave blank to see the first 30. Tip: include "health" or "Indigenous" for relevant tables.</span>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-xs">Searching Statistics Canada WDS...</span>
            </div>
          )}
          {!loading && cubes.length === 0 && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>
              {query
                ? "No cubes found. Try different keywords."
                : "Use the search bar or click a quick search to browse Statistics Canada data cubes."}
            </div>
          )}

          {cubes.map(cube => {
            const isExpanded = expanded === cube.pid;
            const isImported = imported.has(cube.pid);
            const meta = metadata[cube.pid];

            return (
              <div key={cube.pid} className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <button onClick={() => toggleExpand(cube)} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{cube.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                          <span>PID: {cube.pid}</span>
                          {cube.subject && <span>· {cube.subject}</span>}
                          {cube.frequency && <span>· {FREQ_LABELS[cube.frequency] || `Freq ${cube.frequency}`}</span>}
                          {cube.start_period && <span>· {cube.start_period?.slice(0, 4)} – {cube.end_period?.slice(0, 4)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a href={cube.url} target="_blank" rel="noopener noreferrer"
                          className="activity-icon" style={{ width: 24, height: 24 }} title="View on statcan.gc.ca">
                          <ExternalLink size={11} style={{ color: "var(--text-muted)" }} />
                        </a>
                        <button onClick={() => handleImport(cube)} disabled={isImported}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                          style={{
                            background: isImported ? "var(--bg-overlay)" : "var(--accent-primary)",
                            color: isImported ? "var(--text-muted)" : "#000",
                            border: isImported ? "1px solid var(--border-subtle)" : "none",
                          }}>
                          <Plus size={10} />
                          {isImported ? "Added" : "Add Source"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
                    {metaLoading === cube.pid ? (
                      <div className="flex items-center gap-2 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Loader size={12} className="animate-spin" /> Loading cube metadata...
                      </div>
                    ) : meta ? (
                      <div className="pt-3 space-y-3">
                        {meta.survey && (
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Survey: <span style={{ color: "var(--text-secondary)" }}>{meta.survey}</span></div>
                        )}
                        {meta.dimensions?.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Dimensions ({meta.dimensions.length})</div>
                            <div className="space-y-2">
                              {meta.dimensions.map(dim => (
                                <div key={dim.id}>
                                  <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>{dim.name}</div>
                                  <div className="flex flex-wrap gap-1">
                                    {dim.members.slice(0, 8).map(m => (
                                      <span key={m.id} className="tag" style={{ fontSize: 9 }}>{m.name}</span>
                                    ))}
                                    {dim.members.length > 8 && (
                                      <span className="tag" style={{ fontSize: 9, color: "var(--text-muted)" }}>+{dim.members.length - 8} more</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs rounded p-2" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}>
                          <span className="font-semibold" style={{ color: "var(--accent-primary)" }}>WDS Usage: </span>
                          Fetch data via vector IDs or coordinates. Example: <code style={{ color: "var(--text-secondary)" }}>vector_data</code> action with vector IDs from this cube.
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}

          {cubes.length > 0 && (
            <div className="text-center py-2 text-xs" style={{ color: "var(--text-muted)" }}>{cubes.length} cubes shown (max 30)</div>
          )}
        </div>
      </div>
    </div>
  );
}