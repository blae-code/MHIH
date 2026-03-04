import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Map, Loader2, X, Download, ChevronDown, ChevronRight, ExternalLink, Search, Globe, Tag } from "lucide-react";

const PORTALS = [
  { key: "geobc", label: "Discover GeoBC", desc: "GeoBC — BC Government geospatial products & services" },
  { key: "opendata", label: "ArcGIS Open Data (BC)", desc: "Global ArcGIS Hub filtered to BC government data" },
];

const QUICK_SEARCHES = {
  geobc: ["health", "boundary", "Indigenous", "LiDAR", "orthophoto", "watershed", "cadastre", "roads"],
  opendata: ["BC health authority", "First Nations", "Indigenous BC", "population BC", "environmental BC", "hospital BC"],
};

const TYPE_COLORS = {
  "Feature Service": "#FEDD00",
  "WMS": "#4a78c4",
  "Map Service": "#306369",
  "Web Map": "#CD7236",
  "Feature Layer": "#FEDD00",
  "CSV": "#2ea043",
};

export default function ArcGISHubBCBrowser({ onClose, onImport }) {
  const [portal, setPortal] = useState("geobc");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [totalMatched, setTotalMatched] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [imported, setImported] = useState({});
  const [previewData, setPreviewData] = useState({});
  const [previewLoading, setPreviewLoading] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const search = async (q, pg = 0, por = portal) => {
    const searchQuery = q ?? query;
    setLoading(true);
    if (pg === 0) setResults([]);
    try {
      const res = await base44.functions.invoke("arcGISHubBC", {
        action: "search",
        portal: por,
        query: searchQuery,
        limit: PAGE_SIZE,
        startindex: pg * PAGE_SIZE,
      });
      const data = res.data;
      if (pg === 0) {
        setResults(data.items || []);
      } else {
        setResults(prev => [...prev, ...(data.items || [])]);
      }
      setTotalMatched(data.totalMatched || 0);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  };

  const previewService = async (item) => {
    if (!item.url || !item.url.includes("FeatureServer") && !item.url.includes("FeatureLayer")) return;
    setPreviewLoading(item.id);
    try {
      const res = await base44.functions.invoke("arcGISHubBC", {
        action: "get_feature_service",
        serviceUrl: item.url,
        resultRecordCount: 3,
      });
      if (res.data?.success) {
        setPreviewData(prev => ({ ...prev, [item.id]: res.data }));
      }
    } catch {}
    setPreviewLoading(null);
  };

  const handleImport = async (item) => {
    const sourceData = {
      name: item.title,
      type: "bc_health",
      url: item.url || `https://www.arcgis.com/home/item.html?id=${item.id}`,
      description: item.snippet || item.description?.slice(0, 300) || "",
      category: "other",
      status: "active",
      sync_frequency: "manual",
      metadata: {
        arcgis_id: item.id,
        arcgis_type: item.type,
        portal,
        owner: item.owner,
        source: item.source,
        tags: item.tags,
        license: item.licenseInfo,
      },
    };
    await onImport(sourceData);
    setImported(prev => ({ ...prev, [item.id]: true }));
  };

  const switchPortal = (key) => {
    setPortal(key);
    setResults([]);
    setQuery("");
    setTotalMatched(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex flex-col w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2">
            <Globe size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>ArcGIS Hub BC Browser</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Discover GeoBC · ArcGIS Open Data (BC)</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Portal tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {PORTALS.map(p => (
            <button key={p.key} onClick={() => switchPortal(p.key)}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                color: portal === p.key ? "var(--accent-primary)" : "var(--text-muted)",
                borderBottom: portal === p.key ? "2px solid var(--accent-primary)" : "2px solid transparent",
                background: "transparent",
              }}>
              {p.label}
            </button>
          ))}
          <div className="flex-1 flex items-center justify-end px-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {PORTALS.find(p => p.key === portal)?.desc}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 px-3 py-1.5 rounded-md text-xs outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              placeholder={`Search ${PORTALS.find(p => p.key === portal)?.label}...`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search(query, 0)}
            />
            <button onClick={() => search(query, 0)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(QUICK_SEARCHES[portal] || []).map(q => (
              <button key={q} onClick={() => { setQuery(q); search(q, 0); }}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Searching {PORTALS.find(p => p.key === portal)?.label}...</span>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <Globe size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Search the portal above to discover BC geospatial datasets.</p>
              <p className="text-xs mt-1">Try a quick search or type a topic like "health authority" or "Indigenous".</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="text-xs mb-2 px-1" style={{ color: "var(--text-muted)" }}>
              Showing {results.length} of {totalMatched.toLocaleString()} results
            </div>
          )}

          <div className="space-y-1.5">
            {results.map(item => (
              <div key={item.id} className="rounded-md overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex items-start justify-between px-3 py-2.5 cursor-pointer"
                  style={{ background: expanded === item.id ? "var(--bg-overlay)" : "transparent" }}
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    {expanded === item.id
                      ? <ChevronDown size={14} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />
                      : <ChevronRight size={14} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</span>
                        {item.type && (
                          <span className="px-1.5 py-0.5 rounded text-xs shrink-0"
                            style={{ background: "var(--bg-overlay)", color: TYPE_COLORS[item.type] || "var(--text-muted)", border: "1px solid var(--border-subtle)", fontSize: 10 }}>
                            {item.type}
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {item.owner} {item.modified ? `· Updated ${new Date(item.modified).toLocaleDateString("en-CA")}` : ""}
                      </div>
                      {item.snippet && (
                        <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{item.snippet}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                    {item.url && (
                      <a href={item.url.startsWith("http") ? item.url : `https://www.arcgis.com/home/item.html?id=${item.id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="activity-icon" style={{ width: 24, height: 24 }}>
                        <ExternalLink size={11} />
                      </a>
                    )}
                    <button onClick={() => handleImport(item)}
                      disabled={imported[item.id]}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{ background: imported[item.id] ? "var(--color-success)" : "var(--accent-primary)", color: "#000", opacity: imported[item.id] ? 0.7 : 1 }}>
                      <Download size={10} />
                      {imported[item.id] ? "Imported" : "Import"}
                    </button>
                  </div>
                </div>

                {expanded === item.id && (
                  <div className="px-3 pb-3 pt-1 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
                    {item.description && (
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
                    )}
                    {item.licenseInfo && (
                      <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>{item.licenseInfo}</p>
                    )}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 8).map(t => (
                          <span key={t} className="tag flex items-center gap-1" style={{ fontSize: 10 }}>
                            <Tag size={9} />{t}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.url && (item.url.includes("FeatureServer") || item.url.includes("FeatureLayer")) && (
                      <div>
                        <button onClick={() => previewService(item)} disabled={previewLoading === item.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                          {previewLoading === item.id ? <Loader2 size={10} className="animate-spin" /> : <Map size={10} />}
                          Preview sample records
                        </button>
                        {previewData[item.id] && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                              Sample features ({previewData[item.id].featureCount})
                            </div>
                            {previewData[item.id].features?.map((f, i) => (
                              <div key={i} className="text-xs p-1 mb-1 rounded" style={{ background: "var(--bg-overlay)", fontFamily: "monospace", fontSize: 10 }}>
                                {Object.entries(f.properties || {}).slice(0, 6).map(([k, v]) => (
                                  <span key={k} className="mr-2">{k}: <span style={{ color: "var(--accent-primary)" }}>{String(v ?? "—").slice(0, 30)}</span></span>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {results.length > 0 && results.length < totalMatched && (
            <div className="text-center py-3">
              <button onClick={() => search(query, page + 1)} disabled={loading}
                className="px-4 py-1.5 rounded-md text-xs"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                {loading ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                Load more ({totalMatched - results.length} remaining)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t shrink-0 text-xs"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-muted)" }}>
          discover-geobc-bcgov03.hub.arcgis.com · opendata.arcgis.com — ArcGIS Hub OGC API
        </div>
      </div>
    </div>
  );
}