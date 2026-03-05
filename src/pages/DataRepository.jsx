import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Search, Upload, Plus, Download, Trash2, Edit2, RefreshCw, Table2, BarChart2, Database, X, SlidersHorizontal } from "lucide-react";
import ImportMetricModal from "@/components/data/ImportMetricModal";
import MetricForm from "@/components/data/MetricForm";
import MetricsChartExplorer from "@/components/analyst/MetricsChartExplorer";
import { invalidateHealthMetricCache, listAllHealthMetrics } from "@/lib/healthMetrics";

const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];

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
    return matchSearch && matchCat && matchRegion;
  });

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

  const hasActiveFilters = search || catFilter !== "all" || regionFilter !== "all";
  const clearFilters = () => { setSearch(""); setCatFilter("all"); setRegionFilter("all"); };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 py-4 shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #091828 50%, var(--bg-elevated) 100%)",
          borderBottom: "1px solid var(--border-default)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(254,221,0,0.1)"
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 60%, transparent 100%)" }} />
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2 shrink-0">
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
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "var(--border-emphasis)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
              <Download size={12} /> Export
            </button>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "var(--border-emphasis)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
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

      {/* ── Filter Bar ── */}
      <div className="px-5 py-2.5 shrink-0 flex items-center gap-3 flex-wrap"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <SlidersHorizontal size={12} />
          <span>Filters</span>
        </div>
        {/* Search */}
        <div className="relative" style={{ minWidth: 220 }}>
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            className="w-full text-xs pl-8 pr-8 py-2 rounded-lg outline-none transition-all"
            style={{ background: "var(--bg-overlay)", border: `1px solid ${search ? "rgba(254,221,0,0.4)" : "var(--border-subtle)"}`, color: "var(--text-primary)" }}
            placeholder="Search metrics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
              <X size={11} />
            </button>
          )}
        </div>
        {/* Category */}
        <select
          className="text-xs px-3 py-2 rounded-lg outline-none transition-all"
          style={{ background: "var(--bg-overlay)", border: `1px solid ${catFilter !== "all" ? "rgba(254,221,0,0.4)" : "var(--border-subtle)"}`, color: catFilter !== "all" ? "var(--accent-primary)" : "var(--text-secondary)", minWidth: 150 }}
          value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
        </select>
        {/* Region */}
        <select
          className="text-xs px-3 py-2 rounded-lg outline-none transition-all"
          style={{ background: "var(--bg-overlay)", border: `1px solid ${regionFilter !== "all" ? "rgba(254,221,0,0.4)" : "var(--border-subtle)"}`, color: regionFilter !== "all" ? "var(--accent-primary)" : "var(--text-secondary)", minWidth: 130 }}
          value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option value="all">All Regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,23,68,0.08)", color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.2)" }}>
            <X size={10} /> Clear
          </button>
        )}
        <div className="flex-1" />
        {/* Record count */}
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          {filtered.length} / {metrics.length} records
        </span>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(255,23,68,0.12)", color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.3)" }}>
            <Trash2 size={12} /> Delete {selected.size} selected
          </button>
        )}
      </div>

      {/* ── Chart Explorer ── */}
      {viewMode === "chart" && !loading && (
        <div className="flex-1 overflow-hidden">
          <MetricsChartExplorer metrics={filtered} />
        </div>
      )}

      {/* ── Table ── */}
      {viewMode === "table" && (
        <div className="flex-1 overflow-auto">
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

      {showImport && <ImportMetricModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); invalidateHealthMetricCache(); load(true); addLog("success", "Import complete"); }} />}
      {showForm && <MetricForm metric={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}
