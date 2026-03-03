import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Shield, Database, Trash2, RefreshCw, Download, Upload, AlertCircle, CheckCircle, Activity } from "lucide-react";

export default function Admin() {
  const { user, addLog } = useApp();
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [sources, setSources] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(null);
  const [working, setWorking] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    Promise.all([
      base44.entities.AuditLog.list("-created_date", 100),
      base44.entities.HealthMetric.list("-year", 1),
      base44.entities.DataSource.list(),
      base44.entities.AIInsight.list(),
    ]).then(([l, m, s, i]) => {
      setLogs(l);
      setMetrics(m);
      setSources(s);
      setInsights(i);
    }).catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleClearEntity = async (entityName) => {
    setWorking(true);
    let items = [];
    if (entityName === "HealthMetric") items = await base44.entities.HealthMetric.list("-year", 2000);
    if (entityName === "AIInsight") items = await base44.entities.AIInsight.list("-created_date", 2000);
    if (entityName === "AuditLog") items = await base44.entities.AuditLog.list("-created_date", 2000);
    await Promise.all(items.map(item => base44.entities[entityName].delete(item.id)));
    addLog("success", `Cleared all ${entityName} records (${items.length})`);
    setConfirmReset(null);
    setWorking(false);
  };

  const handleBackupJSON = async () => {
    const allMetrics = await base44.entities.HealthMetric.list("-year", 2000);
    const allSources = await base44.entities.DataSource.list("-created_date", 200);
    const backup = { timestamp: new Date().toISOString(), metrics: allMetrics, sources: allSources };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `mhip_backup_${new Date().toISOString().split("T")[0]}.json`; a.click();
    addLog("success", "Full database backup exported");
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
      <Shield size={32} className="mb-3 opacity-30" />
      <p className="text-sm">Admin access required.</p>
    </div>
  );

  const ENTITY_STATS = [
    { label: "Health Metrics", count: metrics.length, entity: "HealthMetric", icon: Activity, color: "var(--accent-primary)" },
    { label: "Data Sources", count: sources.length, entity: "DataSource", icon: Database, color: "var(--color-info)", noDelete: true },
    { label: "AI Insights", count: insights.length, entity: "AIInsight", icon: Shield, color: "#a78bfa" },
    { label: "Audit Logs", count: logs.length, entity: "AuditLog", icon: RefreshCw, color: "var(--text-muted)" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Shield size={14} style={{ color: "var(--accent-primary)" }} /> System Administration
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Database management, backups, and system monitoring for blae@katrasoluta.com
        </p>
      </div>

      {/* Entity stats */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Database Overview</div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {ENTITY_STATS.map(stat => (
            <div key={stat.label} className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={14} style={{ color: stat.color }} />
                {!stat.noDelete && (
                  <button onClick={() => setConfirmReset(stat)}
                    className="activity-icon" style={{ width: 22, height: 22, color: "var(--color-error)" }}
                    title={`Clear all ${stat.label}`}>
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.count}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Database Actions</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={handleBackupJSON}
            className="flex items-center gap-3 p-4 rounded-lg text-left"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "var(--border-default)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
            <Download size={18} style={{ color: "var(--color-success)" }} />
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Export Full Backup</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Download all metrics and sources as JSON</div>
            </div>
          </button>
          <div className="flex items-center gap-3 p-4 rounded-lg"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", opacity: 0.5, cursor: "not-allowed" }}>
            <Upload size={18} style={{ color: "var(--color-info)" }} />
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Restore from Backup</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Coming soon — import a JSON backup file</div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Recent Audit Log</div>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={14} className="animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>No audit log entries yet.</div>
          ) : (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Time</th>
                  <th className="text-left">Action</th>
                  <th className="text-left">Entity</th>
                  <th className="text-left">User</th>
                  <th className="text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 30).map(log => (
                  <tr key={log.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {new Date(log.created_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td><span className="tag">{log.action}</span></td>
                    <td style={{ color: "var(--text-secondary)" }}>{log.entity_type || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 11 }}>{log.user_email}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-xl p-6 shadow-2xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--color-error)" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} style={{ color: "var(--color-error)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>Destructive Action</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              This will permanently delete <strong style={{ color: "var(--text-primary)" }}>all {confirmReset.label}</strong>. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmReset(null)}
                className="px-3 py-1.5 rounded-md text-xs"
                style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                Cancel
              </button>
              <button onClick={() => handleClearEntity(confirmReset.entity)} disabled={working}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: "var(--color-error)", color: "#fff" }}>
                {working ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}