import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { CheckCircle2, Clock, MessageSquare, RefreshCw, ShieldAlert, XCircle } from "lucide-react";

export default function ApprovalsInbox() {
  const { user, addLog } = useApp();
  const [tasks, setTasks] = useState([]);
  const [memos, setMemos] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [reportDocs, setReportDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [working, setWorking] = useState(false);
  const [slaSummary, setSlaSummary] = useState(null);

  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const [t, m, r, docs] = await Promise.all([
        base44.entities.ApprovalTask.filter({ status: "pending" }, "-created_date", 200).catch(() => []),
        base44.entities.DecisionMemo.filter({ approval_status: "pending" }, "-created_date", 100).catch(() => []),
        base44.entities.Recommendation.list("-updated_date", 400).catch(() => []),
        base44.entities.KnowledgeDocument.filter({ source_type: "uploaded_report" }, "-updated_date", 300).catch(() => []),
      ]);
      setTasks(t || []);
      setMemos(m || []);
      setReportDocs((docs || []).filter((d) => {
        const st = String(d.status || "").toLowerCase();
        return st === "provisional" || st === "analysis_only" || st === "review_rejected";
      }));
      setRecommendations((r || []).filter((item) => {
        const approval = String(item.approval_status || "pending").toLowerCase();
        return approval !== "approved" && approval !== "rejected";
      }));
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const overdueCount = useMemo(() => {
    const now = Date.now();
    return tasks.filter(t => t.due_date && new Date(t.due_date).getTime() < now).length;
  }, [tasks]);

  const activeMemo = useMemo(() => {
    if (!selectedTask || selectedTask.entity_type !== "DecisionMemo") return null;
    return memos.find(m => m.id === selectedTask.entity_id) || null;
  }, [selectedTask, memos]);

  const activeRecommendation = useMemo(() => {
    if (!selectedTask || selectedTask.entity_type !== "Recommendation") return null;
    return recommendations.find(r => r.id === selectedTask.entity_id) || null;
  }, [selectedTask, recommendations]);

  const activeReport = useMemo(() => {
    if (!selectedTask) return null;
    const entityType = String(selectedTask.entity_type || "");
    if (entityType !== "KnowledgeDocument" && entityType !== "ReportDocument") return null;
    return reportDocs.find((d) => d.id === selectedTask.entity_id) || null;
  }, [selectedTask, reportDocs]);

  const decide = async (action) => {
    if (!isAdmin) {
      addLog("warning", "Only admins can finalize approvals");
      return;
    }
    if (!selectedTask) return;

    setWorking(true);
    try {
      if (selectedTask.entity_type === "DecisionMemo") {
        await base44.functions.invoke("approveDecisionMemo", {
          memo_id: selectedTask.entity_id,
          action,
          reviewer_notes: reviewNotes,
        });
        addLog("success", `Memo ${action}`);
      } else if (selectedTask.entity_type === "Recommendation") {
        await base44.functions.invoke("approveRecommendation", {
          recommendation_id: selectedTask.entity_id,
          action,
          reviewer_notes: reviewNotes,
        });
        addLog("success", `Recommendation ${action}`);
      } else if (selectedTask.entity_type === "KnowledgeDocument" || selectedTask.entity_type === "ReportDocument") {
        const reportAction = action === "approve"
          ? "approve_all"
          : action === "request_changes"
            ? "request_reprocess"
            : "reject_with_reason";
        await base44.functions.invoke("reviewReportFindings", {
          report_document_id: selectedTask.entity_id,
          action: reportAction,
          reviewer_notes: reviewNotes,
          auto_run_worker: action === "request_changes",
        });
        if (action === "approve") {
          await base44.functions.invoke("publishReportFindings", {
            report_document_id: selectedTask.entity_id,
            include_metrics: true,
            include_insight: true,
          });
        }
        addLog("success", `Report findings ${action}`);
      } else {
        addLog("warning", `Unsupported approval type: ${selectedTask.entity_type || "unknown"}`);
      }
      setReviewNotes("");
      setSelectedTask(null);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const runSlaEscalation = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("runApprovalSLAEscalation", { warning_window_hours: 24 });
      setSlaSummary(res.data);
      addLog("success", `SLA monitor: ${res.data?.near_due || 0} near due, ${res.data?.overdue || 0} overdue`);
      await load();
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
            <ShieldAlert size={14} style={{ color: "var(--accent-primary)" }} />
            Approvals Inbox
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Human-gate queue for decision memos and high-impact AI outputs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runSlaEscalation} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--accent-primary)", color: "#000" }}>
            {working ? <RefreshCw size={12} className="animate-spin" /> : <Clock size={12} />} Run SLA Check
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Pending Tasks" value={tasks.length} color="var(--accent-primary)" />
        <StatCard label="Pending Memos" value={memos.length} color="var(--color-warning)" />
        <StatCard label="Pending Recommendations" value={recommendations.length} color="var(--color-info)" />
        <StatCard label="Pending Reports" value={reportDocs.length} color="var(--color-info)" />
        <StatCard label="Overdue" value={overdueCount} color="var(--color-error)" />
      </div>

      {slaSummary && (
        <div className="rounded p-3 text-xs" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)", color: "var(--text-secondary)" }}>
          SLA Check: scanned {slaSummary.scanned || 0}, near due {slaSummary.near_due || 0}, overdue {slaSummary.overdue || 0}, escalated {slaSummary.escalated_count || 0}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Approval Tasks</div>
          <div className="space-y-1 max-h-[420px] overflow-auto">
            {tasks.map(t => {
              const overdue = t.due_date && new Date(t.due_date).getTime() < Date.now();
              return (
                <button key={t.id} onClick={() => { setSelectedTask(t); setReviewNotes(""); }} className="w-full text-left p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: selectedTask?.id === t.id ? "var(--bg-hover)" : "var(--bg-overlay)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{t.title || `Task ${t.id.slice(-6)}`}</div>
                    {overdue ? <span className="tag" style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}>Overdue</span> : <span className="tag">Pending</span>}
                  </div>
                  <div className="text-xs mt-1">
                    <span className="tag">{t.entity_type || "Unknown"}</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Due: {t.due_date ? new Date(t.due_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    {t.assigned_to_email ? ` · ${t.assigned_to_email}` : ""}
                  </div>
                </button>
              );
            })}
            {!tasks.length && !loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No pending tasks.</div>}
          </div>
        </div>

        <div className="metric-card">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {selectedTask?.entity_type === "Recommendation"
              ? "Recommendation Review"
              : (selectedTask?.entity_type === "KnowledgeDocument" || selectedTask?.entity_type === "ReportDocument")
                ? "Report Review"
                : "Memo Review"}
          </div>
          {!selectedTask ? (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Select a task to open the linked item.</div>
          ) : !activeMemo && !activeRecommendation && !activeReport ? (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Linked entity not found. It may have been removed.</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded p-3" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                {activeMemo && (
                  <>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{activeMemo.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Confidence: {(Number(activeMemo.confidence_score || 0) * 100).toFixed(0)}% · Status: {activeMemo.approval_status}
                    </div>
                  </>
                )}
                {activeRecommendation && (
                  <>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{activeRecommendation.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Type: {activeRecommendation.recommendation_type || "policy"} · Priority: {activeRecommendation.priority_score ?? "n/a"} · Confidence: {activeRecommendation.confidence_score != null ? `${(Number(activeRecommendation.confidence_score) * 100).toFixed(0)}%` : "n/a"}
                    </div>
                  </>
                )}
                {activeReport && (
                  <>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{activeReport.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Status: {activeReport.status || "provisional"} · Source: {activeReport.source_type || "uploaded_report"}
                    </div>
                  </>
                )}
              </div>
              {activeMemo && (
                <pre className="text-xs whitespace-pre-wrap p-3 rounded max-h-64 overflow-auto" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  {JSON.stringify(activeMemo.content || {}, null, 2)}
                </pre>
              )}
              {activeRecommendation && (
                <div className="text-xs whitespace-pre-wrap p-3 rounded max-h-64 overflow-auto" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  {activeRecommendation.summary || "No recommendation summary."}
                </div>
              )}
              {activeReport && (
                <pre className="text-xs whitespace-pre-wrap p-3 rounded max-h-64 overflow-auto" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  {JSON.stringify((() => {
                    try { return JSON.parse(activeReport.content || "{}"); } catch { return { summary: activeReport.summary }; }
                  })(), null, 2)}
                </pre>
              )}
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Reviewer Notes</label>
                <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} style={inputStyle} placeholder="Reasoning, constraints, follow-up actions..." />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => decide("approve")} disabled={working || !isAdmin} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium" style={{ background: "var(--color-success)", color: "#fff" }}>
                  <CheckCircle2 size={11} /> Approve
                </button>
                <button onClick={() => decide("request_changes")} disabled={working || !isAdmin} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--color-warning)", color: "#000" }}>
                  <MessageSquare size={11} /> Request Changes
                </button>
                <button onClick={() => decide("reject")} disabled={working || !isAdmin} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--color-error)", color: "#fff" }}>
                  <XCircle size={11} /> Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="animate-spin" /> Loading approvals...</div>}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="metric-card">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

const inputStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  fontSize: 12,
  outline: "none",
};
