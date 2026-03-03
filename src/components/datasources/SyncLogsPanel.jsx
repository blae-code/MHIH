import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight, X } from "lucide-react";

export default function SyncLogsPanel({ onClose }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    base44.entities.SyncJob.list("-created_date", 100)
      .then(data => setJobs(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  const statusIcon = (s) => {
    if (s === "success") return <CheckCircle size={12} style={{ color: "var(--color-success)" }} />;
    if (s === "failed") return <AlertCircle size={12} style={{ color: "var(--color-error)" }} />;
    if (s === "running") return <RefreshCw size={12} className="animate-spin" style={{ color: "var(--color-info)" }} />;
    return <Clock size={12} style={{ color: "var(--text-muted)" }} />;
  };

  const failedCount = jobs.filter(j => j.status === "failed").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Sync Logs</span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "rgba(248,81,73,0.15)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
                <AlertCircle size={10} /> {failedCount} failed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="activity-icon" style={{ width: 26, height: 26 }} title="Refresh">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onClose} className="activity-icon" style={{ width: 26, height: 26 }}><X size={13} /></button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          {["all", "success", "failed", "running"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded text-xs"
              style={{
                background: filter === f ? "var(--bg-hover)" : "transparent",
                color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: filter === f ? 600 : 400,
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && (
                <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  ({jobs.filter(j => j.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={16} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
              <Clock size={24} className="opacity-30" />
              <p className="text-sm">No sync jobs found.</p>
            </div>
          ) : (
            <table className="w-full data-table text-xs">
              <thead>
                <tr>
                  <th className="text-left" style={{ width: 20 }}></th>
                  <th className="text-left">Source</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Trigger</th>
                  <th className="text-right">Records</th>
                  <th className="text-right">Duration</th>
                  <th className="text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(job => (
                  <React.Fragment key={job.id}>
                    <tr onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                      style={{ cursor: "pointer" }}>
                      <td>
                        {expanded === job.id
                          ? <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
                          : <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />}
                      </td>
                      <td>
                        <div style={{ color: "var(--text-primary)" }}>{job.source_name}</div>
                        {job.source_url && <div className="truncate" style={{ color: "var(--text-muted)", fontSize: 10, maxWidth: 200 }}>{job.source_url}</div>}
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          {statusIcon(job.status)}
                          <span style={{
                            color: job.status === "success" ? "var(--color-success)"
                              : job.status === "failed" ? "var(--color-error)"
                              : job.status === "running" ? "var(--color-info)"
                              : "var(--text-muted)"
                          }}>{job.status}</span>
                        </span>
                      </td>
                      <td><span className="tag">{job.trigger || "manual"}</span></td>
                      <td className="text-right font-mono" style={{ color: "var(--accent-primary)" }}>
                        {job.records_fetched ?? "—"}
                      </td>
                      <td className="text-right" style={{ color: "var(--text-muted)" }}>
                        {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : "—"}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 10 }}>
                        {job.started_at ? new Date(job.started_at).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </td>
                    </tr>
                    {expanded === job.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div className="px-6 py-3 border-t border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)" }}>
                            {job.error_message && (
                              <div className="flex items-start gap-2 mb-3 p-2 rounded" style={{ background: "rgba(248,81,73,0.1)", border: "1px solid var(--color-error)" }}>
                                <AlertCircle size={12} style={{ color: "var(--color-error)", marginTop: 1, flexShrink: 0 }} />
                                <span className="text-xs" style={{ color: "var(--color-error)" }}>{job.error_message}</span>
                              </div>
                            )}
                            {job.log_output ? (
                              <pre className="text-xs overflow-auto rounded p-3" style={{
                                background: "var(--bg-overlay)", color: "var(--text-secondary)",
                                fontFamily: "monospace", maxHeight: 180, lineHeight: 1.6
                              }}>
                                {job.log_output}
                              </pre>
                            ) : <span className="text-xs" style={{ color: "var(--text-muted)" }}>No log output.</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}