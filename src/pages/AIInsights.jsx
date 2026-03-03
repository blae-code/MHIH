import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Brain, Zap, Pin, Trash2, RefreshCw, Send, MessageSquare, TrendingUp, AlertTriangle, BarChart3, FileText } from "lucide-react";

const INSIGHT_TYPES = [
  { value: "summary", label: "Data Summary", icon: FileText },
  { value: "trend_analysis", label: "Trend Analysis", icon: TrendingUp },
  { value: "anomaly", label: "Anomaly Detection", icon: AlertTriangle },
  { value: "comparison", label: "Population Comparison", icon: BarChart3 },
  { value: "recommendation", label: "Policy Recommendation", icon: Brain },
];

export default function AIInsights() {
  const { addLog } = useApp();
  const [insights, setInsights] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [query, setQuery] = useState("");
  const [insightType, setInsightType] = useState("summary");
  const [activeInsight, setActiveInsight] = useState(null);

  const load = () => {
    Promise.all([
      base44.entities.AIInsight.list("-created_date", 50),
      base44.entities.HealthMetric.list("-year", 200),
    ]).then(([ins, met]) => {
      setInsights(ins);
      setMetrics(met);
      addLog("success", `${ins.length} insights loaded`);
    }).catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setGenerating(true);
    addLog("info", "Generating AI insight...");

    const metricsSummary = metrics.slice(0, 50).map(m =>
      `${m.name} (${m.category}, ${m.region}, ${m.year}): ${m.value} ${m.unit || ""}`
    ).join("\n");

    const prompt = `You are a senior health policy analyst specializing in Métis health and wellness in British Columbia, Canada.

Available health metrics data:
${metricsSummary}

User request (${insightType}): ${query}

Provide a professional, evidence-based analysis. Structure your response with:
1. Key findings
2. Context & significance for Métis health policy in BC
3. Data gaps or limitations
4. Actionable recommendations

Be specific, cite patterns from the data, and connect to BC Métis community health priorities.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });

    const insight = await base44.entities.AIInsight.create({
      title: query.slice(0, 80),
      content: result,
      type: insightType,
      prompt: query,
      generated_by: "AI",
    });

    setInsights(prev => [insight, ...prev]);
    setActiveInsight(insight);
    setQuery("");
    setGenerating(false);
    addLog("success", "AI insight generated");
  };

  const handlePin = async (ins) => {
    const updated = await base44.entities.AIInsight.update(ins.id, { pinned: !ins.pinned });
    setInsights(prev => prev.map(i => i.id === ins.id ? { ...i, pinned: !i.pinned } : i));
  };

  const handleDelete = async (id) => {
    await base44.entities.AIInsight.delete(id);
    setInsights(prev => prev.filter(i => i.id !== id));
    if (activeInsight?.id === id) setActiveInsight(null);
    addLog("success", "Insight removed");
  };

  const pinned = insights.filter(i => i.pinned);
  const recent = insights.filter(i => !i.pinned);

  const TypeIcon = INSIGHT_TYPES.find(t => t.value === (activeInsight?.type || insightType))?.icon || Brain;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: insight list */}
      <div className="flex flex-col border-r shrink-0"
        style={{ width: 280, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Insights</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center h-20 gap-2" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={14} className="animate-spin" />
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)", fontSize: 10 }}>Pinned</div>
                  {pinned.map(ins => <InsightListItem key={ins.id} ins={ins} active={activeInsight?.id === ins.id} onClick={setActiveInsight} />)}
                </div>
              )}
              <div>
                <div className="px-3 py-1 text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)", fontSize: 10 }}>Recent</div>
                {recent.length === 0 && (
                  <div className="px-3 py-4 text-xs" style={{ color: "var(--text-muted)" }}>Generate your first insight below.</div>
                )}
                {recent.map(ins => <InsightListItem key={ins.id} ins={ins} active={activeInsight?.id === ins.id} onClick={setActiveInsight} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Active insight view */}
        {activeInsight ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ background: "var(--accent-muted)" }}>
                    <TypeIcon size={14} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{activeInsight.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="tag">{activeInsight.type?.replace(/_/g," ")}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(activeInsight.created_date).toLocaleDateString("en-CA")}
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
              <div className="rounded-lg p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
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

        {/* Query input */}
        <div className="p-4 border-t shrink-0" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex items-center gap-2 mb-2">
              {INSIGHT_TYPES.map(t => (
                <button key={t.value} onClick={() => setInsightType(t.value)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                  style={{
                    background: insightType === t.value ? "var(--accent-muted)" : "var(--bg-elevated)",
                    color: insightType === t.value ? "var(--accent-primary)" : "var(--text-muted)",
                    border: `1px solid ${insightType === t.value ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  }}>
                  <t.icon size={11} />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <MessageSquare size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }}
                  placeholder={`Ask about Métis health data — e.g. "Summarize diabetes trends in BC Métis communities..."`}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleGenerate()}
                  disabled={generating}
                />
              </div>
              <button onClick={handleGenerate} disabled={generating || !query.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "#000" }}>
                {generating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {generating ? "Generating..." : "Generate"}
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
      className="w-full text-left px-3 py-2 transition-colors"
      style={{ background: active ? "var(--bg-hover)" : "transparent" }}
      onMouseOver={e => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <div className="flex items-center gap-2">
        <IconComp size={12} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
        <span className="text-xs truncate" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>
          {ins.title}
        </span>
        {ins.pinned && <Pin size={10} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />}
      </div>
      <div className="text-xs mt-0.5 ml-5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
        {new Date(ins.created_date).toLocaleDateString("en-CA")}
      </div>
    </button>
  );
}