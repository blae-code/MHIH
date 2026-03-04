import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Search, Upload, Plus, Filter, Download, Trash2, Edit2, RefreshCw, Table2, BarChart2 } from "lucide-react";
import ImportMetricModal from "@/components/data/ImportMetricModal";
import MetricForm from "@/components/data/MetricForm";
import MetricsChartExplorer from "@/components/analyst/MetricsChartExplorer";

const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];

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

  const load = () => {
    setLoading(true);
    base44.entities.HealthMetric.list("-year", 500)
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
    addLog("success", "Metric deleted");
    load();
  };

  const handleBulkDelete = async () => {
    await Promise.all([...selected].map(id => base44.entities.HealthMetric.delete(id)));
    setSelected(new Set());
    addLog("success", `Deleted ${selected.size} metrics`);
    load();
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
    setShowForm(false);
    setEditing(null);
    load();
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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md outline-none"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
              placeholder="Search metrics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="text-xs px-2 py-1.5 rounded-md outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
          </select>
          <select
            className="text-xs px-2 py-1.5 rounded-md outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="all">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ background: "rgba(248,81,73,0.15)", color: "var(--color-error)", border: "1px solid rgba(248,81,73,0.3)" }}>
              <Trash2 size={12} /> Delete ({selected.size})
            </button>
          )}
          <button onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <Download size={12} /> Export
          </button>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <Upload size={12} /> Import
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            <Plus size={12} /> Add Metric
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <table className="w-full data-table">
            <thead className="sticky top-0">
              <tr>
                <th className="w-8">
                  <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(m=>m.id)) : new Set())}
                    checked={selected.size === filtered.length && filtered.length > 0} style={{ accentColor: "var(--accent-primary)" }} />
                </th>
                <th className="text-left">Name</th>
                <th className="text-left">Category</th>
                <th className="text-left">Region</th>
                <th className="text-right">Year</th>
                <th className="text-right">Value</th>
                <th className="text-left">Unit</th>
                <th className="text-left">Source</th>
                <th className="text-center">Confidence</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                  No metrics found. Add or import data to get started.
                </td></tr>
              ) : filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)}
                      style={{ accentColor: "var(--accent-primary)" }} />
                  </td>
                  <td><span className="font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span></td>
                  <td><span className="tag">{m.category?.replace(/_/g," ")}</span></td>
                  <td style={{ color: "var(--text-secondary)" }}>{m.region}</td>
                  <td className="text-right" style={{ color: "var(--text-secondary)" }}>{m.year}</td>
                  <td className="text-right font-mono" style={{ color: "var(--accent-primary)" }}>
                    {m.value != null ? Number(m.value).toLocaleString() : "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{m.unit || "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{m.data_source_name || "—"}</td>
                  <td className="text-center">
                    <span className={`tag`} style={{
                      color: m.confidence_level === "high" ? "var(--color-success)" : m.confidence_level === "low" ? "var(--color-error)" : "var(--color-warning)"
                    }}>{m.confidence_level || "—"}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={() => { setEditing(m); setShowForm(true); }} className="activity-icon" style={{ width: 24, height: 24 }}>
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="activity-icon" style={{ width: 24, height: 24, color: "var(--color-error)" }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-t flex items-center gap-4 shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {filtered.length} of {metrics.length} records
        </span>
        {selected.size > 0 && (
          <span className="text-xs" style={{ color: "var(--accent-primary)" }}>{selected.size} selected</span>
        )}
      </div>

      {showImport && <ImportMetricModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); load(); addLog("success", "Import complete"); }} />}
      {showForm && <MetricForm metric={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}