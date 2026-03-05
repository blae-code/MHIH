import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Brain, Pin, Trash2, RefreshCw, Send, MessageSquare, TrendingUp, AlertTriangle, BarChart3, FileText, ShieldCheck } from "lucide-react";

const INSIGHT_TYPES = [
  { value: "summary", label: "Data Summary", icon: FileText },
  { value: "trend_analysis", label: "Trend Analysis", icon: TrendingUp },
  { value: "anomaly", label: "Anomaly Detection", icon: AlertTriangle },
  { value: "comparison", label: "Population Comparison", icon: BarChart3 },
  { value: "recommendation", label: "Policy Recommendation", icon: Brain },
];

function avgConfidence(metrics) {
  if (!metrics.length) return 0.6;
  const values = metrics.map(m => {
    const fresh = Number(m.freshness_score ?? 0.6);
    const grade = String(m.evidence_grade || "").toLowerCase();
    const gradeScore = grade === "high" ? 0.95 : grade === "moderate" ? 0.75 : grade === "low" ? 0.45 : 0.6;
    return fresh * 0.5 + gradeScore * 0.5;
  });
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function AIInsights() {
  const { addLog } = useApp();
  const [insights, setInsights] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [query, setQuery] = useState("");
  const [insightType, setInsightType] = useState("summary");
  const [activeInsight, setActiveInsight] = useState(null);
  const [approvedOnly, setApprovedOnly] = useState(false);

  const load = () => {
    Promise.all([
      base44.entities.AIInsight.list("-created_date", 120),
      base44.entities.HealthMetric.list("-year", 300),
    ]).then(([ins, met]) => {
      setInsights(ins || []);
      setMetrics(met || []);
      addLog("success", `${ins?.length || 0} insights loaded`);
    }).catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredInsights = useMemo(() => {
    if (!approvedOnly) return insights;
    return insights.filter(i => i.approval_status === "approved");
  }, [insights, approvedOnly]);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setGenerating(true);
    addLog("info", "Generating policy-grade AI insight...");

    const metricsSubset = metrics.slice(0, 60);
    const metricsSummary = metricsSubset.map(m =>
      `${m.name} (${m.category}, ${m.region}, ${m.year}): ${m.value} ${m.unit || ""} | evidence=${m.evidence_grade || "unknown"} freshness=${m.freshness_score ?? "n/a"}`
    ).join("\n");

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior health policy analyst specializing in Metis health in BC.

User request (${insightType}): ${query}

Metrics sample:
${metricsSummary}

Return: title, executive summary, findings, caveats, actions, and confidence(0-1).`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            executive_summary: { type: "string" },
            findings: { type: "array", items: { type: "string" } },
            caveats: { type: "array", items: { type: "string" } },
            actions: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
          }
        }
      });

      const confidence = Math.max(0.2, Math.min(0.95, ((Number(result.confidence || 0.6) + avgConfidence(metricsSubset)) / 2)));
      const content = [
        `Executive Summary\n${result.executive_summary || ""}`,
        `\nKey Findings\n${(result.findings || []).map(f => `- ${f}`).join("\n")}`,
        `\nCaveats\n${(result.caveats || []).map(c => `- ${c}`).join("\n")}`,
        `\nRecommended Actions\n${(result.actions || []).map(a => `- ${a}`).join("\n")}`,
      ].join("\n");

      const insight = await base44.entities.AIInsight.create({
        title: result.title || query.slice(0, 100),
        content,
        type: insightType,
        prompt: query,
        generated_by: "AI",
        confidence_score: Number(confidence.toFixed(2)),
        requires_approval: true,
        approval_status: "pending",
      });

      for (const metric of metricsSubset.slice(0, 12)) {
        await base44.entities.EvidenceLink.create({
          link_type: "insight_claim",
          metric_id: metric.id,
          metric_name: metric.name,
          source_name: metric.data_source_name || "HealthMetric",
          model_version: "insights-policy-v2",
          confidence_score: Number(confidence.toFixed(2)),
          evidence_grade: metric.evidence_grade || "moderate",
          insight_id: insight.id,
        }).catch(() => {});
      }

      const admins = await base44.entities.User.filter({ role: "admin" }, "-created_date", 5).catch(() => []);
      const due = new Date();
      due.setDate(due.getDate() + 2);
      await base44.entities.ApprovalTask.create({
        entity_type: "AIInsight",
        entity_id: insight.id,
        title: `Review AI Insight: ${insight.title}`,
        status: "pending",
        priority: confidence < 0.5 ? "high" : "medium",
        assigned_to: admins?.[0]?.id || null,
        assigned_to_email: admins?.[0]?.email || null,
        requested_by: "system-ai",
        due_date: due.toISOString(),
        sla_hours: 48,
        notes: "Human gate required before policy publication.",
      }).catch(() => {});

      setInsights(prev => [insight, ...prev]);
      setActiveInsight(insight);
      setQuery("");
      addLog("success", "Insight generated and routed to approval queue");
    } catch (e) {
      addLog("error", e.message);
    }

    setGenerating(false);
  };

  const handlePin = async (ins) => {
    await base44.entities.AIInsight.update(ins.id, { pinned: !ins.pinned });
    setInsights(prev => prev.map(i => i.id === ins.id ? { ...i, pinned: !i.pinned } : i));
  };

  const handleDelete = async (id) => {
    await base44.entities.AIInsight.delete(id);
    setInsights(prev => prev.filter(i => i.id !== id));
    if (activeInsight?.id === id) setActiveInsight(null);
    addLog("success", "Insight removed");
  };

  const pinned = filteredInsights.filter(i => i.pinned);
  const recent = filteredInsights.filter(i => !i.pinned);

  const TypeIcon = INSIGHT_TYPES.find(t => t.value === (activeInsight?.type || insightType))?.icon || Brain;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col border-r shrink-0"
        style={{ width: 320, background: "linear-gradient(to bottom, var(--bg-surface), var(--bg-elevated))", borderColor: "var(--border-default)" }}>
        <div className="px-4 py-4 border-b relative overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #a78bfa 0%, #FEDD00 60%, transparent 100%)" }} />
          <div className="flex items-center justify-between">
            <div className="dashboard-section-label" style={{ marginBottom: 0 }}>Generated Insights</div>
            <label className="text-xs flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <input type="checkbox" checked={approvedOnly} onChange={e => setApprovedOnly(e.target.checked)} style={{ accentColor: "var(--accent-primary)" }} /> approved only
            </label>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>AI-powered policy analysis</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center h-20 gap-2" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={14} className="animate-spin" />
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <div className="mb-1">
                  <div className="px-4 py-2 text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent-primary)", fontSize: 9, letterSpacing: "0.08em" }}>✓ Pinned</div>
                  {pinned.map(ins => <InsightListItem key={ins.id} ins={ins} active={activeInsight?.id === ins.id} onClick={setActiveInsight} />)}
                </div>
              )}
              <div>
                <div className="px-4 py-2 text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.08em" }}>Recent</div>
                {recent.length === 0 && (
                  <div className="px-3 py-4 text-xs" style={{ color: "var(--text-muted)" }}>No insights in current filter.</div>
                )}
                {recent.map(ins => <InsightListItem key={ins.id} ins={ins} active={activeInsight?.id === ins.id} onClick={setActiveInsight} />)}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {activeInsight ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "var(--accent-muted)" }}>
                    <TypeIcon size={14} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{activeInsight.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="tag">{activeInsight.type?.replace(/_/g, " ")}</span>
                      <span className="tag" style={{ color: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}>
                        confidence {(Number(activeInsight.confidence_score || 0) * 100).toFixed(0)}%
                      </span>
                      <span className="tag" style={{ color: activeInsight.approval_status === "approved" ? "var(--color-success)" : "var(--color-warning)", borderColor: activeInsight.approval_status === "approved" ? "var(--color-success)" : "var(--color-warning)" }}>
                        {activeInsight.approval_status || "pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handlePin(activeInsight)} className="activity-icon" title="Pin insight">
                    <Pin size={14} style={{ color: activeInsight.pinned ? "var(--accent-primary)" : "var(--text-muted)" }} />
                  </button>
                  <button onClick={() => handleDelete(activeInsight.id)} className="activity-icon" style={{ color: "var(--color-error)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(254,221,0,0.05)" }}>
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: "linear-gradient(to bottom, var(--accent-primary), transparent)", borderRadius: "8px 0 0 8px" }} />
                <div className="pl-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                  {activeInsight.content}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <Brain size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Select an insight or generate a new one below</p>
          </div>
        )}

        <div className="p-6 border-t shrink-0" style={{ background: "linear-gradient(to bottom, var(--bg-surface), var(--bg-elevated))", borderColor: "var(--border-subtle)" }}>
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {INSIGHT_TYPES.map(t => (
                <button key={t.value} onClick={() => setInsightType(t.value)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: insightType === t.value ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
                    color: insightType === t.value ? "var(--accent-primary)" : "var(--text-muted)",
                    border: `1px solid ${insightType === t.value ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  }}>
                  <t.icon size={12} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
              <span className="text-xs ml-auto flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <ShieldCheck size={11} /> Human gate enabled
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
                <MessageSquare size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }}
                  placeholder={`Ask about Metis health data (policy-focused insight)...`}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleGenerate()}
                  disabled={generating}
                />
              </div>
              <button onClick={handleGenerate} disabled={generating || !query.trim()}
                className="flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 shrink-0"
                style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 12px rgba(254,221,0,0.25)" }}>
                {generating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span className="hidden sm:inline">{generating ? "Generating..." : "Generate"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightListItem({ ins, active, onClick }) {
  const IconComp = INSIGHT_TYPES.find(t => t.value === ins.type)?.icon || Brain;
  return (
    <button onClick={() => onClick(ins)}
      className="w-full text-left px-3 py-2.5 mx-1 transition-all rounded-lg"
      style={{ 
        background: active ? "rgba(254,221,0,0.08)" : "transparent",
        borderLeft: active ? "2px solid var(--accent-primary)" : "2px solid transparent"
      }}
      onMouseOver={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <div className="flex items-center gap-2 min-w-0">
        <IconComp size={12} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
        <span className="text-xs truncate font-medium" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>
          {ins.title}
        </span>
        {ins.pinned && <Pin size={9} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />}
      </div>
      <div className="text-xs mt-0.5 ml-5 flex items-center gap-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>
        <span>{new Date(ins.created_date).toLocaleDateString("en-CA")}</span>
        <span style={{ color: ins.approval_status === "approved" ? "var(--color-success)" : "var(--color-warning)" }}>{ins.approval_status || "pending"}</span>
      </div>
    </button>
  );
}