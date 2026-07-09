import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Shield, Lock, Eye, EyeOff, FileText,
  RefreshCw, AlertTriangle, CheckCircle, Download, Search, Sparkles, HelpCircle
} from "lucide-react";
import CockpitShell from "@/components/shell/CockpitShell";
import ZoneHeader from "@/components/shell/ZoneHeader";

const SENSITIVITY_LEVELS = [
  { value: "public", label: "Public", color: "#00e676", bg: "rgba(0,230,118,0.08)", desc: "Freely shareable data" },
  { value: "internal", label: "Internal", color: "#ffab40", bg: "rgba(255,171,64,0.08)", desc: "Internal use only" },
  { value: "restricted", label: "Restricted", color: "#ff1744", bg: "rgba(255,23,68,0.08)", desc: "Requires authorization" },
  { value: "confidential", label: "Confidential", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", desc: "Highly sensitive, anonymized only" },
];

const RETENTION_POLICIES = ["1 year", "2 years", "5 years", "7 years", "Indefinite"];

export default function DataGovernance() {
  const { addLog } = useApp();
  const [sources, setSources] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("classification");
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

  const filtered = sources.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()));

  const sensitivityCounts = useMemo(() => SENSITIVITY_LEVELS.map(l => ({
    ...l, count: sources.filter(s => getMeta(s.id).sensitivity === l.value).length
  })), [sources, govMeta]);

  const anonymizedCount = useMemo(() => sources.filter(s => getMeta(s.id).anonymized).length, [sources, govMeta]);
  const atRiskCount = useMemo(() => sources.filter(s => !getMeta(s.id).anonymized && getMeta(s.id).sensitivity !== "public").length, [sources, govMeta]);

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
    <CockpitShell
      icon={<Shield size={16} style={{ color: "var(--mnbc-yellow)" }} />}
      title="Data Governance"
      subtitle="Data stewardship — classification · retention · anonymization · audit trail"
      actions={
        <button onClick={handleExportPolicy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
          <Download size={12} /> Export Policy
        </button>
      }
    >
      {/* Stat strip — sensitivity buckets */}
      <div className="mb-3">
        <div className="dashboard-section-label mb-2">Sensitivity Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {sensitivityCounts.map(s => (
            <div key={s.value} className="relative overflow-hidden group" title={s.desc}
              style={{
                background: `linear-gradient(135deg, ${s.bg} 0%, var(--bg-elevated) 100%)`,
                border: `1.5px solid ${s.color}33`,
                cursor: "help", padding: 12, borderRadius: 10,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.35)",
              }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color} 0%, transparent 100%)` }} />
              <div className="flex items-start justify-between mb-2 relative z-10">
                <span className="font-semibold uppercase tracking-wider leading-tight" style={{ color: "var(--text-secondary)", fontSize: "9px", letterSpacing: "0.05em" }}>{s.label}</span>
                <div className="flex items-center gap-1">
                  <div className="p-1.5 rounded-md shrink-0 transition-all group-hover:scale-110" style={{ background: s.bg, boxShadow: `0 0 8px ${s.color}22` }}>
                    <Lock size={12} style={{ color: s.color, strokeWidth: 2.5 }} />
                  </div>
                  <HelpCircle size={10} style={{ color: s.color, opacity: 0.5 }} />
                </div>
              </div>
              <div className="font-black mb-1 relative z-10 leading-none" style={{ color: s.color, textShadow: `0 2px 8px ${s.color}18`, fontSize: 26 }}>{s.count}</div>
              <div className="leading-snug relative z-10" style={{ color: "var(--text-secondary)", fontSize: "10.5px" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-3 shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        {["classification", "audit_log", "summary"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-xs font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? "var(--accent-primary)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "2px solid var(--accent-primary)" : "2px solid transparent",
            }}>
            {tab.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* 2-zone cockpit */}
      <div className="cockpit-zone-grid">

        {/* Left: main content */}
        <div className="cockpit-zone">
          <ZoneHeader
            label={activeTab.replace(/_/g, " ")}
            title={
              activeTab === "classification" ? "Source Classification" :
              activeTab === "audit_log" ? "Audit Log" : "Summary Dashboard"
            }
            count={activeTab === "classification" ? `${filtered.length} sources` : activeTab === "audit_log" ? `${auditLogs.length} entries` : `${sources.length} total`}
            hint={activeTab === "classification" ? "set sensitivity, retention, anonymization" : activeTab === "audit_log" ? "recent activity" : "governance posture"}
          />

          {activeTab === "classification" && (
            <>
              <div className="cockpit-widget-card" style={{ padding: 10 }}>
                <div className="relative z-10 flex items-center gap-2">
                  <Search size={12} style={{ color: "var(--text-muted)" }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search sources..."
                    className="flex-1 text-xs px-2 py-1.5 rounded-md outline-none"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                </div>
              </div>

              <div className="cockpit-widget-card" style={{ padding: 12 }}>
                <div className="relative z-10">
                  {loading ? (
                    <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-muted)" }}>
                      <RefreshCw size={14} className="animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-auto" style={{ maxHeight: 540 }}>
                      {filtered.map(src => {
                        const meta = getMeta(src.id);
                        const sensDef = SENSITIVITY_LEVELS.find(s => s.value === meta.sensitivity);
                        return (
                          <div key={src.id} className="rounded-lg p-3"
                            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
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
                                  style={{ background: "var(--bg-elevated)", border: `1px solid ${sensDef?.color || "var(--border-subtle)"}`, color: sensDef?.color }}>
                                  {SENSITIVITY_LEVELS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs block mb-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>Retention</label>
                                <select value={meta.retention} onChange={e => setMeta(src.id, { retention: e.target.value })}
                                  className="w-full text-xs px-2 py-1 rounded outline-none"
                                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                                  {RETENTION_POLICIES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs block mb-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>Anonymized</label>
                                <button onClick={() => setMeta(src.id, { anonymized: !meta.anonymized })}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded w-full"
                                  style={{
                                    background: meta.anonymized ? "rgba(0,230,118,0.12)" : "var(--bg-elevated)",
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
                </div>
              </div>
            </>
          )}

          {activeTab === "audit_log" && (
            <div className="cockpit-widget-card" style={{ padding: 12 }}>
              <div className="space-y-2 relative z-10 overflow-auto" style={{ maxHeight: 600 }}>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-10 text-xs" style={{ color: "var(--text-muted)" }}>No audit log entries yet.</div>
                ) : auditLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
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
            </div>
          )}

          {activeTab === "summary" && (
            <div className="cockpit-widget-card">
              <div className="dashboard-section-label relative z-10">Sensitivity Legend</div>
              <div className="space-y-2 relative z-10">
                {SENSITIVITY_LEVELS.map(l => (
                  <div key={l.value} className="flex items-center gap-3 p-2 rounded-md"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                    <div className="flex-1">
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{l.label}</span>
                      <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>— {l.desc}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: l.color }}>{sensitivityCounts.find(s => s.value === l.value)?.count || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Insights */}
        <div className="cockpit-zone">
          <ZoneHeader
            label="Insights"
            title="Data Governance Posture"
            count={`${anonymizedCount} anonymized`}
            hint="risk + tips"
          />

          {/* Anonymization snapshot */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Anonymization Status</div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between p-2 rounded-md"
                style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.25)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Anonymized</span>
                </div>
                <span className="text-sm font-mono" style={{ color: "var(--color-success)" }}>{anonymizedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md"
                style={{ background: "rgba(255,171,64,0.06)", border: "1px solid rgba(255,171,64,0.25)" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: "var(--color-warning)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>May contain identifiers</span>
                </div>
                <span className="text-sm font-mono" style={{ color: "var(--color-warning)" }}>{atRiskCount}</span>
              </div>
              <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
                Sources that are not public and not anonymized may carry identifiable information — review and tag as anonymized once de-identification is verified.
              </p>
            </div>
          </div>

          {/* Recent audit */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Recent Audit Activity</div>
            <div className="space-y-2 relative z-10">
              {auditLogs.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>No audit entries yet.</p>
              ) : (
                auditLogs.slice(0, 4).map(log => (
                  <div key={log.id} className="p-2 rounded-md"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="tag" style={{ fontSize: 9 }}>{log.action}</span>
                      <span className="truncate" style={{ color: "var(--text-primary)" }}>{log.entity_name || log.entity_type}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                      {log.user_name || log.user_email} · {new Date(log.created_date).toLocaleDateString("en-CA")}
                    </div>
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
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Use <span style={{ color: "var(--accent-primary)" }}>Classification</span> to set sensitivity, retention, and anonymization per source.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span><span style={{ color: "var(--accent-primary)" }}>Audit Log</span> shows recent platform activity — useful for compliance reviews.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Export your governance policy as a portable text document for stakeholder review.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Non-public, non-anonymized sources are flagged as "may contain identifiers" — review and act.</span></li>
            </ul>
          </div>
        </div>

      </div>
    </CockpitShell>
  );
}