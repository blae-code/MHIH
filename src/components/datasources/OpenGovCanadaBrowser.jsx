import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, Database, FileText, X, ChevronDown, ChevronRight, Plus, Loader } from "lucide-react";

export default function OpenGovCanadaBrowser({ onImport, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [detailLoading, setDetailLoading] = useState(null);
  const [imported, setImported] = useState(new Set());

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setExpanded(null);
    try {
      const res = await base44.functions.invoke("openGovCanada", { action: "search", query: query.trim(), limit: 20 });
      setResults(res.data?.datasets || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (ds) => {
    if (expanded === ds.id) { setExpanded(null); return; }
    setExpanded(ds.id);
    if (detail[ds.id]) return;
    setDetailLoading(ds.id);
    try {
      const res = await base44.functions.invoke("openGovCanada", { action: "show", id: ds.id });
      setDetail(prev => ({ ...prev, [ds.id]: res.data?.dataset }));
    } finally {
      setDetailLoading(null);
    }
  };

  const handleImport = (ds) => {
    onImport({
      name: ds.title || ds.name,
      type: "api",
      url: ds.url,
      description: ds.notes?.slice(0, 500) || "",
      category: "other",
      sync_frequency: "manual",
      status: "pending",
    });
    setImported(prev => new Set([...prev, ds.id]));
  };

  const QUICK_SEARCHES = ["Indigenous health", "First Nations", "mental health", "chronic disease", "mortality", "substance use"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", width: "min(760px, 96vw)", maxHeight: "85vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: "var(--accent-muted)" }}>
              <Database size={14} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Open Government Canada</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>open.canada.ca · CKAN API</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}><X size={14} /></button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <form onSubmit={search} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                autoFocus
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: "var(--text-primary)" }}
                placeholder="Search datasets (e.g. 'Indigenous health', 'First Nations mortality')..."
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
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-xs">Searching Open Government Canada...</span>
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>No datasets found. Try different keywords.</div>
          )}
          {!loading && results.length === 0 && !query && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>
              Search the federal Open Government catalogue to find and import health-related datasets.
            </div>
          )}

          {results.map(ds => {
            const isExpanded = expanded === ds.id;
            const isImported = imported.has(ds.id);
            const dsDetail = detail[ds.id];

            return (
              <div key={ds.id} className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <button onClick={() => toggleExpand(ds)} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{ds.title}</div>
                        <div className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                          {ds.organization} · {ds.num_resources} resource{ds.num_resources !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a href={ds.url} target="_blank" rel="noopener noreferrer"
                          className="activity-icon" style={{ width: 24, height: 24 }} title="Open on open.canada.ca">
                          <ExternalLink size={11} style={{ color: "var(--text-muted)" }} />
                        </a>
                        <button onClick={() => handleImport(ds)} disabled={isImported}
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
                    {ds.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {ds.tags.slice(0, 5).map(t => (
                          <span key={t} className="tag" style={{ fontSize: 9, padding: "1px 6px" }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
                    {detailLoading === ds.id ? (
                      <div className="flex items-center gap-2 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Loader size={12} className="animate-spin" /> Loading metadata...
                      </div>
                    ) : dsDetail ? (
                      <div className="pt-3 space-y-2">
                        {dsDetail.notes && (
                          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>{dsDetail.notes}</p>
                        )}
                        {dsDetail.license && (
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>License: <span style={{ color: "var(--text-secondary)" }}>{dsDetail.license}</span></div>
                        )}
                        {dsDetail.resources?.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Resources</div>
                            <div className="space-y-1">
                              {dsDetail.resources.map(r => (
                                <div key={r.id} className="flex items-center gap-2 text-xs">
                                  <FileText size={10} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                  <span className="truncate flex-1" style={{ color: "var(--text-secondary)" }}>{r.name || r.url}</span>
                                  <span className="tag shrink-0" style={{ fontSize: 9 }}>{r.format || "—"}</span>
                                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-info)", flexShrink: 0 }}>
                                    <ExternalLink size={10} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}

          {results.length > 0 && (
            <div className="text-center py-2 text-xs" style={{ color: "var(--text-muted)" }}>{results.length} datasets found</div>
          )}
        </div>
      </div>
    </div>
  );
}