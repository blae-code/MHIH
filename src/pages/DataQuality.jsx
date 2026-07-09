import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  RefreshCw, ChevronRight,
  Zap, ShieldCheck, Sparkles
} from "lucide-react";
import FlagDetailModal from "@/components/dataquality/FlagDetailModal";
import CockpitShell from "@/components/shell/CockpitShell";
import ZoneHeader from "@/components/shell/ZoneHeader";
import QualityStatStrip from "@/components/dataquality/QualityStatStrip";
import ListFilterBar from "@/components/shell/ListFilterBar";

const FLAG_CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const FLAG_REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];
const FLAG_STATUSES = ["open","in_review","resolved","dismissed"];

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
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [selected, setSelected] = useState(null);
  const [lastScan, setLastScan] = useState(null);

  const canEdit = user?.role === "admin" || user?.role === "user";

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
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    if (filterRegion !== "all" && f.region !== filterRegion) return false;
    return true;
  }), [flags, filterStatus, filterSeverity, filterType, filterCategory, filterRegion]);

  // Flag type breakdown
  const typeBreakdown = useMemo(() => {
    const counts = {};
    flags.filter(f => f.status === "open").forEach(f => {
      counts[f.flag_type] = (counts[f.flag_type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [flags]);

  // Top affected metrics
  const topAffected = useMemo(() => {
    const counts = {};
    flags.filter(f => f.status === "open").forEach(f => {
      if (f.metric_name) counts[f.metric_name] = (counts[f.metric_name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [flags]);

  return (
    <CockpitShell
      icon={<ShieldCheck size={16} style={{ color: "var(--mnbc-yellow)" }} />}
      title="Data Management"
      subtitle={`Quality monitoring · flag triage · remediation — ${lastScan ? `last scan: ${new Date(lastScan).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}` : "no scans run yet"}`}
      actions={canEdit && (
        <button onClick={handleScan} disabled={scanning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 14px rgba(254,221,0,0.3)" }}>
          {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
          {scanning ? "Scanning..." : "Run Quality Scan"}
        </button>
      )}
    >
      {/* Stat strip */}
      <div className="mb-3">
        <QualityStatStrip flags={flags} />
      </div>

      {/* 2-zone cockpit */}
      <div className="cockpit-zone-grid">

        {/* Left: Flags */}
        <div className="cockpit-zone">
          <ZoneHeader
            label="Flags"
            title="Quality Issues"
            count={`${filtered.length} flags`}
            hint="filter · triage · resolve"
          />

          {/* Filters */}
          <ListFilterBar
            showSearch={false}
            region={filterRegion}
            onRegionChange={setFilterRegion}
            regionOptions={FLAG_REGIONS}
            category={filterCategory}
            onCategoryChange={setFilterCategory}
            categoryOptions={FLAG_CATEGORIES}
            status={filterStatus}
            onStatusChange={setFilterStatus}
            statusOptions={FLAG_STATUSES}
            onClear={() => { setFilterStatus("open"); setFilterSeverity("all"); setFilterType("all"); setFilterCategory("all"); setFilterRegion("all"); }}
            extra={
              <>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded outline-none"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  <option value="all">All Severity</option>
                  {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded outline-none"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  <option value="all">All Types</option>
                  {Object.entries(FLAG_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </>
            }
          />

          {/* Flags table */}
          <div className="cockpit-widget-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="relative z-10 overflow-auto" style={{ maxHeight: 620 }}>
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
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="text-left" style={{ width: 80 }}>Severity</th>
                      <th className="text-left">Metric</th>
                      <th className="text-left" style={{ width: 110 }}>Type</th>
                      <th className="text-left">Description</th>
                      <th className="text-left" style={{ width: 90 }}>Status</th>
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
        </div>

        {/* Right: Insights */}
        <div className="cockpit-zone">
          <ZoneHeader
            label="Insights"
            title="Data Health Intelligence"
            count={`${typeBreakdown.length} flag types`}
            hint="distribution + tips"
          />

          {/* Flag type breakdown */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Open by Type</div>
            <div className="space-y-2 relative z-10">
              {typeBreakdown.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  No open flags — quality looks good.
                </p>
              ) : (
                typeBreakdown.map(([type, count]) => {
                  const pct = flags.filter(f => f.status === "open").length ? (count / flags.filter(f => f.status === "open").length) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: "var(--text-secondary)" }}>{FLAG_TYPE_LABELS[type] || type}</span>
                        <span className="font-mono" style={{ color: "var(--color-error)" }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg-overlay)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #ff1744 0%, #ff4d4f 100%)", borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top affected metrics */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Most Affected Metrics</div>
            <div className="space-y-2 relative z-10">
              {topAffected.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  No problematic metrics detected.
                </p>
              ) : (
                topAffected.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between gap-2 p-2 rounded-md"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{name}</div>
                    <span className="text-xs font-mono shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,23,68,0.08)", color: "var(--color-error)", border: "1px solid rgba(255,23,68,0.3)" }}>
                      {count} flag{count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* How to use */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label flex items-center gap-1.5 relative z-10">
              <Sparkles size={11} style={{ color: "var(--accent-primary)" }} />
              How to Use
            </div>
            <ul className="space-y-1.5 text-xs relative z-10" style={{ color: "var(--text-secondary)" }}>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Click <span style={{ color: "var(--accent-primary)" }}>Run Quality Scan</span> to detect missing values, outliers, duplicates, and stale data automatically.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Click any flag row to assign, comment, and update its status (Open → In Review → Resolved).</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Filter by severity to focus on critical issues affecting downstream analytics.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Resolution rates and most-affected metrics surface here to guide remediation effort.</span></li>
            </ul>
          </div>
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
    </CockpitShell>
  );
}