import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { FileText, RefreshCw, Search, ShieldCheck } from "lucide-react";

const DEFAULT_TOPICS = "metis, indigenous, health, mental health, substance use, overdose, maternal, housing, primary care, wait time";

export default function HansardIntel() {
  const { addLog } = useApp();
  const [topicsText, setTopicsText] = useState(DEFAULT_TOPICS);
  const [bcEnabled, setBcEnabled] = useState(true);
  const [federalEnabled, setFederalEnabled] = useState(true);
  const [config, setConfig] = useState({
    days_lookback: 21,
    max_docs_per_jurisdiction: 4,
    min_relevance_score: 0.12,
    cache_ttl_hours: 6,
    max_context_chars: 4200,
    use_llm: true,
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [running, setRunning] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const scans = await base44.entities.AIInsight
        .filter({ type: "hansard_intelligence" }, "-created_date", 120)
        .catch(() => []);
      setHistory(scans || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const topics = useMemo(
    () => topicsText.split(",").map((s) => s.trim()).filter(Boolean),
    [topicsText]
  );

  const runScan = async () => {
    if (!topics.length) {
      addLog("warning", "Add at least one topic");
      return;
    }
    if (!bcEnabled && !federalEnabled) {
      addLog("warning", "Enable at least one jurisdiction");
      return;
    }

    setRunning(true);
    try {
      const jurisdictions = [];
      if (bcEnabled) jurisdictions.push("bc");
      if (federalEnabled) jurisdictions.push("federal");

      const res = await base44.functions.invoke("scanHansards", {
        topics,
        jurisdictions,
        days_lookback: Number(config.days_lookback),
        max_docs_per_jurisdiction: Number(config.max_docs_per_jurisdiction),
        min_relevance_score: Number(config.min_relevance_score),
        cache_ttl_hours: Number(config.cache_ttl_hours),
        max_context_chars: Number(config.max_context_chars),
        use_llm: Boolean(config.use_llm),
      });

      setResult(res.data || null);
      addLog("success", `Hansard scan complete (${res.data?.signals?.length || 0} signals${res.data?.cache_hit ? ", cache hit" : ""})`);
      await loadHistory();
    } catch (e) {
      addLog("error", e.message);
    }
    setRunning(false);
  };

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FileText size={14} style={{ color: "var(--accent-primary)" }} />
            Hansard Intelligence
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Scrape and analyze BC and Federal Hansards for policy-relevant political signals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runScan} disabled={running} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
            {running ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />} Run Scan
          </button>
          <button onClick={loadHistory} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-1 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Scan Controls</div>
          <Field label="Topics (comma separated)">
            <textarea rows={6} value={topicsText} onChange={(e) => setTopicsText(e.target.value)} style={inputStyle} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Days Lookback">
              <input type="number" min={3} max={120} value={config.days_lookback} onChange={(e) => setConfig((c) => ({ ...c, days_lookback: Number(e.target.value || 21) }))} style={inputStyle} />
            </Field>
            <Field label="Docs / Jurisdiction">
              <input type="number" min={1} max={8} value={config.max_docs_per_jurisdiction} onChange={(e) => setConfig((c) => ({ ...c, max_docs_per_jurisdiction: Number(e.target.value || 4) }))} style={inputStyle} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min Relevance">
              <input type="number" min={0} max={1} step="0.01" value={config.min_relevance_score} onChange={(e) => setConfig((c) => ({ ...c, min_relevance_score: Number(e.target.value || 0.12) }))} style={inputStyle} />
            </Field>
            <Field label="Cache TTL (hours)">
              <input type="number" min={1} max={72} value={config.cache_ttl_hours} onChange={(e) => setConfig((c) => ({ ...c, cache_ttl_hours: Number(e.target.value || 6) }))} style={inputStyle} />
            </Field>
          </div>
          <Field label="Max LLM Context Chars">
            <input type="number" min={1200} max={9000} step={200} value={config.max_context_chars} onChange={(e) => setConfig((c) => ({ ...c, max_context_chars: Number(e.target.value || 4200) }))} style={inputStyle} />
          </Field>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={bcEnabled} onChange={(e) => setBcEnabled(e.target.checked)} />
              BC Hansard
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={federalEnabled} onChange={(e) => setFederalEnabled(e.target.checked)} />
              Federal Hansard
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={config.use_llm} onChange={(e) => setConfig((c) => ({ ...c, use_llm: e.target.checked }))} />
              LLM synthesis
            </label>
          </div>
          <div className="rounded p-2 text-xs" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)", color: "var(--text-secondary)" }}>
            Token guardrails: cache reuse, relevance filtering, and bounded context are enabled by default.
          </div>
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Latest Scan Output</div>
            {!!result?.cache_hit && <span className="tag">cache hit</span>}
          </div>

          {!result ? (
            <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Run a Hansard scan to generate topical political intelligence.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{result.summary}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Risk: <span style={{ color: "var(--text-secondary)" }}>{String(result.risk_level || "n/a")}</span> · Confidence: <span style={{ color: "var(--text-secondary)" }}>{result.confidence_score != null ? `${(Number(result.confidence_score) * 100).toFixed(0)}%` : "n/a"}</span> · Signals: <span style={{ color: "var(--text-secondary)" }}>{result.signals?.length || 0}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Scanned: BC {result.scanned_documents?.bc ?? 0}, Federal {result.scanned_documents?.federal ?? 0}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                  <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <ShieldCheck size={11} style={{ color: "var(--accent-primary)" }} /> Policy Implications
                  </div>
                  <div className="space-y-1">
                    {(result.policy_implications || []).slice(0, 8).map((line, idx) => (
                      <div key={idx} className="text-xs" style={{ color: "var(--text-secondary)" }}>- {line}</div>
                    ))}
                    {!result.policy_implications?.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No implications generated.</div>}
                  </div>
                </div>
                <div className="rounded p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Watch Items</div>
                  <div className="space-y-1">
                    {(result.watch_items || []).slice(0, 8).map((line, idx) => (
                      <div key={idx} className="text-xs" style={{ color: "var(--text-secondary)" }}>- {line}</div>
                    ))}
                    {!result.watch_items?.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No watch items generated.</div>}
                  </div>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                <table className="w-full data-table text-xs">
                  <thead>
                    <tr>
                      <th className="text-left">Jurisdiction</th>
                      <th className="text-left">Date</th>
                      <th className="text-right">Relevance</th>
                      <th className="text-left">Signal</th>
                      <th className="text-left">Keywords</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.signals || []).slice(0, 50).map((s) => (
                      <tr key={s.reference_id}>
                        <td style={{ color: "var(--text-secondary)" }}>{String(s.jurisdiction || "").toUpperCase()}</td>
                        <td style={{ color: "var(--text-muted)" }}>{s.date_iso ? new Date(s.date_iso).toLocaleDateString("en-CA") : "—"}</td>
                        <td className="text-right" style={{ color: "var(--text-secondary)" }}>{(Number(s.relevance_score || 0) * 100).toFixed(0)}%</td>
                        <td>
                          <a href={s.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.title}</a>
                          <div className="line-clamp-2" style={{ color: "var(--text-muted)" }}>{s.excerpt}</div>
                        </td>
                        <td style={{ color: "var(--accent-primary)" }}>{(s.matched_keywords || []).slice(0, 6).join(", ") || "—"}</td>
                      </tr>
                    ))}
                    {!result.signals?.length && (
                      <tr>
                        <td colSpan={5} className="text-center py-6" style={{ color: "var(--text-muted)" }}>No matching debate segments.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!!result.errors?.length && (
                <div className="rounded p-2 text-xs" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--color-warning)" }}>
                  {result.errors.slice(0, 5).map((e, i) => <div key={i}>- {e}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="metric-card space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Recent Hansard Intelligence Runs</div>
        {loadingHistory ? (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>No saved runs yet.</div>
        ) : (
          <div className="space-y-1 max-h-56 overflow-auto">
            {history.map((row) => (
              <div key={row.id} className="p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{row.title}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {row.created_date ? new Date(row.created_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" }) : "—"} · confidence {(Number(row.confidence_score || 0) * 100).toFixed(0)}%
                </div>
                <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{row.content}</div>
              </div>
            ))}
          </div>
        )}
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
