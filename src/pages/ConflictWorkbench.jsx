import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { GitCompare, RefreshCw, ShieldAlert, ShieldCheck, CheckCircle2, XCircle, ArrowUpCircle } from "lucide-react";

const SEVERITIES = ["all", "critical", "high", "medium", "low"];
const STATUSES = ["all", "open", "acknowledged", "resolved"];

export default function ConflictWorkbench() {
  const { addLog } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("open");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("resolve");
  const [preferredSource, setPreferredSource] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([
        base44.entities.AlertEvent.filter({ alert_type: "source_conflict" }, "-created_date", 500).catch(() => []),
        base44.entities.SourceReliabilityProfile.list("-reliability_score", 200).catch(() => []),
      ]);
      setAlerts(a || []);
      setProfiles(p || []);
      if (!selected && a?.length) setSelected(a[0]);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (status !== "all" && a.status !== status) return false;
      return true;
    });
  }, [alerts, severity, status]);

  const selectedMeta = useMemo(() => parseMetadata(selected?.metadata), [selected]);
  const selectedSources = useMemo(() => selectedMeta?.sources || [], [selectedMeta]);

  const profileBySource = useMemo(() => {
    const map = new Map();
    profiles.forEach((p) => map.set(String(p.source_name || "").toLowerCase(), p));
    return map;
  }, [profiles]);

  const runConflictScan = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("reconcileSourceConflict", {});
      addLog("success", `Conflict scan complete: ${res.data?.conflicts_found || 0} conflicts`);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const rescoreReliability = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("scoreSourceReliability", {});
      addLog("success", `Reliability scores updated (${res.data?.scored_sources || 0} sources)`);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const submitAction = async () => {
    if (!selected?.id) return;
    if (action === "resolve" && !preferredSource) {
      addLog("warning", "Choose a preferred source when resolving");
      return;
    }
    setWorking(true);
    try {
      const res = await base44.functions.invoke("adjudicateSourceConflict", {
        alert_id: selected.id,
        action,
        preferred_source: preferredSource || null,
        reason,
      });
      addLog("success", `Conflict ${action} complete (flags updated: ${res.data?.quality_flags_updated || 0})`);
      setReason("");
      await load();
      const refreshed = await base44.entities.AlertEvent.get(selected.id).catch(() => null);
      setSelected(refreshed || null);
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <GitCompare size={14} style={{ color: "var(--accent-primary)" }} />
            Conflict Reconciliation Workbench
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Resolve conflicting source values with reliability context and adjudication workflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runConflictScan} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
            {working ? <RefreshCw size={11} className="animate-spin" /> : <ShieldAlert size={11} />} Refresh Conflicts
          </button>
          <button onClick={rescoreReliability} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <ShieldCheck size={11} /> Re-score Sources
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-1 space-y-2">
          <div className="flex items-center gap-2">
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="text-xs px-2 py-1 rounded" style={inputStyle}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s === "all" ? "All Severity" : s}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-xs px-2 py-1 rounded" style={inputStyle}>
              {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>)}
            </select>
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} conflict alerts</div>
          <div className="space-y-1 max-h-[520px] overflow-auto">
            {filtered.map((a) => (
              <button key={a.id} onClick={() => { setSelected(a); setPreferredSource(""); setReason(""); setAction("resolve"); }}
                className="w-full text-left p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: selected?.id === a.id ? "var(--bg-hover)" : "var(--bg-overlay)" }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{a.metric_name || "source conflict"}</div>
                  <span className="tag" style={{ color: severityColor(a.severity), borderColor: severityColor(a.severity) }}>{a.severity}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{a.region || "BC"} | {a.status || "open"}</div>
                <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{a.summary || a.description}</div>
              </button>
            ))}
            {!filtered.length && !loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No conflicts under current filters.</div>}
          </div>
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          {!selected ? (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Select a conflict to inspect sources and adjudicate.</div>
          ) : (
            <>
              <div className="rounded p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{selected.metric_name || "Source conflict"}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {selected.region || "BC"} | {selected.category?.replace(/_/g, " ") || "-"} | {selected.status || "open"}
                </div>
                <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>{selected.description || selected.summary}</div>
              </div>

              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                <table className="w-full data-table text-xs">
                  <thead>
                    <tr>
                      <th className="text-left">Source</th>
                      <th className="text-right">Value</th>
                      <th className="text-right">Freshness</th>
                      <th className="text-right">Reliability</th>
                      <th className="text-left">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSources.map((s, idx) => {
                      const profile = profileBySource.get(String(s.source || "").toLowerCase());
                      return (
                        <tr key={`${s.source}-${idx}`}>
                          <td>{s.source}</td>
                          <td className="text-right">{s.value}</td>
                          <td className="text-right">{s.freshness_score != null ? Number(s.freshness_score).toFixed(2) : "-"}</td>
                          <td className="text-right">{profile?.reliability_score ?? "-"}</td>
                          <td>{profile?.reliability_tier || "-"}</td>
                        </tr>
                      );
                    })}
                    {!selectedSources.length && (
                      <tr>
                        <td colSpan={5} className="text-center py-6" style={{ color: "var(--text-muted)" }}>No structured source metadata found on this alert.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!!selectedMeta?.candidate_reasons?.length && (
                <div className="rounded p-3" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>Candidate Divergence Reasons</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {selectedMeta.candidate_reasons.join(" | ")}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                <select value={action} onChange={(e) => setAction(e.target.value)} className="text-xs px-2 py-1 rounded" style={inputStyle}>
                  <option value="resolve">resolve</option>
                  <option value="dismiss">dismiss</option>
                  <option value="escalate">escalate</option>
                </select>
                <select value={preferredSource} onChange={(e) => setPreferredSource(e.target.value)} className="text-xs px-2 py-1 rounded lg:col-span-1" style={inputStyle} disabled={action !== "resolve"}>
                  <option value="">Preferred source...</option>
                  {selectedSources.map((s, idx) => <option key={`${s.source}-${idx}`} value={s.source}>{s.source}</option>)}
                </select>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className="text-xs px-2 py-1 rounded lg:col-span-2"
                  style={inputStyle} placeholder="Adjudication rationale (required for auditability)" />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={submitAction} disabled={working} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
                  {working ? <RefreshCw size={11} className="animate-spin" /> : action === "resolve" ? <CheckCircle2 size={11} /> : action === "dismiss" ? <XCircle size={11} /> : <ArrowUpCircle size={11} />}
                  Apply {action}
                </button>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {action === "escalate" ? "Escalation creates an ApprovalTask with SLA." : "Resolved/dismissed conflicts also close matching inconsistency flags."}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading conflict data...</div>}
    </div>
  );
}

function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function severityColor(level) {
  if (level === "critical") return "var(--color-error)";
  if (level === "high") return "#f97316";
  if (level === "medium") return "var(--color-warning)";
  return "var(--text-muted)";
}

const inputStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  outline: "none",
};
