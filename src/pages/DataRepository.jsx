import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Upload, Plus, Download, Trash2, Edit2, RefreshCw, Table2, BarChart2, Database, Sparkles } from "lucide-react";
import ImportMetricModal from "@/components/data/ImportMetricModal";
import MetricForm from "@/components/data/MetricForm";
import MetricsChartExplorer from "@/components/analyst/MetricsChartExplorer";
import RepositoryStatStrip from "@/components/data/RepositoryStatStrip";
import ZoneHeader from "@/components/shell/ZoneHeader";
import ListFilterBar from "@/components/shell/ListFilterBar";
import { invalidateHealthMetricCache, listAllHealthMetrics } from "@/lib/healthMetrics";

const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];
const CONFIDENCE_LEVELS = ["high","medium","low"];

const CONFIDENCE_STYLE = {
  high: { color: "var(--color-success)", bg: "rgba(0,230,118,0.08)", border: "rgba(0,230,118,0.3)" },
  medium: { color: "var(--color-warning)", bg: "rgba(255,171,64,0.08)", border: "rgba(255,171,64,0.3)" },
  low: { color: "var(--color-error)", bg: "rgba(255,23,68,0.08)", border: "rgba(255,23,68,0.3)" },
};

export default function DataRepository() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [viewMode, setViewMode] = useState("table");

  const load = (forceRefresh = false) => {
    setLoading(true);
    listAllHealthMetrics({ forceRefresh })
      .then(data => { setMetrics(data); addLog("success", `Loaded ${data.length} metrics`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = metrics.filter(m => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || m.category === catFilter;
    const matchRegion = regionFilter === "all" || m.region === regionFilter;
    const matchConfidence = confidenceFilter === "all" || m.confidence_level === confidenceFilter;
    return matchSearch && matchCat && matchRegion && matchConfidence;
  });

  // Top categories (for Insights zone)
  const topCategories = useMemo(() => {
    const counts = {};
    metrics.forEach(m => {
      if (m.category) counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [metrics]);

  // Recently added metrics
  const recentMetrics = useMemo(() => {
    return [...metrics]
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .slice(0, 4);
  }, [metrics]);

  const handleDelete = async (id) => {
    await base44.entities.HealthMetric.delete(id);
    invalidateHealthMetricCache();
    addLog("success", "Metric deleted");
    load(true);
  };

  const handleBulkDelete = async () => {
    await Promise.all([...selected].map(id => base44.entities.HealthMetric.delete(id)));
    setSelected(new Set());
    invalidateHealthMetricCache();
    addLog("success", `Deleted ${selected.size} metrics`);
    load(true);
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.HealthMetric.update(editing.id, data);
      addLog("success", `Updated metric: ${data.name}`);
    } else {
      await base44.entities.HealthMetric.create(data);
      addLog("success", `Created metric: ${data.name}`);
    }
    invalidateHealthMetricCache();
    setShowForm(false);
    setEditing(null);
    load(true);
  };

  const handleExportCSV = () => {
    const rows = [["Name","Category","Region","Year","Value","Unit","Notes"]];
    filtered.forEach(m => rows.push([m.name, m.category, m.region, m.year, m.value, m.unit, m.notes || ""]));
    const csv = rows.map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "metis_health_metrics.csv"; a.click();
    addLog("success", "CSV exported");
  };

  const hasActiveFilters = search || catFilter !== "all" || regionFilter !== "all" || confidenceFilter !== "all";
  const clearFilters = () => { setSearch(""); setCatFilter("all"); setRegionFilter("all"); setConfidenceFilter("all"); };

  return (
    <div className="min-h-full relative" style={{ background: "var(--bg-surface)" }}>
      {/* Ambient page glow */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(254,221,0,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "radial-gradient(ellipse 50% 100% at 50% 100%, rgba(64,196,255,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        .repo-widget-card {
          border-radius: 10px;
          border: 1.5px solid;
          border-image: linear-gradient(135deg, rgba(254,221,0,0.4) 0%, rgba(64,196,255,0.3) 50%, rgba(254,221,0,0.2) 100%) 1;
          background: #0a1220;
          padding: 14px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.08), 0 0 20px rgba(254,221,0,0.05);
        }
        .repo-widget-card:hover {
          border-image: linear-gradient(135deg, rgba(254,221,0,0.6) 0%, rgba(64,196,255,0.5) 50%, rgba(254,221,0,0.4) 100%) 1;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.15), 0 0 32px rgba(254,221,0,0.15), 0 8px 24px rgba(0,0,0,0.4);
        }
        .repo-widget-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(254,221,0,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
      `}</style>

      <div className="flex flex-col p-3 relative" style={{ zIndex: 1 }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="rounded-xl px-5 py-3 mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-surface) 0%, #091828 50%, var(--bg-elevated) 100%)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(254,221,0,0.1)"
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 60%, transparent 100%)" }} />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.05) 100%)", border: "1px solid rgba(254,221,0,0.25)", boxShadow: "0 0 16px rgba(254,221,0,0.1)" }}>
                <Database size={16} style={{ color: "var(--mnbc-yellow)" }} />
              </div>
              <div>
                <div className="dashboard-section-label" style={{ marginBottom: 0 }}>Health Metrics Repository</div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Browse, import, and manage Métis health indicator data</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* View toggle */}
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-default)", background: "var(--bg-overlay)" }}>
                <button onClick={() => setViewMode("table")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
                  style={{ background: viewMode === "table" ? "rgba(254,221,0,0.12)" : "transparent", color: viewMode === "table" ? "var(--accent-primary)" : "var(--text-muted)" }}>
                  <Table2 size={12} /> Table
                </button>
                <button onClick={() => setViewMode("chart")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-l transition-all"
                  style={{ background: viewMode === "chart" ? "rgba(254,221,0,0.12)" : "transparent", color: viewMode === "chart" ? "var(--accent-primary)" : "var(--text-muted)", borderColor: "var(--border-subtle)" }}>
                  <BarChart2 size={12} /> Charts
                </button>
              </div>
              <button onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                <Download size={12} /> Export
              </button>
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                <Upload size={12} /> Import
              </button>
              <button onClick={() => { setEditing(null); setShowForm(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 14px rgba(254,221,0,0.3)" }}>
                <Plus size={12} /> Add Metric
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat strip ─────────────────────────────────────────────── */}
        <div className="mb-3">
          <RepositoryStatStrip metrics={metrics} filteredCount={filtered.length} />
        </div>

        {/* ── 2-zone cockpit ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 items-start">

          {/* ── Left zone: Data ───────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <ZoneHeader
              label="Records"
              title={viewMode === "chart" ? "Chart Explorer" : "Metrics Table"}
              count={`${filtered.length} / ${metrics.length}`}
              hint={viewMode === "chart" ? "interactive visualization" : "browse · edit · delete"}
            />

            {/* Filters */}
            <ListFilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search metrics..."
              region={regionFilter}
              onRegionChange={setRegionFilter}
              regionOptions={REGIONS}
              category={catFilter}
              onCategoryChange={setCatFilter}
              categoryOptions={CATEGORIES}
              status={confidenceFilter}
              onStatusChange={setConfidenceFilter}
              statusOptions={CONFIDENCE_LEVELS}
              onClear={clearFilters}
              extra={selected.size > 0 && (
                <button onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "rgba(255,23,68,0.12)", color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.3)" }}>
                  <Trash2 size={12} /> Delete {selected.size}
                </button>
              )}
            />

            {/* Data surface — table or chart */}
            <div className="repo-widget-card" style={{ padding: 0, overflow: "hidden" }}>
              {viewMode === "chart" && !loading && (
                <div className="relative z-10" style={{ minHeight: 520 }}>
                  <MetricsChartExplorer metrics={filtered} />
                </div>
              )}

              {viewMode === "table" && (
                <div className="relative z-10 overflow-auto" style={{ maxHeight: 620 }}>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3" style={{ color: "var(--text-muted)" }}>
                      <RefreshCw size={20} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
                      <span className="text-sm">Loading metrics...</span>
                    </div>
                  ) : (
                    <table className="w-full data-table">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="w-10 text-center">
                            <input type="checkbox"
                              onChange={e => setSelected(e.target.checked ? new Set(filtered.map(m => m.id)) : new Set())}
                              checked={selected.size === filtered.length && filtered.length > 0}
                              style={{ accentColor: "var(--accent-primary)" }} />
                          </th>
                          <th className="text-left" style={{ minWidth: 180 }}>Name</th>
                          <th className="text-left">Category</th>
                          <th className="text-left">Region</th>
                          <th className="text-right">Year</th>
                          <th className="text-right">Value</th>
                          <th className="text-left">Unit</th>
                          <th className="text-left">Source</th>
                          <th className="text-center">Confidence</th>
                          <th className="w-16 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={10}>
                              <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Database size={32} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No metrics found matching your filters.</p>
                                {hasActiveFilters && (
                                  <button onClick={clearFilters} className="text-xs px-3 py-1.5 rounded-lg"
                                    style={{ background: "rgba(254,221,0,0.08)", color: "var(--accent-primary)", border: "1px solid rgba(254,221,0,0.2)" }}>
                                    Clear filters
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : filtered.map(m => {
                          const conf = CONFIDENCE_STYLE[m.confidence_level] || CONFIDENCE_STYLE.medium;
                          return (
                            <tr key={m.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                              <td className="text-center">
                                <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)}
                                  style={{ accentColor: "var(--accent-primary)" }} />
                              </td>
                              <td>
                                <span className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                              </td>
                              <td>
                                <span className="tag" style={{ fontSize: 10 }}>{m.category?.replace(/_/g," ")}</span>
                              </td>
                              <td>
                                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.region || "—"}</span>
                              </td>
                              <td className="text-right">
                                <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{m.year || "—"}</span>
                              </td>
                              <td className="text-right">
                                <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
                                  {m.value != null ? Number(m.value).toLocaleString() : "—"}
                                </span>
                              </td>
                              <td>
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.unit || "—"}</span>
                              </td>
                              <td>
                                <span className="text-xs truncate max-w-32 block" style={{ color: "var(--text-muted)" }} title={m.data_source_name}>
                                  {m.data_source_name || "—"}
                                </span>
                              </td>
                              <td className="text-center">
                                {m.confidence_level ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                                    style={{ color: conf.color, background: conf.bg, border: `1px solid ${conf.border}` }}>
                                    {m.confidence_level}
                                  </span>
                                ) : (
                                  <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                                )}
                              </td>
                              <td>
                                <div className="flex items-center gap-1 justify-center">
                                  <button onClick={() => { setEditing(m); setShowForm(true); }}
                                    className="activity-icon" style={{ width: 26, height: 26 }} title="Edit">
                                    <Edit2 size={11} />
                                  </button>
                                  <button onClick={() => handleDelete(m.id)}
                                    className="activity-icon" style={{ width: 26, height: 26, color: "var(--color-error)" }} title="Delete">
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right zone: Insights ──────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <ZoneHeader
              label="Insights"
              title="Repository Intelligence"
              count={`${topCategories.length} categories`}
              hint="distribution + tips"
            />

            {/* Top categories */}
            <div className="repo-widget-card">
              <div className="dashboard-section-label relative z-10">Top Categories</div>
              <div className="space-y-2 relative z-10">
                {topCategories.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
                    No categorized metrics yet.
                  </p>
                ) : (
                  topCategories.map(([cat, count]) => {
                    const pct = metrics.length ? (count / metrics.length) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="capitalize" style={{ color: "var(--text-secondary)" }}>{cat.replace(/_/g, " ")}</span>
                          <span className="font-mono" style={{ color: "var(--accent-primary)" }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: "var(--bg-overlay)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #FEDD00 0%, #ffed4e 100%)", borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent additions */}
            <div className="repo-widget-card">
              <div className="dashboard-section-label relative z-10">Recently Added</div>
              <div className="space-y-2 relative z-10">
                {recentMetrics.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
                    No records yet.
                  </p>
                ) : (
                  recentMetrics.map(m => (
                    <div key={m.id} className="p-2.5 rounded-md" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate" style={{ color: "var(--accent-primary)" }}>{m.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                            {m.category?.replace(/_/g, " ") || "—"} · {m.region || "—"} · {m.year || "—"}
                          </div>
                        </div>
                        <span className="text-xs shrink-0 font-mono" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                          {m.value != null ? Number(m.value).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* How to use */}
            <div className="repo-widget-card">
              <div className="dashboard-section-label flex items-center gap-1.5 relative z-10">
                <Sparkles size={11} style={{ color: "var(--accent-primary)" }} />
                How to Use
              </div>
              <ul className="space-y-1.5 text-xs relative z-10" style={{ color: "var(--text-secondary)" }}>
                <li className="flex gap-2">
                  <span style={{ color: "#FEDD00" }}>·</span>
                  <span>Toggle between <span style={{ color: "var(--accent-primary)" }}>Table</span> and <span style={{ color: "#40c4ff" }}>Charts</span> to browse rows or explore distributions visually.</span>
                </li>
                <li className="flex gap-2">
                  <span style={{ color: "#FEDD00" }}>·</span>
                  <span>Use <span style={{ color: "var(--accent-primary)" }}>Import</span> to bulk-load metrics from CSV / Excel, or <span style={{ color: "var(--accent-primary)" }}>Add Metric</span> for a single record.</span>
                </li>
                <li className="flex gap-2">
                  <span style={{ color: "#FEDD00" }}>·</span>
                  <span>Filter by category and region, then <span style={{ color: "var(--accent-primary)" }}>Export</span> the filtered view to CSV.</span>
                </li>
                <li className="flex gap-2">
                  <span style={{ color: "#FEDD00" }}>·</span>
                  <span>Select multiple rows to bulk-delete. Confidence badges flag which records are analytically reliable.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {showImport && <ImportMetricModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); invalidateHealthMetricCache(); load(true); addLog("success", "Import complete"); }} />}
      {showForm && <MetricForm metric={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}