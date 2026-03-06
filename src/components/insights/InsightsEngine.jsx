import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Zap, TrendingUp, AlertTriangle, GitCompare, Lightbulb, RefreshCw,
  ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle, Clock, Sparkles, Target, BarChart3, AlertCircle
} from "lucide-react";

const ENGINE_MODES = [
  { id: "trends", label: "Trend Analysis", icon: TrendingUp, color: "#40c4ff", desc: "Year-over-year momentum across categories" },
  { id: "anomalies", label: "Anomaly Detection", icon: AlertTriangle, color: "#ffab40", desc: "Outliers & unexpected data points" },
  { id: "disparities", label: "Disparity Scan", icon: GitCompare, color: "#ff6b6b", desc: "Métis vs BC benchmark gaps" },
  { id: "actions", label: "Action Suggestions", icon: Target, color: "#2ed573", desc: "AI-recommended next steps" },
];

function StatBadge({ value, good = "up" }) {
  const num = Number(value);
  if (isNaN(num)) return null;
  const up = num > 0;
  const neutral = num === 0;
  const isGood = (good === "up" && up) || (good === "down" && !up && !neutral);
  const color = neutral ? "var(--text-muted)" : isGood ? "var(--color-success)" : "var(--color-error)";
  const Icon = neutral ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold" style={{ color }}>
      <Icon size={11} />
      {Math.abs(num).toFixed(1)}%
    </span>
  );
}

function FindingCard({ finding, onInvestigate }) {
  const [expanded, setExpanded] = useState(false);
  const severityColor = { high: "#ff4757", medium: "#ffab40", low: "#40c4ff", info: "#a78bfa" }[finding.severity] || "#8b8fa8";
  const typeConfig = ENGINE_MODES.find(m => m.id === finding.engine_type) || ENGINE_MODES[0];

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: "var(--bg-elevated)", border: `1px solid ${severityColor}33` }}>
      {/* Header */}
      <button className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${typeConfig.color}15`, border: `1px solid ${typeConfig.color}33` }}>
          <typeConfig.icon size={14} style={{ color: typeConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{finding.title}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
              style={{ background: `${severityColor}20`, color: severityColor, fontSize: 9, letterSpacing: "0.06em" }}>
              {finding.severity}
            </span>
          </div>
          <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{finding.summary}</div>
          {finding.metric_name && (
            <div className="flex items-center gap-3 mt-2">
              <span className="tag">{finding.metric_name}</span>
              {finding.region && <span className="tag">{finding.region}</span>}
              {finding.change_pct != null && <StatBadge value={finding.change_pct} good={finding.higher_is_worse ? "down" : "up"} />}
            </div>
          )}
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="pt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {finding.detail}
          </div>
          {finding.actions?.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}>Suggested Actions</div>
              <ul className="space-y-1.5">
                {finding.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <CheckCircle size={12} className="mt-0.5 shrink-0" style={{ color: "#2ed573" }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => onInvestigate(finding)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: `${typeConfig.color}15`, color: typeConfig.color, border: `1px solid ${typeConfig.color}33` }}
            onMouseOver={e => e.currentTarget.style.background = `${typeConfig.color}25`}
            onMouseOut={e => e.currentTarget.style.background = `${typeConfig.color}15`}>
            <Sparkles size={11} /> Investigate Further
          </button>
        </div>
      )}
    </div>
  );
}

export default function InsightsEngine({ metrics = [], onGenerateInsight }) {
  const [activeMode, setActiveMode] = useState("trends");
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);

  // Local pre-computed findings (fast, no AI)
  const localFindings = useMemo(() => {
    if (!metrics.length) return { trends: [], anomalies: [], disparities: [], actions: [] };

    // --- TRENDS: year-over-year ---
    const byNameRegion = {};
    for (const m of metrics) {
      const key = `${m.name}||${m.region}`;
      if (!byNameRegion[key]) byNameRegion[key] = [];
      byNameRegion[key].push(m);
    }
    const trends = [];
    for (const [key, pts] of Object.entries(byNameRegion)) {
      if (pts.length < 2) continue;
      const sorted = [...pts].sort((a, b) => a.year - b.year);
      const first = sorted[0], last = sorted[sorted.length - 1];
      if (first.value == null || last.value == null || first.year === last.year) continue;
      const changePct = ((last.value - first.value) / Math.abs(first.value || 1)) * 100;
      if (Math.abs(changePct) < 3) continue;
      const [name, region] = key.split("||");
      trends.push({
        id: key, engine_type: "trends",
        title: `${Math.abs(changePct).toFixed(0)}% ${changePct > 0 ? "increase" : "decrease"} in ${name}`,
        summary: `${name} moved from ${first.value} to ${last.value} (${first.year}–${last.year}) in ${region}.`,
        detail: `${name} in ${region} showed a ${changePct > 0 ? "rising" : "declining"} trend from ${first.year} to ${last.year}, moving from ${first.value} to ${last.value} ${last.unit || ""}. This represents a ${Math.abs(changePct).toFixed(1)}% change over ${last.year - first.year} year(s). Monitoring this trajectory is important for Métis health planning.`,
        metric_name: name, region, change_pct: changePct,
        higher_is_worse: name.toLowerCase().includes("mortality") || name.toLowerCase().includes("diabetes") || name.toLowerCase().includes("rate") || name.toLowerCase().includes("death"),
        severity: Math.abs(changePct) > 25 ? "high" : Math.abs(changePct) > 10 ? "medium" : "low",
        actions: [`Review ${name} data sources for ${region}`, `Flag for trend analysis in next policy cycle`, `Compare with BC general population benchmark`],
      });
    }

    // --- ANOMALIES: statistical outliers ---
    const byCategory = {};
    for (const m of metrics) { if (m.category) { byCategory[m.category] = byCategory[m.category] || []; byCategory[m.category].push(m); } }
    const anomalies = [];
    for (const [cat, items] of Object.entries(byCategory)) {
      const vals = items.map(m => m.value).filter(v => v != null);
      if (vals.length < 4) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
      for (const m of items) {
        if (m.value == null) continue;
        const z = Math.abs((m.value - mean) / (std || 1));
        if (z > 2.2) {
          anomalies.push({
            id: m.id, engine_type: "anomalies",
            title: `Outlier detected: ${m.name}`,
            summary: `Value ${m.value} ${m.unit || ""} is ${z.toFixed(1)} standard deviations from the ${cat} average (${mean.toFixed(1)}).`,
            detail: `${m.name} (${m.region || "BC"}, ${m.year}) has a value of ${m.value} ${m.unit || ""}, which sits ${z.toFixed(1)} standard deviations from the mean across ${cat.replace(/_/g, " ")} metrics (μ=${mean.toFixed(1)}, σ=${std.toFixed(1)}). This may indicate a genuine disparity, a data quality issue, or an area needing immediate attention.`,
            metric_name: m.name, region: m.region,
            severity: z > 3 ? "high" : "medium",
            actions: [`Verify data quality for ${m.name}`, `Investigate root causes driving this outlier`, `Cross-reference with comparable data sources`],
          });
        }
      }
    }

    // --- DISPARITIES: Métis vs comparison ---
    const disparities = [];
    for (const m of metrics) {
      if (m.value == null || m.comparison_value == null) continue;
      const gap = ((m.value - m.comparison_value) / Math.abs(m.comparison_value || 1)) * 100;
      if (Math.abs(gap) < 10) continue;
      disparities.push({
        id: m.id + "-disp", engine_type: "disparities",
        title: `${Math.abs(gap).toFixed(0)}% gap: ${m.name}`,
        summary: `Métis value ${m.value} vs BC benchmark ${m.comparison_value}. Gap of ${gap > 0 ? "+" : ""}${gap.toFixed(1)}%.`,
        detail: `${m.name} (${m.region || "BC"}, ${m.year}) shows a Métis rate of ${m.value} ${m.unit || ""} compared to the BC general population benchmark of ${m.comparison_value} ${m.unit || ""}. This ${Math.abs(gap).toFixed(1)}% disparity represents a significant equity concern and warrants policy-level attention.`,
        metric_name: m.name, region: m.region, change_pct: gap, higher_is_worse: gap > 0,
        severity: Math.abs(gap) > 40 ? "high" : Math.abs(gap) > 20 ? "medium" : "low",
        actions: [`Prioritize ${m.name} in next funding cycle`, `Investigate root causes of the disparity`, `Set a measurable reduction target in policy planning`],
      });
    }

    // --- ACTIONS: coverage / data gap recommendations ---
    const categoryCount = Object.keys(byCategory).length;
    const actions = [
      categoryCount < 5 && {
        id: "act-coverage", engine_type: "actions",
        title: "Expand metric coverage across categories",
        summary: `Only ${categoryCount} categories have data. Key areas may be unmonitored.`,
        detail: `The current dataset covers ${categoryCount} health categories. Gaps in mental health, maternal health, or social determinants could leave important Métis health stories untold. Broadening data collection would improve the completeness of this platform.`,
        severity: "medium",
        actions: ["Audit missing health categories", "Engage data partners for coverage gaps", "Prioritize categories relevant to Métis Nation priorities"],
      },
      trends.filter(t => t.severity === "high").length > 0 && {
        id: "act-hightrend", engine_type: "actions",
        title: `${trends.filter(t => t.severity === "high").length} high-severity trends need review`,
        summary: "Rapid changes detected in key metrics — policy response may be required.",
        detail: "Multiple metrics are showing high-magnitude year-over-year changes. These require immediate policy review to determine whether they represent genuine health improvements/declines or data issues.",
        severity: "high",
        actions: ["Schedule policy review meeting", "Generate detailed trend analysis report", "Flag for inclusion in next health report"],
      },
      disparities.filter(d => d.severity === "high").length > 0 && {
        id: "act-disp", engine_type: "actions",
        title: `${disparities.filter(d => d.severity === "high").length} critical disparity gaps identified`,
        summary: "Significant Métis-to-BC gaps present — equity interventions recommended.",
        detail: "Several health indicators show very large disparities between Métis and the general BC population. These represent the highest-priority areas for health equity intervention and advocacy.",
        severity: "high",
        actions: ["Develop disparity reduction targets", "Engage MNBC health policy team", "Include in next health equity report"],
      },
    ].filter(Boolean);

    return {
      trends: trends.sort((a, b) => Math.abs(b.change_pct || 0) - Math.abs(a.change_pct || 0)).slice(0, 12),
      anomalies: anomalies.sort((a, b) => (b.severity === "high" ? 1 : 0) - (a.severity === "high" ? 1 : 0)).slice(0, 10),
      disparities: disparities.sort((a, b) => Math.abs(b.change_pct || 0) - Math.abs(a.change_pct || 0)).slice(0, 12),
      actions,
    };
  }, [metrics]);

  const runAIScan = async () => {
    if (!metrics.length) return;
    setScanning(true);
    setError(null);
    try {
      const sample = metrics.slice(0, 80).map(m =>
        `${m.name} | ${m.category} | ${m.region} | ${m.year} | value:${m.value} ${m.unit || ""} | benchmark:${m.comparison_value ?? "N/A"}`
      ).join("\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior Métis health data analyst. Analyze these health metrics and return exactly 6 prioritized findings (mix of trends, anomalies, and disparity alerts) for Métis health policy makers.

METRICS:
${sample}

For each finding return: title, summary (1 sentence), detail (2-3 sentences with specific data), engine_type (one of: trends/anomalies/disparities/actions), severity (high/medium/low), metric_name, region, actions (array of 2-3 specific actions).`,
        response_json_schema: {
          type: "object",
          properties: {
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  detail: { type: "string" },
                  engine_type: { type: "string" },
                  severity: { type: "string" },
                  metric_name: { type: "string" },
                  region: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                }
              }
            }
          }
        }
      });

      const aiFindings = (result.findings || []).map((f, i) => ({ ...f, id: `ai-${i}` }));
      setFindings(aiFindings);
      setHasScanned(true);
      setLastScanned(new Date());
    } catch (e) {
      setError(e.message);
    }
    setScanning(false);
  };

  const handleInvestigate = (finding) => {
    if (onGenerateInsight) {
      onGenerateInsight(`Investigate: ${finding.title}. ${finding.summary}`, finding.engine_type === "trends" ? "trend_analysis" : finding.engine_type === "anomalies" ? "anomaly" : finding.engine_type === "disparities" ? "comparison" : "recommendation");
    }
  };

  const displayed = hasScanned
    ? findings.filter(f => !activeMode || f.engine_type === activeMode)
    : localFindings[activeMode] || [];

  const counts = hasScanned
    ? ENGINE_MODES.reduce((acc, m) => { acc[m.id] = findings.filter(f => f.engine_type === m.id).length; return acc; }, {})
    : { trends: localFindings.trends.length, anomalies: localFindings.anomalies.length, disparities: localFindings.disparities.length, actions: localFindings.actions.length };

  const totalHighSeverity = displayed.filter(f => f.severity === "high").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Engine Header */}
      <div className="px-6 py-4 shrink-0 border-b relative overflow-hidden"
        style={{ borderColor: "var(--border-default)", background: "linear-gradient(135deg, rgba(64,196,255,0.06) 0%, rgba(46,213,115,0.04) 100%)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #40c4ff 0%, #2ed573 50%, #FEDD00 100%)" }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(64,196,255,0.2), rgba(46,213,115,0.1))", border: "1px solid rgba(64,196,255,0.3)" }}>
              <Zap size={16} style={{ color: "#40c4ff" }} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Insights Engine</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {metrics.length} metrics loaded · {hasScanned ? `AI scan complete` : "Local analysis active"}
                {lastScanned && <span> · last scanned {lastScanned.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={runAIScan}
            disabled={scanning || !metrics.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: scanning ? "var(--bg-overlay)" : "linear-gradient(135deg, #40c4ff20, #2ed57315)", color: scanning ? "var(--text-muted)" : "#40c4ff", border: "1px solid rgba(64,196,255,0.3)" }}
            onMouseOver={e => !scanning && (e.currentTarget.style.background = "rgba(64,196,255,0.2)")}
            onMouseOut={e => !scanning && (e.currentTarget.style.background = "linear-gradient(135deg, #40c4ff20, #2ed57315)")}>
            {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {scanning ? "Scanning..." : "Run AI Scan"}
          </button>
        </div>

        {totalHighSeverity > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.25)" }}>
            <AlertCircle size={13} style={{ color: "#ff4757" }} />
            <span className="text-xs font-semibold" style={{ color: "#ff4757" }}>
              {totalHighSeverity} high-severity finding{totalHighSeverity > 1 ? "s" : ""} require attention
            </span>
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b shrink-0 overflow-x-auto"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        {ENGINE_MODES.map(mode => (
          <button key={mode.id} onClick={() => setActiveMode(mode.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0"
            style={{
              background: activeMode === mode.id ? `${mode.color}15` : "transparent",
              color: activeMode === mode.id ? mode.color : "var(--text-muted)",
              border: `1px solid ${activeMode === mode.id ? `${mode.color}44` : "transparent"}`,
            }}>
            <mode.icon size={12} />
            {mode.label}
            {counts[mode.id] > 0 && (
              <span className="px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: `${mode.color}25`, color: mode.color, fontSize: 9 }}>
                {counts[mode.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="p-3 rounded-lg text-xs" style={{ background: "rgba(255,23,68,0.08)", color: "#ff4757", border: "1px solid rgba(255,23,68,0.2)" }}>
            AI scan error: {error}. Showing local analysis instead.
          </div>
        )}

        {!hasScanned && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2"
            style={{ background: "rgba(64,196,255,0.06)", border: "1px solid rgba(64,196,255,0.2)" }}>
            <Clock size={11} style={{ color: "#40c4ff" }} />
            <span className="text-xs" style={{ color: "#40c4ff" }}>
              Showing statistical analysis — run <strong>AI Scan</strong> for deeper LLM-powered findings
            </span>
          </div>
        )}

        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 size={36} className="mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
            <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No findings in this category</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
              {metrics.length === 0 ? "Load metrics data to begin analysis" : "Try running an AI Scan for deeper insights"}
            </div>
          </div>
        ) : (
          displayed.map(finding => (
            <FindingCard key={finding.id} finding={finding} onInvestigate={handleInvestigate} />
          ))
        )}
      </div>
    </div>
  );
}