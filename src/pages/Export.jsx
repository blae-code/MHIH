import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Download, FileText, BarChart3, Table, RefreshCw, CheckCircle, ShieldCheck, Clock } from "lucide-react";
import { listAllHealthMetrics } from "@/lib/healthMetrics";

const EXPORT_FORMATS = [
  { id: "csv", label: "CSV", desc: "Comma-separated values — compatible with Excel, SPSS, R", icon: Table },
  { id: "json", label: "JSON", desc: "Structured JSON data for developers and APIs", icon: FileText },
  { id: "memo_request", label: "Decision Memo (Approval Queue)", desc: "Generate a decision memo and route it to human approval before publish/export", icon: ShieldCheck },
  { id: "approved_memo", label: "Latest Approved Memo", desc: "Export the latest approved decision memo for stakeholder circulation", icon: BarChart3 },
];

export default function Export() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [approvedMemos, setApprovedMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState("csv");
  const [filters, setFilters] = useState({ category: "all", region: "all", year: "all" });
  const [policyQuestion, setPolicyQuestion] = useState("Summarize key risks, disparities, and near-term policy actions for this filtered data.");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [metricData, memoData] = await Promise.all([
        listAllHealthMetrics().catch(() => []),
        base44.entities.DecisionMemo.filter({ approval_status: "approved" }, "-approved_date", 50).catch(() => []),
      ]);
      setMetrics(metricData || []);
      setApprovedMemos(memoData || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = metrics.filter(m => {
    const okCat = filters.category === "all" || m.category === filters.category;
    const okReg = filters.region === "all" || m.region === filters.region;
    const okYr = filters.year === "all" || String(m.year) === filters.year;
    return okCat && okReg && okYr;
  });

  const cats = [...new Set(metrics.map(m => m.category))].filter(Boolean);
  const regions = [...new Set(metrics.map(m => m.region))].filter(Boolean);
  const years = [...new Set(metrics.map(m => m.year))].filter(Boolean).sort((a, b) => b - a);

  const handleExport = async () => {
    setGenerating(true);
    setDone(false);
    try {
      if (format === "csv") {
        const headers = ["Name", "Category", "Region", "Year", "Value", "Unit", "Comparison Value", "Confidence", "Source", "Notes", "Evidence Grade", "Freshness", "Version"];
        const rows = [headers, ...filtered.map(m => [
          m.name, m.category, m.region, m.year, m.value, m.unit || "",
          m.comparison_value || "", m.confidence_level || "", m.data_source_name || "", m.notes || "",
          m.evidence_grade || "", m.freshness_score ?? "", m.version ?? "",
        ])];
        const csv = rows.map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
        download(new Blob([csv], { type: "text/csv" }), "metis_health_metrics.csv");
        addLog("success", `Exported ${filtered.length} records as CSV`);
      } else if (format === "json") {
        const json = JSON.stringify({
          exported: new Date().toISOString(),
          count: filtered.length,
          governance: {
            human_gate: true,
            note: "High-impact narrative outputs must pass approval before publish/export.",
          },
          data: filtered,
        }, null, 2);
        download(new Blob([json], { type: "application/json" }), "metis_health_metrics.json");
        addLog("success", `Exported ${filtered.length} records as JSON`);
      } else if (format === "memo_request") {
        const result = await base44.functions.invoke("generateDecisionMemo", {
          title: `Decision Memo Request — ${new Date().toLocaleDateString("en-CA")}`,
          policy_question: policyQuestion,
          category: filters.category,
          region: filters.region,
          include_recent_alerts: true,
          reuse_window_hours: 24,
          max_metric_rows: 35,
          max_recommendation_rows: 6,
          max_alert_rows: 6,
        });
        addLog("success", `Memo queued for approval (task ${String(result.data?.approval_task_id || "").slice(0, 8)})`);
      } else if (format === "approved_memo") {
        const latest = approvedMemos[0];
        if (!latest) {
          addLog("warning", "No approved memo available yet. Submit a memo request and approve it in Approvals Inbox.");
        } else {
          const content = typeof latest.content === "string" ? latest.content : JSON.stringify(latest.content, null, 2);
          const text = [
            "BC METIS HEALTH INTELLIGENCE PLATFORM",
            `DECISION MEMO — ${latest.title}`,
            `APPROVED: ${latest.approved_date ? new Date(latest.approved_date).toLocaleString("en-CA") : "n/a"}`,
            `APPROVED BY: ${latest.approved_by || "n/a"}`,
            `CONFIDENCE: ${latest.confidence_score != null ? `${(Number(latest.confidence_score) * 100).toFixed(0)}%` : "n/a"}`,
            "",
            content,
          ].join("\n");
          download(new Blob([text], { type: "text/plain" }), `approved_decision_memo_${new Date().toISOString().slice(0, 10)}.txt`);
          addLog("success", "Exported latest approved decision memo");
        }
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      await load();
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setGenerating(false);
    }
  };

  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Export & Publish</h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Export raw data directly, or route policy narratives through approval workflow before publication.
        </p>
      </div>

      <div className="rounded-lg p-3" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)" }}>
        <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--accent-primary)" }}>
          <ShieldCheck size={12} /> Human Gate Policy
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          High-impact narrative outputs (decision memos/recommendations) must be approved in Approvals Inbox before stakeholder export.
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Export Format</div>
        {EXPORT_FORMATS.map(f => (
          <button key={f.id} onClick={() => setFormat(f.id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
            style={{
              background: format === f.id ? "var(--accent-muted)" : "var(--bg-elevated)",
              border: `1px solid ${format === f.id ? "var(--accent-primary)" : "var(--border-subtle)"}`,
            }}>
            <f.icon size={16} style={{ color: format === f.id ? "var(--accent-primary)" : "var(--text-muted)", flexShrink: 0 }} />
            <div>
              <div className="text-sm font-medium" style={{ color: format === f.id ? "var(--accent-primary)" : "var(--text-primary)" }}>{f.label}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {format === "memo_request" && (
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Policy Question for Memo</label>
          <textarea rows={3} value={policyQuestion} onChange={e => setPolicyQuestion(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
        </div>
      )}

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Filter Data</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "category", options: cats, label: "Category" },
            { key: "region", options: regions, label: "Region" },
            { key: "year", options: years, label: "Year" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>{f.label}</label>
              <select
                value={filters[f.key]}
                onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded outline-none"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                <option value="all">All</option>
                {f.options.map(o => <option key={o} value={String(o)}>{String(o).replace(/_/g, " ")}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Records in filter scope</span>
        <span className="text-lg font-bold" style={{ color: "var(--accent-primary)" }}>
          {loading ? "—" : filtered.length.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>Approved memos available: {approvedMemos.length}</span>
        {approvedMemos[0] && <span>Latest approved: {new Date(approvedMemos[0].approved_date || approvedMemos[0].updated_date).toLocaleDateString("en-CA")}</span>}
      </div>

      <button onClick={handleExport} disabled={generating || loading || (filtered.length === 0 && format !== "approved_memo")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50"
        style={{ background: done ? "var(--color-success)" : "var(--accent-primary)", color: "#000" }}>
        {generating ? <RefreshCw size={15} className="animate-spin" />
          : done ? <CheckCircle size={15} />
            : <Download size={15} />}
        {generating ? "Processing..." : done ? "Completed" : `Run ${EXPORT_FORMATS.find(f => f.id === format)?.label}`}
      </button>
    </div>
  );
}
