import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Download, FileText, BarChart3, Table, RefreshCw, CheckCircle, ShieldCheck, HelpCircle, Sparkles } from "lucide-react";
import { listAllHealthMetrics } from "@/lib/healthMetrics";
import CockpitShell from "@/components/shell/CockpitShell";
import ZoneHeader from "@/components/shell/ZoneHeader";

const EXPORT_FORMATS = [
  { id: "csv", label: "CSV", desc: "Comma-separated values — compatible with Excel, SPSS, R", icon: Table, color: "#FEDD00" },
  { id: "json", label: "JSON", desc: "Structured JSON data for developers and APIs", icon: FileText, color: "#40c4ff" },
  { id: "memo_request", label: "Decision Memo (Approval Queue)", desc: "Generate a decision memo and route it to human approval before publish/export", icon: ShieldCheck, color: "#a78bfa" },
  { id: "approved_memo", label: "Latest Approved Memo", desc: "Export the latest approved decision memo for stakeholder circulation", icon: BarChart3, color: "#00e676" },
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

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => metrics.filter(m => {
    const okCat = filters.category === "all" || m.category === filters.category;
    const okReg = filters.region === "all" || m.region === filters.region;
    const okYr = filters.year === "all" || String(m.year) === filters.year;
    return okCat && okReg && okYr;
  }), [metrics, filters]);

  const cats = useMemo(() => [...new Set(metrics.map(m => m.category))].filter(Boolean), [metrics]);
  const regions = useMemo(() => [...new Set(metrics.map(m => m.region))].filter(Boolean), [metrics]);
  const years = useMemo(() => [...new Set(metrics.map(m => m.year))].filter(Boolean).sort((a, b) => b - a), [metrics]);

  const STAT_CARDS = [
    { id: "total", label: "Total Records", value: metrics.length.toLocaleString(), color: "#FEDD00", bg: "rgba(254,221,0,0.08)", icon: Table, desc: "Available for export", tooltip: "Total number of health metric records available in the repository. Filters narrow this set." },
    { id: "scope", label: "Filter Scope", value: filtered.length.toLocaleString(), color: "#40c4ff", bg: "rgba(64,196,255,0.08)", icon: FileText, desc: filtered.length !== metrics.length ? "Filtered subset" : "All records", tooltip: "Records currently in scope based on category, region, and year filters. This is what will be exported." },
    { id: "memos", label: "Approved Memos", value: approvedMemos.length, color: "#00e676", bg: "rgba(0,230,118,0.08)", icon: ShieldCheck, desc: approvedMemos[0] ? `Latest: ${new Date(approvedMemos[0].approved_date || approvedMemos[0].updated_date).toLocaleDateString("en-CA")}` : "No memos yet", tooltip: "Decision memos that have passed the human approval gate and are ready to share externally." },
    { id: "format", label: "Selected Format", value: EXPORT_FORMATS.find(f => f.id === format)?.label || "—", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", icon: Download, desc: "Ready to run", tooltip: "The export format currently selected. CSV/JSON export raw data; memo formats route through approval workflow." },
  ];

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
    <CockpitShell
      icon={<Download size={16} style={{ color: "var(--mnbc-yellow)" }} />}
      title="Export & Publish"
      subtitle="Export raw data, or route policy narratives through approval workflow before publication"
      actions={
        <button onClick={handleExport} disabled={generating || loading || (filtered.length === 0 && format !== "approved_memo")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: done ? "var(--color-success)" : "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)",
            color: "#04245a",
            boxShadow: "0 4px 14px rgba(254,221,0,0.3)"
          }}>
          {generating ? <RefreshCw size={12} className="animate-spin" /> : done ? <CheckCircle size={12} /> : <Download size={12} />}
          {generating ? "Processing..." : done ? "Completed" : `Run ${EXPORT_FORMATS.find(f => f.id === format)?.label}`}
        </button>
      }
    >
      {/* Stat strip */}
      <div className="mb-3">
        <div className="dashboard-section-label mb-2">Export Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {STAT_CARDS.map(card => (
            <div key={card.id} className="relative overflow-hidden group" title={card.tooltip}
              style={{
                background: `linear-gradient(135deg, ${card.bg} 0%, var(--bg-elevated) 100%)`,
                border: `1.5px solid ${card.color}33`,
                cursor: "help", padding: 12, borderRadius: 10,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.35)",
              }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.color} 0%, transparent 100%)` }} />
              <div className="flex items-start justify-between mb-2 relative z-10">
                <span className="font-semibold uppercase tracking-wider leading-tight" style={{ color: "var(--text-secondary)", fontSize: "9px", letterSpacing: "0.05em" }}>{card.label}</span>
                <div className="flex items-center gap-1">
                  <div className="p-1.5 rounded-md shrink-0 transition-all group-hover:scale-110" style={{ background: card.bg, boxShadow: `0 0 8px ${card.color}22` }}>
                    <card.icon size={12} style={{ color: card.color, strokeWidth: 2.5 }} />
                  </div>
                  <HelpCircle size={10} style={{ color: card.color, opacity: 0.5 }} />
                </div>
              </div>
              <div className="font-black mb-1 relative z-10 leading-none truncate" style={{ color: card.color, textShadow: `0 2px 8px ${card.color}18`, fontSize: 22 }}>{card.value}</div>
              <div className="leading-snug relative z-10 truncate" style={{ color: "var(--text-secondary)", fontSize: "10.5px" }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-zone cockpit */}
      <div className="cockpit-zone-grid">

        {/* Left: Format + filters */}
        <div className="cockpit-zone">
          <ZoneHeader label="Configure" title="Export Settings" count={`${filtered.length} records`} hint="format · filters" />

          {/* Format picker */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Export Format</div>
            <div className="space-y-2 relative z-10">
              {EXPORT_FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                  style={{
                    background: format === f.id ? `linear-gradient(135deg, ${f.color}14 0%, var(--bg-overlay) 100%)` : "var(--bg-overlay)",
                    border: `1.5px solid ${format === f.id ? f.color + "55" : "var(--border-subtle)"}`,
                  }}>
                  <div className="p-1.5 rounded-md shrink-0" style={{ background: f.color + "18", border: `1px solid ${f.color}33` }}>
                    <f.icon size={14} style={{ color: f.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: format === f.id ? f.color : "var(--text-primary)" }}>{f.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Memo policy question */}
          {format === "memo_request" && (
            <div className="cockpit-widget-card">
              <div className="dashboard-section-label relative z-10">Policy Question</div>
              <div className="relative z-10">
                <textarea rows={3} value={policyQuestion} onChange={e => setPolicyQuestion(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded outline-none"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  The AI will generate a memo answering this question using filtered data, then route it for human approval.
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Filter Data</div>
            <div className="grid grid-cols-3 gap-3 relative z-10">
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
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                    <option value="all">All</option>
                    {f.options.map(o => <option key={o} value={String(o)}>{String(o).replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg mt-3 relative z-10"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Records in filter scope</span>
              <span className="text-lg font-bold" style={{ color: "var(--accent-primary)" }}>
                {loading ? "—" : filtered.length.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Insights */}
        <div className="cockpit-zone">
          <ZoneHeader label="Insights" title="Governance & Tips" count={`${approvedMemos.length} approved`} hint="policy + guidance" />

          {/* Human gate notice */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label flex items-center gap-1.5 relative z-10">
              <ShieldCheck size={11} style={{ color: "var(--accent-primary)" }} />
              Human Gate Policy
            </div>
            <p className="text-xs relative z-10" style={{ color: "var(--text-secondary)" }}>
              High-impact narrative outputs (decision memos, recommendations) must be approved in <span style={{ color: "var(--accent-primary)" }}>Approvals Inbox</span> before being exported for stakeholder use. Raw CSV/JSON exports are not gated.
            </p>
          </div>

          {/* Approved memos */}
          <div className="cockpit-widget-card">
            <div className="dashboard-section-label relative z-10">Approved Memos</div>
            <div className="space-y-2 relative z-10">
              {approvedMemos.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  No approved memos yet. Submit a memo request, then approve it in Approvals Inbox.
                </p>
              ) : (
                approvedMemos.slice(0, 4).map(m => (
                  <div key={m.id} className="p-2.5 rounded-md"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate" style={{ color: "var(--color-success)" }}>{m.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                          By {m.approved_by || "—"} · {m.confidence_score != null ? `${(Number(m.confidence_score) * 100).toFixed(0)}% confidence` : ""}
                        </div>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                        {new Date(m.approved_date || m.updated_date).toLocaleDateString("en-CA")}
                      </span>
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
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Pick a format → adjust filters → click <span style={{ color: "var(--accent-primary)" }}>Run</span> to export.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span><span style={{ color: "var(--accent-primary)" }}>CSV / JSON</span> exports immediately. <span style={{ color: "var(--accent-primary)" }}>Memo Request</span> routes to approval first.</span></li>
              <li className="flex gap-2"><span style={{ color: "#FEDD00" }}>·</span><span>Once an approver signs off, return here and pick <span style={{ color: "var(--accent-primary)" }}>Latest Approved Memo</span> to download.</span></li>
            </ul>
          </div>
        </div>

      </div>
    </CockpitShell>
  );
}