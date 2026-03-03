import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, RefreshCw, Zap, Download, ChevronDown, ChevronUp, Pin } from "lucide-react";
import { useApp } from "../../Layout";

export default function WeeklyReports() {
  const { user, addLog } = useApp();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const isAdmin = user?.role === "admin";

  const load = async () => {
    const all = await base44.entities.AIInsight.filter(
      { generated_by: "AI Agent — Weekly Summary Report" },
      "-created_date",
      10
    );
    setReports(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setRunning(true);
    addLog("info", "Generating weekly summary report...");
    try {
      await base44.functions.invoke("agentAnomalyReport", {});
      addLog("success", "Weekly report generated");
      await load();
      setExpanded(null);
    } catch (e) {
      addLog("error", `Report generation failed: ${e.message}`);
    }
    setRunning(false);
  };

  const handleDownload = (report) => {
    const blob = new Blob([report.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog("success", "Report downloaded");
  };

  return (
    <div className="metric-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={13} style={{ color: "#a78bfa" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Weekly Summary Reports
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={handleGenerate}
            disabled={running}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
            style={{ background: running ? "var(--bg-overlay)" : "#a78bfa22", color: running ? "var(--text-muted)" : "#a78bfa", border: "1px solid #a78bfa44" }}>
            {running ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />}
            {running ? "Generating…" : "Generate Now"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6" style={{ color: "var(--text-muted)" }}>
          <RefreshCw size={13} className="animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
          No weekly reports yet.{isAdmin ? " Click Generate Now to create the first one." : ""}
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-md overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer"
                style={{ background: "var(--bg-overlay)" }}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {r.pinned && <Pin size={10} style={{ color: "#a78bfa", flexShrink: 0 }} />}
                  <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                    {new Date(r.created_date).toLocaleDateString("en-CA")}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(r); }}
                    className="activity-icon" style={{ width: 20, height: 20 }}
                    title="Download report">
                    <Download size={10} />
                  </button>
                  {expanded === r.id ? <ChevronUp size={12} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />}
                </div>
              </div>
              {expanded === r.id && (
                <div className="px-3 py-3 text-xs whitespace-pre-wrap leading-relaxed overflow-y-auto"
                  style={{ color: "var(--text-secondary)", maxHeight: 400, background: "var(--bg-surface)" }}>
                  {r.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}