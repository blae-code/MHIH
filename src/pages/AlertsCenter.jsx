import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { AlertTriangle, Bell, CheckCircle2, RefreshCw, ShieldAlert, Siren } from "lucide-react";

const SEVERITIES = ["all", "critical", "high", "medium", "low"];
const STATUSES = ["all", "open", "acknowledged", "resolved"];

export default function AlertsCenter() {
  const { addLog } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, insights] = await Promise.all([
        base44.entities.AlertEvent.list("-created_date", 600).catch(() => []),
        base44.entities.AIInsight.filter({ type: "weekly_intelligence" }, "-created_date", 12).catch(() => []),
      ]);
      setAlerts(a || []);
      setWeekly(insights || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runSentinel = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("runSentinelScan", {});
      addLog("success", `Sentinel complete: ${res.data?.alerts_created || 0} alerts`);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const runConflict = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("reconcileSourceConflict", {});
      addLog("success", `Conflict reconciliation complete: ${res.data?.conflicts_found || 0}`);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const filtered = useMemo(() => alerts.filter(a => {
    if (severity !== "all" && a.severity !== severity) return false;
    if (status !== "all" && a.status !== status) return false;
    return true;
  }), [alerts, severity, status]);

  const setAlertStatus = async (alert, nextStatus) => {
    try {
      await base44.entities.AlertEvent.update(alert.id, { status: nextStatus });
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: nextStatus } : a));
      addLog("success", `Alert marked ${nextStatus}`);
    } catch (e) {
      addLog("error", e.message);
    }
  };

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Siren size={14} style={{ color: "var(--accent-primary)" }} />
            Alerts Center
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sentinel alerts for trend shifts, widening disparities, and source conflicts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runSentinel} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--accent-primary)", color: "#000" }}>
            {working ? <RefreshCw size={11} className="animate-spin" /> : <Bell size={11} />} Run Sentinel
          </button>
          <button onClick={runConflict} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <ShieldAlert size={11} /> Reconcile Conflicts
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <select value={severity} onChange={e => setSeverity(e.target.value)} className="text-xs px-2 py-1 rounded" style={selectStyle}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s === "all" ? "All Severity" : s}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="text-xs px-2 py-1 rounded" style={selectStyle}>
              {STATUSES.map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>)}
            </select>
            <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} alerts</span>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-auto">
            {filtered.map(a => (
              <div key={a.id} className="p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{a.metric_name || a.alert_type}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{a.region || "BC"} · {a.category?.replace(/_/g, " ") || "—"} · {a.alert_type}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{a.summary || a.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="tag" style={{ color: severityColor(a.severity), borderColor: severityColor(a.severity) }}>{a.severity}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{a.status || "open"}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{a.lead_time_score != null ? `Lead ${a.lead_time_score}` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <button onClick={() => setAlertStatus(a, "acknowledged")} className="px-2 py-1 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>Acknowledge</button>
                  <button onClick={() => setAlertStatus(a, "resolved")} className="px-2 py-1 rounded text-xs" style={{ background: "var(--color-success)", color: "#fff" }}>Resolve</button>
                </div>
              </div>
            ))}
            {!filtered.length && !loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No alerts found for current filters.</div>}
          </div>
        </div>

        <div className="metric-card">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>What Changed This Week</div>
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {weekly.map(w => (
              <div key={w.id} className="p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>{w.title}</div>
                <div className="text-xs mt-1 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{w.content}</div>
              </div>
            ))}
            {!weekly.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>Run sentinel to generate weekly intelligence summaries.</div>}
          </div>
        </div>
      </div>

      {loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading alerts...</div>}
    </div>
  );
}

const selectStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  outline: "none",
};

function severityColor(value) {
  if (value === "critical") return "var(--color-error)";
  if (value === "high") return "#f97316";
  if (value === "medium") return "var(--color-warning)";
  return "var(--text-muted)";
}
