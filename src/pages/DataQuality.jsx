import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  AlertTriangle, CheckCircle, RefreshCw, X, ChevronDown, ChevronRight,
  User, MessageSquare, Filter, Zap, ShieldCheck, AlertCircle, Info,
  Clock, Copy, Eye
} from "lucide-react";
import FlagDetailModal from "@/components/dataquality/FlagDetailModal";

const FLAG_TYPE_LABELS = {
  missing_value: "Missing Value",
  outlier: "Outlier",
  duplicate: "Duplicate",
  stale_data: "Stale Data",
  inconsistency: "Inconsistency",
  invalid_range: "Invalid Range",
};

const SEVERITY_CONFIG = {
  critical: { color: "var(--color-error)", bg: "#3d1010", label: "Critical" },
  high: { color: "#f97316", bg: "#2d1500", label: "High" },
  medium: { color: "var(--color-warning)", bg: "#2d2208", label: "Medium" },
  low: { color: "var(--color-info)", bg: "#0d1f2d", label: "Low" },
};

const STATUS_CONFIG = {
  open: { color: "var(--color-error)", label: "Open" },
  in_review: { color: "var(--color-warning)", label: "In Review" },
  resolved: { color: "var(--color-success)", label: "Resolved" },
  dismissed: { color: "var(--text-muted)", label: "Dismissed" },
};

export default function DataQuality() {
  const { user, addLog } = useApp();
  const [flags, setFlags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterStatus, setFilterStatus] = useState("open");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState(null);
  const [lastScan, setLastScan] = useState(null);

  const canEdit = user?.role === "admin" || user?.role === "analyst";

  const load = async () => {
    const data = await base44.entities.DataQualityFlag.list("-created_date", 500);
    setFlags(data);
    if (data.length > 0) setLastScan(data[0].created_date);
    setLoading(false);
  };

  useEffect(() => {
    load();
    base44.entities.User.list().then(setUsers).catch(() => {});
  }, []);

  const handleScan = async () => {
    setScanning(true);
    addLog("info", "Running data quality scan...");
    try {
      const res = await base44.functions.invoke("runDataQualityScan", {});
      const d = res.data;
      addLog("success", `Scan complete: ${d.flags_generated} flags across ${d.metrics_scanned} metrics`);
      await load();
    } catch (e) {
      addLog("error", `Scan failed: ${e.message}`);
    }
    setScanning(false);
  };

  const handleUpdateFlag = async (id, updates) => {
    await base44.entities.DataQualityFlag.update(id, updates);
    setFlags(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    if (selected?.id === id) setSelected(f => ({ ...f, ...updates }));
    addLog("success", "Flag updated");
  };

  const filtered = useMemo(() => flags.filter(f => {
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    if (filterSeverity !== "all" && f.severity !== filterSeverity) return false;
    if (filterType !== "all" && f.flag_type !== filterType) return false;
    return true;
  }), [flags, filterStatus, filterSeverity, filterType]);

  const stats = useMemo(() => ({
    open: flags.filter(f => f.status === "open").length,
    critical: flags.filter(f => f.severity === "critical" && f.status === "open").length,
    in_review: flags.filter(f => f.status === "in_review").length,
    resolved: flags.filter(f => f.status === "resolved").length,
  }), [flags]);

  const STAT_CARDS = [
    { label: "Open Flags", value: stats.open, icon: AlertTriangle, color: "var(--color-error)" },
    { label: "Critical", value: stats.critical, icon: AlertCircle, color: "#f97316" },
    { label: "In Review", value: stats.in_review, icon: Eye, color: "var(--color-warning)" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "var(--color-success)" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <ShieldCheck size={14} style={{ color: "var(--accent-primary)" }} />
            Data Quality Monitor
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {lastScan ? `Last scan: ${new Date(lastScan).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}` : "No scans run yet"}
          </p>
        </div>
        {canEdit && (
          <button onClick={handleScan} disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
            {scanning ? "Scanning..." : "Run Scan"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="metric-card flex items-center gap-3">
              <s.icon size={20} style={{ color: s.color, flexShrink: 0 }} />
              <div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <Filter size={12} style={{ color: "var(--text-muted)" }} />
          {["all", "open", "in_review", "resolved", "dismissed"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 rounded text-xs"
              style={{
                background: filterStatus === s ? "var(--accent-primary)" : "var(--bg-overlay)",
                color: filterStatus === s ? "#000" : "var(--text-secondary)",
                fontWeight: filterStatus === s ? 600 : 400
              }}>
              {s === "all" ? "All Status" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
          <div className="w-px h-4 mx-1" style={{ background: "var(--border-subtle)" }} />
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="text-xs px-2 py-1 rounded outline-none"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <option value="all">All Severity</option>
            {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-xs px-2 py-1 rounded outline-none"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <option value="all">All Types</option>
            {Object.entries(FLAG_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(filterStatus !== "open" || filterSeverity !== "all" || filterType !== "all") && (
            <button onClick={() => { setFilterStatus("open"); setFilterSeverity("all"); setFilterType("all"); }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{ background: "var(--color-error)", color: "#fff", opacity: 0.8 }}>
              <X size={10} /> Reset
            </button>
          )}
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} flags</span>
        </div>

        {/* Flags table */}
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={16} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
              <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No flags match the current filters.</p>
              {flags.length === 0 && canEdit && (
                <button onClick={handleScan} className="mt-3 text-xs" style={{ color: "var(--accent-primary)" }}>
                  Run a scan to detect issues →
                </button>
              )}
            </div>
          ) : (
            <table className="w-full data-table text-xs">
              <thead>
                <tr>
                  <th className="text-left" style={{ width: 80 }}>Severity</th>
                  <th className="text-left">Metric</th>
                  <th className="text-left" style={{ width: 110 }}>Type</th>
                  <th className="text-left">Description</th>
                  <th className="text-left" style={{ width: 90 }}>Status</th>
                  <th className="text-left" style={{ width: 120 }}>Assigned To</th>
                  <th className="text-left" style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(flag => {
                  const sev = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
                  const st = STATUS_CONFIG[flag.status] || STATUS_CONFIG.open;
                  return (
                    <tr key={flag.id} onClick={() => setSelected(flag)} style={{ cursor: "pointer" }}>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}` }}>
                          {sev.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{flag.metric_name || "—"}</div>
                        {(flag.category || flag.region) && (
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {[flag.category?.replace(/_/g, " "), flag.region, flag.year].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="tag">{FLAG_TYPE_LABELS[flag.flag_type] || flag.flag_type}</span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", maxWidth: 320 }}>
                        <span className="line-clamp-2">{flag.description}</span>
                      </td>
                      <td>
                        <span className="font-medium" style={{ color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {flag.assigned_to_name || <span style={{ opacity: 0.4 }}>Unassigned</span>}
                      </td>
                      <td>
                        <button onClick={e => { e.stopPropagation(); setSelected(flag); }}
                          className="activity-icon" style={{ width: 24, height: 24 }} title="View & manage">
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <FlagDetailModal
          flag={selected}
          users={users}
          canEdit={canEdit}
          onUpdate={handleUpdateFlag}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}