import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { FileText, RefreshCw, ShieldCheck, SlidersHorizontal, ListOrdered, CircleOff } from "lucide-react";

const STATUS_FILTERS = ["all", "pending", "suppressed", "approved", "rejected"];

function derivedStatus(item) {
  const workflow = String(item?.status || "").toLowerCase();
  const approval = String(item?.approval_status || "pending").toLowerCase();
  if (workflow === "suppressed") return "suppressed";
  if (approval === "approved") return "approved";
  if (approval === "rejected") return "rejected";
  return "pending";
}

export default function Recommendations() {
  const { addLog } = useApp();
  const [items, setItems] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [lastRanking, setLastRanking] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minConfidenceView, setMinConfidenceView] = useState(0);
  const [rankingConfig, setRankingConfig] = useState({
    min_confidence: 0.58,
    min_freshness: 0.45,
    min_evidence_links: 2,
    auto_route_top_n: 6,
    min_priority_for_task: 72,
    sla_hours: 72,
  });
  const [memoTopN, setMemoTopN] = useState(5);

  const load = async () => {
    setLoading(true);
    try {
      const [recommendations, scenarioRuns] = await Promise.all([
        base44.entities.Recommendation.list("-updated_date", 1000).catch(() => []),
        base44.entities.ScenarioRun.list("-created_date", 300).catch(() => []),
      ]);
      setItems(recommendations || []);
      setRuns(scenarioRuns || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runById = useMemo(() => {
    const map = new Map();
    runs.forEach((r) => map.set(r.id, r));
    return map;
  }, [runs]);

  const recommendationTypes = useMemo(() => (
    ["all", ...new Set(items.map((i) => i.recommendation_type).filter(Boolean))]
  ), [items]);

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        if (statusFilter !== "all") {
          const itemStatus = derivedStatus(item);
          if (itemStatus !== statusFilter) return false;
        }
        if (typeFilter !== "all" && item.recommendation_type !== typeFilter) return false;
        if (Number(item.confidence_score || 0) < Number(minConfidenceView || 0)) return false;
        return true;
      })
      .sort((a, b) => {
        const rankA = Number(a.rank || 9999);
        const rankB = Number(b.rank || 9999);
        if (rankA !== rankB) return rankA - rankB;
        return Number(b.priority_score || 0) - Number(a.priority_score || 0);
      });
  }, [items, statusFilter, typeFilter, minConfidenceView]);

  const runRanking = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("rankRecommendations", {
        min_confidence: Number(rankingConfig.min_confidence),
        min_freshness: Number(rankingConfig.min_freshness),
        min_evidence_links: Number(rankingConfig.min_evidence_links),
        auto_route_top_n: Number(rankingConfig.auto_route_top_n),
        min_priority_for_task: Number(rankingConfig.min_priority_for_task),
        sla_hours: Number(rankingConfig.sla_hours),
      });
      setLastRanking(res.data || null);
      addLog("success", `Recommendation ranking complete: ${res.data?.active_count || 0} active, ${res.data?.suppressed_count || 0} suppressed, ${res.data?.approval_tasks_created || 0} routed`);
      await load();
    } catch (e) {
      addLog("error", `Ranking failed: ${e.message}`);
    }
    setWorking(false);
  };

  const setSuppression = async (item, suppressed) => {
    try {
      await base44.entities.Recommendation.update(item.id, {
        status: suppressed ? "suppressed" : "pending",
        rank: suppressed ? 9999 : (item.rank && item.rank < 9000 ? item.rank : null),
      });
      addLog("success", suppressed ? "Recommendation suppressed" : "Recommendation restored");
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
  };

  const queueMemoFromTop = async () => {
    const top = filtered
      .filter((r) => derivedStatus(r) === "pending")
      .slice(0, Math.max(1, Number(memoTopN || 5)));

    if (!top.length) {
      addLog("warning", "No eligible recommendations in current filtered view");
      return;
    }

    setWorking(true);
    try {
      const res = await base44.functions.invoke("generateDecisionMemo", {
        title: `Decision Memo - Ranked Recommendations ${new Date().toLocaleDateString("en-CA")}`,
        policy_question: "What actions should be prioritized based on the strongest currently ranked recommendations?",
        recommendation_ids: top.map((r) => r.id),
        include_recent_alerts: true,
        reuse_window_hours: 24,
        max_metric_rows: 30,
        max_recommendation_rows: 6,
        max_alert_rows: 6,
      });
      addLog("success", `Memo queued for approval (task ${String(res.data?.approval_task_id || "").slice(0, 8)})`);
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const pendingCount = items.filter((i) => derivedStatus(i) === "pending").length;
  const suppressedCount = items.filter((i) => derivedStatus(i) === "suppressed").length;

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <ListOrdered size={14} style={{ color: "var(--accent-primary)" }} />
            Confidence-Aware Recommendations
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Rank policy actions by evidence strength, freshness, and uncertainty. Suppress weak-confidence outputs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runRanking} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
            {working ? <RefreshCw size={11} className="animate-spin" /> : <SlidersHorizontal size={11} />} Re-score
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
        <Stat label="Total" value={items.length} color="var(--text-primary)" />
        <Stat label="Active Queue" value={pendingCount} color="var(--accent-primary)" />
        <Stat label="Suppressed" value={suppressedCount} color="var(--color-warning)" />
        <Stat label="Filtered View" value={filtered.length} color="var(--color-info)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-1 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Ranking Controls</div>
          <Field label="Min Confidence Threshold">
            <input type="number" min={0} max={1} step="0.01" value={rankingConfig.min_confidence}
              onChange={(e) => setRankingConfig((c) => ({ ...c, min_confidence: Number(e.target.value || 0) }))} style={inputStyle} />
          </Field>
          <Field label="Min Freshness Threshold">
            <input type="number" min={0} max={1} step="0.01" value={rankingConfig.min_freshness}
              onChange={(e) => setRankingConfig((c) => ({ ...c, min_freshness: Number(e.target.value || 0) }))} style={inputStyle} />
          </Field>
          <Field label="Min Evidence Links">
            <input type="number" min={1} max={20} step="1" value={rankingConfig.min_evidence_links}
              onChange={(e) => setRankingConfig((c) => ({ ...c, min_evidence_links: Number(e.target.value || 1) }))} style={inputStyle} />
          </Field>
          <Field label="Auto-Route Top N">
            <input type="number" min={0} max={20} step="1" value={rankingConfig.auto_route_top_n}
              onChange={(e) => setRankingConfig((c) => ({ ...c, auto_route_top_n: Number(e.target.value || 0) }))} style={inputStyle} />
          </Field>
          <Field label="Min Priority for Task">
            <input type="number" min={1} max={100} step="1" value={rankingConfig.min_priority_for_task}
              onChange={(e) => setRankingConfig((c) => ({ ...c, min_priority_for_task: Number(e.target.value || 1) }))} style={inputStyle} />
          </Field>
          <Field label="Approval SLA Hours">
            <input type="number" min={4} max={240} step="1" value={rankingConfig.sla_hours}
              onChange={(e) => setRankingConfig((c) => ({ ...c, sla_hours: Number(e.target.value || 72) }))} style={inputStyle} />
          </Field>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Ranking now auto-routes top eligible recommendations into ApprovalTask queue.
          </div>
          {lastRanking && (
            <div className="rounded p-2 text-xs" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)", color: "var(--text-secondary)" }}>
              Last scan: {lastRanking.active_count || 0} active, {lastRanking.suppressed_count || 0} suppressed, {lastRanking.approval_tasks_created || 0} routed
            </div>
          )}
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs px-2 py-1 rounded" style={inputStyle}>
              {STATUS_FILTERS.map((v) => <option key={v} value={v}>{v === "all" ? "All Status" : v}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs px-2 py-1 rounded" style={inputStyle}>
              {recommendationTypes.map((v) => <option key={v} value={v}>{v === "all" ? "All Types" : v}</option>)}
            </select>
            <input type="number" min={0} max={1} step="0.01" value={minConfidenceView}
              onChange={(e) => setMinConfidenceView(Number(e.target.value || 0))} style={{ ...inputStyle, width: 120 }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>min visible confidence</span>
            <div className="ml-auto flex items-center gap-2">
              <input type="number" min={1} max={10} value={memoTopN}
                onChange={(e) => setMemoTopN(Number(e.target.value || 5))}
                style={{ ...inputStyle, width: 72 }} />
              <button onClick={queueMemoFromTop} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                <FileText size={11} /> Memo from Top N
              </button>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
            {loading ? (
              <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading recommendations...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>No recommendations for selected filters.</div>
            ) : (
              <table className="w-full data-table text-xs">
                <thead>
                  <tr>
                    <th className="text-right">Rank</th>
                    <th className="text-left">Recommendation</th>
                    <th className="text-left">Type</th>
                    <th className="text-right">Confidence</th>
                    <th className="text-right">Priority</th>
                    <th className="text-left">Run</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 400).map((item) => {
                    const run = runById.get(item.scenario_run_id);
                    const status = derivedStatus(item);
                    const suppressed = status === "suppressed";
                    return (
                      <tr key={item.id}>
                        <td className="text-right">{suppressed ? "-" : Number(item.rank || 0) || "-"}</td>
                        <td>
                          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.title}</div>
                          <div className="line-clamp-2" style={{ color: "var(--text-muted)" }}>{item.summary}</div>
                        </td>
                        <td>{item.recommendation_type || "-"}</td>
                        <td className="text-right">{item.confidence_score != null ? `${(Number(item.confidence_score) * 100).toFixed(0)}%` : "-"}</td>
                        <td className="text-right">{item.priority_score ?? "-"}</td>
                        <td>
                          <div style={{ color: "var(--text-secondary)" }}>{run?.run_type || "-"}</div>
                          <div style={{ color: "var(--text-muted)" }}>{run?.model_version || ""}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="tag" style={{
                              color: suppressed ? "var(--color-warning)" : "var(--color-success)",
                              borderColor: suppressed ? "var(--color-warning)" : "var(--color-success)",
                            }}>
                              {suppressed ? "suppressed" : "active"}
                            </span>
                            {item.approval_status && item.approval_status !== "pending" && (
                              <span className="tag">{status}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {suppressed ? (
                              <button onClick={() => setSuppression(item, false)} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                                Restore
                              </button>
                            ) : (
                              <button onClick={() => setSuppression(item, true)} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                                <CircleOff size={10} className="inline mr-1" /> Suppress
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="rounded p-3 text-xs" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)", color: "var(--text-secondary)" }}>
        <div className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: "var(--accent-primary)" }}>
          <ShieldCheck size={11} /> Human Gate Rule
        </div>
        Recommendations remain advisory until reviewed in Approvals Inbox through linked decision memos.
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, color }) {
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
  outline: "none",
};
