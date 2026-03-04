import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Bot, Zap, RefreshCw, CheckCircle, AlertCircle, Clock,
  TrendingUp, ShieldCheck, FileText, GitCompare, Search, ChevronDown, ChevronRight, Telescope, ListOrdered
} from "lucide-react";

const AGENTS = [
  {
    key: "insight_generation",
    fn: "agentInsightGeneration",
    name: "Insight Generator",
    icon: TrendingUp,
    color: "var(--accent-primary)",
    description: "Analyzes all metrics and auto-publishes AI insights with trend analysis and disparity findings.",
    schedule: "Daily at 7am",
  },
  {
    key: "quality_triage",
    fn: "agentQualityTriage",
    name: "Quality Triage Agent",
    icon: ShieldCheck,
    color: "var(--color-warning)",
    description: "Reviews open data quality flags, provides context-aware assessments, and assigns issues to the right team member.",
    schedule: "After each scan",
  },
  {
    key: "anomaly_report",
    fn: "agentAnomalyReport",
    name: "Anomaly Narrative",
    icon: FileText,
    color: "#a78bfa",
    description: "Writes a weekly plain-language report on the most significant health metric changes and disparities.",
    schedule: "Weekly on Mondays",
  },
  {
    key: "consistency_check",
    fn: "agentConsistencyCheck",
    name: "Consistency Checker",
    icon: GitCompare,
    color: "var(--color-info)",
    description: "Compares metrics across data sources to flag conflicting values (e.g. StatCan vs FNHA) and explains discrepancies.",
    schedule: "Weekly",
  },
  {
    key: "gap_prioritization",
    fn: "agentGapPrioritization",
    name: "Gap Prioritization",
    icon: Search,
    color: "var(--color-success)",
    description: "Scans for missing data across categories, regions, and years. Ranks gaps by strategic priority and suggests sources.",
    schedule: "Weekly",
  },
  {
    key: "trend_forecast",
    fn: "agentTrendForecasting",
    name: "Trend Forecasting Agent",
    icon: Telescope,
    color: "#f472b6",
    description: "Uses historical metric time series and linear regression to forecast future health outcomes, detect widening disparities, and issue early warnings for policymakers.",
    schedule: "Weekly on Sundays",
  },
  {
    key: "sentinel_scan",
    fn: "runSentinelScan",
    name: "Sentinel Alert Agent",
    icon: AlertCircle,
    color: "var(--color-error)",
    description: "Detects abnormal trend shifts and widening disparity signals, then posts alert events and weekly intelligence feed updates.",
    schedule: "Daily at 6am",
  },
  {
    key: "source_conflict",
    fn: "reconcileSourceConflict",
    name: "Conflict Reconciliation Agent",
    icon: GitCompare,
    color: "var(--color-warning)",
    description: "Finds conflicting source values, opens conflict alerts, and routes inconsistency flags for review.",
    schedule: "Twice weekly",
  },
  {
    key: "conflict_adjudication_digest",
    fn: "agentConflictAdjudicationDigest",
    name: "Conflict Adjudication Digest",
    icon: GitCompare,
    color: "var(--color-error)",
    description: "Publishes weekly adjudication backlog digest, tracks unresolved critical conflicts, and flags governance pressure.",
    schedule: "Weekly on Fridays",
  },
  {
    key: "source_reliability",
    fn: "scoreSourceReliability",
    name: "Source Reliability Scorer",
    icon: ShieldCheck,
    color: "var(--color-info)",
    description: "Scores each data source using sync stability, freshness, and quality outcomes to support source trust decisions.",
    schedule: "Weekly",
  },
  {
    key: "watchlist_digest",
    fn: "generateWatchlistDigest",
    name: "Watchlist Digest Agent",
    icon: Search,
    color: "var(--accent-primary)",
    description: "Evaluates KPI missions, triggers threshold-breach alerts, and publishes digest summaries.",
    schedule: "Daily",
  },
  {
    key: "approval_sla",
    fn: "runApprovalSLAEscalation",
    name: "Approval SLA Monitor",
    icon: Clock,
    color: "var(--color-warning)",
    description: "Escalates near-due and overdue approval tasks to preserve human-gate integrity.",
    schedule: "Hourly",
  },
  {
    key: "forecast_backtest",
    fn: "runForecastBacktest",
    name: "Forecast Backtest Agent",
    icon: Telescope,
    color: "var(--color-info)",
    description: "Runs holdout backtests, computes MAPE by region/category, and flags model drift.",
    schedule: "Weekly",
  },
  {
    key: "policy_governance_scheduler",
    fn: "scheduledPolicyGovernance",
    name: "Policy Governance Scheduler",
    icon: Clock,
    color: "var(--accent-primary)",
    description: "Runs schedule-aware governance automation: recommendation ranking, conflict digest, and SLA checks with interval guards.",
    schedule: "Hourly/cron hook",
  },
  {
    key: "hansard_intelligence",
    fn: "scanHansards",
    name: "Hansard Intelligence Agent",
    icon: FileText,
    color: "var(--accent-primary)",
    description: "Scrapes BC and Federal Hansards, scores topical relevance, and publishes policy-facing political intelligence with evidence links.",
    schedule: "Daily (or on-demand)",
  },
  {
    key: "report_ingestion",
    fn: "runReportIngestionWorker",
    name: "Report Ingestion Agent",
    icon: FileText,
    color: "var(--color-info)",
    description: "Processes imported reports (PDF and others), extracts quantitative metrics and qualitative findings, and indexes policy-ready intelligence artifacts.",
    schedule: "On-demand / queued",
  },
  {
    key: "recommendation_ranker",
    fn: "rankRecommendations",
    name: "Recommendation Ranker",
    icon: ListOrdered,
    color: "var(--accent-primary)",
    description: "Ranks recommendations by confidence, freshness, and evidence strength, suppresses weak outputs, and auto-routes top items for approval.",
    schedule: "Daily",
  },
];

const STATUS_ICON = {
  completed: <CheckCircle size={13} style={{ color: "var(--color-success)" }} />,
  failed: <AlertCircle size={13} style={{ color: "var(--color-error)" }} />,
  running: <RefreshCw size={13} className="animate-spin" style={{ color: "var(--color-info)" }} />,
};

export default function AgentCenter() {
  const { user, addLog } = useApp();
  const [tasks, setTasks] = useState([]);
  const [running, setRunning] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const loadTasks = async () => {
    const data = await base44.entities.AgentTask.list("-created_date", 100);
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, []);

  const handleRun = async (agent) => {
    if (!isAdmin) return;
    setRunning(r => ({ ...r, [agent.key]: true }));
    addLog("info", `Running ${agent.name}...`);
    try {
      await base44.functions.invoke(agent.fn, {});
      addLog("success", `${agent.name} complete`);
      await loadTasks();
    } catch (e) {
      addLog("error", `${agent.name} failed: ${e.message}`);
    }
    setRunning(r => ({ ...r, [agent.key]: false }));
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Last task per agent
  const lastTask = (agent) => tasks.find((t) => {
    const taskType = String(t.task_type || "").toLowerCase();
    const agentName = String(t.agent_name || "").toLowerCase();
    return taskType === String(agent.key).toLowerCase()
      || taskType === String(agent.fn).toLowerCase()
      || agentName.includes(String(agent.name).toLowerCase());
  });

  return (
    <div className="flex flex-col h-full overflow-auto p-5 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Bot size={14} style={{ color: "var(--accent-primary)" }} />
          AI Agent Command Center
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Policy intelligence agents continuously monitor, analyze, forecast, and improve data quality and decision readiness.
        </p>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {AGENTS.map(agent => {
          const last = lastTask(agent);
          const isRunning = running[agent.key];
          return (
            <div key={agent.key} className="metric-card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg-overlay)", border: `1px solid var(--border-subtle)` }}>
                    <agent.icon size={16} style={{ color: agent.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{agent.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{agent.schedule}</div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRun(agent)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium shrink-0"
                    style={{ background: isRunning ? "var(--bg-overlay)" : "var(--accent-primary)", color: isRunning ? "var(--text-muted)" : "#000" }}>
                    {isRunning ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
                    {isRunning ? "Running…" : "Run Now"}
                  </button>
                )}
              </div>

              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{agent.description}</p>

              {/* Last run result */}
              {last && (
                <div className="rounded-md p-2.5" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICON[last.status]}
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {last.status === "completed" ? "Last run succeeded" : last.status === "failed" ? "Last run failed" : "Running..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(last.created_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      {(last.summary || last.output) && (
                        <button onClick={() => toggleExpand(last.id)} className="activity-icon" style={{ width: 20, height: 20 }}>
                          {expanded[last.id] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </button>
                      )}
                    </div>
                  </div>
                  {last.summary && (
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{last.summary}</p>
                  )}
                  {last.items_processed != null && (
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Processed: <span style={{ color: "var(--text-secondary)" }}>{last.items_processed}</span>
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Actioned: <span style={{ color: agent.color }}>{last.items_actioned}</span>
                      </span>
                      {last.duration_ms && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {(last.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}
                  {expanded[last.id] && last.output && (
                    <div className="mt-2 pt-2 border-t text-xs whitespace-pre-wrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)", maxHeight: 200, overflowY: "auto" }}>
                      {last.output}
                    </div>
                  )}
                  {expanded[last.id] && last.error_message && (
                    <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--color-error)" }}>
                      {last.error_message}
                    </div>
                  )}
                </div>
              )}
              {!last && !isRunning && (
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No runs yet. {isAdmin ? "Click Run Now to trigger manually." : "Runs on schedule."}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Run history */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Run History
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-8" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={14} className="animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>No agent runs yet.</div>
          ) : (
            <table className="w-full data-table text-xs">
              <thead>
                <tr>
                  <th className="text-left">Agent</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Summary</th>
                  <th className="text-right">Processed</th>
                  <th className="text-right">Actioned</th>
                  <th className="text-right">Duration</th>
                  <th className="text-left">Run At</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 40).map(t => (
                  <tr key={t.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{t.agent_name}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {STATUS_ICON[t.status]}
                        <span style={{ color: t.status === "completed" ? "var(--color-success)" : t.status === "failed" ? "var(--color-error)" : "var(--color-info)" }}>
                          {t.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", maxWidth: 300 }}>
                      <span className="line-clamp-1">{t.summary || "—"}</span>
                    </td>
                    <td className="text-right" style={{ color: "var(--text-secondary)" }}>{t.items_processed ?? "—"}</td>
                    <td className="text-right" style={{ color: "var(--accent-primary)" }}>{t.items_actioned ?? "—"}</td>
                    <td className="text-right" style={{ color: "var(--text-muted)" }}>
                      {t.duration_ms ? `${(t.duration_ms / 1000).toFixed(1)}s` : "—"}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {new Date(t.created_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
