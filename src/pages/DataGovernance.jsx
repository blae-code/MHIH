import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Shield, Lock, Eye, EyeOff, Users, Clock, FileText,
  RefreshCw, AlertTriangle, CheckCircle, Download, Search
} from "lucide-react";

const SENSITIVITY_LEVELS = [
  { value: "public", label: "Public", color: "var(--color-success)", desc: "Freely shareable data" },
  { value: "internal", label: "Internal", color: "var(--color-warning)", desc: "Internal use only" },
  { value: "restricted", label: "Restricted", color: "var(--color-error)", desc: "Requires authorization" },
  { value: "confidential", label: "Confidential", color: "#a78bfa", desc: "Highly sensitive, anonymized only" },
];

const RETENTION_POLICIES = ["1 year", "2 years", "5 years", "7 years", "Indefinite"];

export default function DataGovernance() {
  const { addLog, user } = useApp();
  const [sources, setSources] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("classification");
  const [editingSource, setEditingSource] = useState(null);
  const [govMeta, setGovMeta] = useState({});

  const GOV_KEY = "mhip_governance";
  useEffect(() => {
    try { const saved = localStorage.getItem(GOV_KEY); if (saved) setGovMeta(JSON.parse(saved)); } catch {}
  }, []);
  const saveGovMeta = (meta) => { setGovMeta(meta); localStorage.setItem(GOV_KEY, JSON.stringify(meta)); };

  useEffect(() => {
    Promise.all([
      base44.entities.DataSource.list("-updated_date", 200),
      base44.entities.AuditLog.list("-created_date", 50),
    ]).then(([src, logs]) => { setSources(src); setAuditLogs(logs); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const getMeta = (id) => govMeta[id] || { sensitivity: "internal", retention: "5 years", owner: "", anonymized: false };
  const setMeta = (id, partial) => saveGovMeta({ ...govMeta, [id]: { ...getMeta(id), ...partial } });

  const filtered = sources.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const sensitivityCounts = SENSITIVITY_LEVELS.map(l => ({
    ...l, count: sources.filter(s => getMeta(s.id).sensitivity === l.value).length
  }));

  const handleExportPolicy = () => {
    const lines = ["Data Governance Policy — BC Métis Health Intelligence Platform", `Generated: ${new Date().toLocaleDateString("en-CA")}`, ""];
    sources.forEach(s => {
      const meta = getMeta(s.id);
      lines.push(`${s.name}`);
      lines.push(`  Sensitivity: ${meta.sensitivity} | Retention: ${meta.retention} | Owner: ${meta.owner || "Unassigned"} | Anonymized: ${meta.anonymized ? "Yes" : "No"}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "data_governance_policy.txt"; a.click();
    addLog("success", "Governance policy exported");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b shrink-0 flex items-center justify-between"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <Shield size={14} style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Data Governance & Privacy</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPolicy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <Download size={12} /> Export Policy
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-4 shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        {["classification", "audit_log", "summary"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-xs font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? "var(--accent-primary)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "2px solid var(--accent-primary)" : "2px solid transparent",
            }}>
            {tab.replace(/_/g," ")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "summary" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sensitivityCounts.map(s => (
                <div key={s.value} className="metric-card flex items-center gap-3">
                  <Lock size={16} style={{ color: s.color }} />
                  <div>
                    <div className="text-xl font-bold" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="metric-card space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Sensitivity Legend</div>
              {SENSITIVITY_LEVELS.map(l => (
                <div key={l.value} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                  <div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{l.label}</span>
                    <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>— {l.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="metric-card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Anonymization Status</div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
                  <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                    {sources.filter(s => getMeta(s.id).anonymized).length} anonymized
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: "var(--color-warning)" }} />
                  <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                    {sources.filter(s => !getMeta(s.id).anonymized && getMeta(s.id).sensitivity !== "public").length} may contain identifiers
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "classification" && (
          <>
            <div className="flex items-center gap-2">
              <Search size={12} style={{ color: "var(--text-muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search sources..."
                className="flex-1 text-xs px-2 py-1.5 rounded-md outline-none"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-muted)" }}>
                <RefreshCw size={14} className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(src => {
                  const meta = getMeta(src.id);
                  const sensDef = SENSITIVITY_LEVELS.find(s => s.value === meta.sensitivity);
                  return (
                    <div key={src.id} className="rounded-lg p-3"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: sensDef?.color || "var(--text-muted)" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{src.name}</span>
                        {meta.anonymized && (
                          <span className="tag" style={{ fontSize: 9, color: "var(--color-success)", borderColor: "var(--color-success)" }}>Anonymized</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>Sensitivity</label>
                          <select value={meta.sensitivity} onChange={e => setMeta(src.id, { sensitivity: e.target.value })}
                            className="w-full text-xs px-2 py-1 rounded outline-none"
                            style={{ background: "var(--bg-overlay)", border: `1px solid ${sensDef?.color || "var(--border-subtle)"}`, color: sensDef?.color }}>
                            {SENSITIVITY_LEVELS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>Retention</label>
                          <select value={meta.retention} onChange={e => setMeta(src.id, { retention: e.target.value })}
                            className="w-full text-xs px-2 py-1 rounded outline-none"
                            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                            {RETENTION_POLICIES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>Anonymized</label>
                          <button onClick={() => setMeta(src.id, { anonymized: !meta.anonymized })}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                            style={{
                              background: meta.anonymized ? "rgba(46,160,67,0.15)" : "var(--bg-overlay)",
                              border: `1px solid ${meta.anonymized ? "var(--color-success)" : "var(--border-subtle)"}`,
                              color: meta.anonymized ? "var(--color-success)" : "var(--text-muted)",
                            }}>
                            {meta.anonymized ? <EyeOff size={10} /> : <Eye size={10} />}
                            {meta.anonymized ? "Yes" : "No"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "audit_log" && (
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <div className="text-center py-10 text-xs" style={{ color: "var(--text-muted)" }}>No audit log entries yet.</div>
            ) : auditLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <FileText size={12} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="tag" style={{ fontSize: 9 }}>{log.action}</span>
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>{log.entity_name || log.entity_type}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {log.user_name || log.user_email} · {new Date(log.created_date).toLocaleString("en-CA")}
                  </div>
                  {log.details && <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{log.details}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}