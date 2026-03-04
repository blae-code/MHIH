import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ExternalLink, Database, FileText, X, ChevronDown, ChevronRight, Plus, Loader, Eye, ArrowUpDown } from "lucide-react";
import SmartSearchBar from "./SmartSearchBar";
import DataSourcePreview from "./DataSourcePreview";
import AIRecommendations from "./AIRecommendations";

const QUICK_SEARCHES = ["Indigenous health", "First Nations", "mental health", "chronic disease", "mortality", "substance use", "Métis", "social determinants"];
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
  { value: "resources_desc", label: "Most Resources" },
];

export default function OpenGovCanadaBrowser({ onImport, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [detailLoading, setDetailLoading] = useState(null);
  const [imported, setImported] = useState(new Set());
  const [previewItem, setPreviewItem] = useState(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [recentSearches, setRecentSearches] = useState([]);

  const doSearch = async (q) => {
    const sq = (q ?? query).trim();
    if (!sq) return;
    setLoading(true);
    setResults([]);
    setExpanded(null);
    setRecentSearches(prev => [sq, ...prev.filter(s => s !== sq)].slice(0, 5));
    try {
      const res = await base44.functions.invoke("openGovCanada", { action: "search", query: sq, limit: 30 });
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

  const getPreviewItem = (ds) => {
    const dsDetail = detail[ds.id];
    const csvResource = dsDetail?.resources?.find(r => r.format?.toLowerCase() === "csv");
    return {
      title: ds.title,
      organization: ds.organization,
      description: dsDetail?.notes || ds.notes,
      tags: ds.tags,
      url: csvResource?.url || ds.url,
      format: csvResource?.format,
      license: dsDetail?.license,
      resources: dsDetail?.resources,
    };
  };

  const subjects = ["All", ...Array.from(new Set(results.flatMap(ds => ds.subject || []))).slice(0, 8)];

  const filtered = results
    .filter(ds => subjectFilter === "All" || (ds.subject || []).includes(subjectFilter))
    .sort((a, b) => {
      if (sortBy === "title_asc") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "title_desc") return (b.title || "").localeCompare(a.title || "");
      if (sortBy === "resources_desc") return (b.num_resources || 0) - (a.num_resources || 0);
      return 0;
    });

  const filterBar = (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <ArrowUpDown size={11} style={{ color: "var(--text-muted)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sort:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="text-xs outline-none px-1.5 py-0.5 rounded"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {subjects.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Subject:</span>
          {subjects.map(s => (
            <button key={s} onClick={() => setSubjectFilter(s)}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: subjectFilter === s ? "var(--accent-muted)" : "var(--bg-overlay)",
                color: subjectFilter === s ? "var(--accent-primary)" : "var(--text-muted)",
                border: `1px solid ${subjectFilter === s ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", width: "min(800px, 96vw)", maxHeight: "85vh" }}>

        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--accent-muted)" }}>
              <Database size={14} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Open Government Canada</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>open.canada.ca · AI-powered search</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}><X size={14} /></button>
        </div>

        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <SmartSearchBar
            value={query}
            onChange={setQuery}
            onSearch={doSearch}
            placeholder="Search federal datasets (e.g. 'Indigenous health', 'First Nations mortality')..."
            quickSearches={QUICK_SEARCHES}
            aiContext="Open Government Canada CKAN catalogue — federal health, demographics, Indigenous datasets"
            filterSlot={results.length > 0 ? filterBar : null}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {/* AI Recommendations */}
          {(results.length > 0 || imported.size > 0 || recentSearches.length > 0) && (
            <AIRecommendations
              context={{
                currentQuery: query,
                recentSearches,
                importedNames: Array.from(imported),
                activeFilters: [subjectFilter !== "All" ? `subject:${subjectFilter}` : "", sortBy !== "relevance" ? `sort:${sortBy}` : ""].filter(Boolean),
                sourceName: "Open Government Canada",
              }}
              onSearchSuggestion={q => { setQuery(q); doSearch(q); }}
            />
          )}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-xs">Searching Open Government Canada...</span>
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>No datasets found. Try different keywords or use AI suggestions.</div>
          )}
          {!loading && results.length === 0 && !query && (
            <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>
              Search the federal Open Government catalogue — AI autocomplete suggests as you type.
            </div>
          )}

          {filtered.map(ds => {
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
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {ds.organization} · {ds.num_resources} resource{ds.num_resources !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => { toggleExpand(ds); setPreviewItem(getPreviewItem(ds)); }}
                          className="activity-icon" style={{ width: 24, height: 24 }} title="Preview">
                          <Eye size={11} style={{ color: "var(--text-muted)" }} />
                        </button>
                        <a href={ds.url} target="_blank" rel="noopener noreferrer"
                          className="activity-icon" style={{ width: 24, height: 24 }}>
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
                        {ds.tags.slice(0, 6).map(t => (
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
                        <button onClick={() => setPreviewItem(getPreviewItem(ds))}
                          className="flex items-center gap-1 text-xs mt-2"
                          style={{ color: "var(--accent-primary)" }}>
                          <Eye size={11} /> Open full preview with AI analysis
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length > 0 && (
            <div className="text-center py-2 text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} of {results.length} datasets
            </div>
          )}
        </div>
      </div>

      {previewItem && (
        <DataSourcePreview
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onImport={() => handleImport({ title: previewItem.title, url: previewItem.url, organization: previewItem.organization, notes: previewItem.description, tags: previewItem.tags, id: previewItem.title })}
        />
      )}
    </div>
  );
}