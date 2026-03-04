import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import {
  Brain, Send, Database, Sparkles, Loader2, ChevronDown,
  MessageSquare, BarChart2, AlertCircle, Info, RefreshCw,
  Lightbulb, Clock, X, BarChart3
} from "lucide-react";
import AnalystChartPanel from "@/components/analyst/AnalystChartPanel";

const EXAMPLE_QUESTIONS = [
  "What are the top 5 highest-calorie foods in this dataset?",
  "Summarize the key health trends visible in this data.",
  "What data gaps or missing values are present?",
  "Which regions have the worst outcomes for chronic disease?",
  "Compare mental health indicators across different years.",
  "What are the most common food groups represented?",
  "Identify any outliers or anomalies in the data.",
  "What social determinants are most strongly represented?",
];

export default function DataAnalyst() {
  const { addLog } = useApp();
  const [sources, setSources] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sampleData, setSampleData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [chartMsgIdx, setChartMsgIdx] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.DataSource.list("-updated_date", 100),
      base44.entities.HealthMetric.list("-year", 500),
    ]).then(([src, met]) => {
      setSources(src.filter(s => s.status !== "inactive"));
      setMetrics(met);
    }).catch(e => addLog("error", e.message))
      .finally(() => setLoadingSources(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSelectSource = async (src) => {
    setSelectedSource(src);
    setSampleData(null);
    setConversation([]);
    // Try to load a CSV preview for richer AI context
    const url = src.url;
    if (!url) return;
    const isCsv = url.toLowerCase().includes(".csv") || (src.type === "manual_upload");
    if (isCsv) {
      setLoadingPreview(true);
      try {
        const res = await base44.functions.invoke("dataBCTools", { action: "parse_csv", csvUrl: url, limit: 100 });
        if (res.data?.success) setSampleData(res.data.rows);
      } catch { /* ignore */ }
      setLoadingPreview(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !selectedSource || loading) return;
    const q = question.trim();
    setQuestion("");
    const userMsg = { role: "user", text: q, ts: new Date() };
    setConversation(prev => [...prev, userMsg]);
    setLoading(true);

    // Build metrics snapshot filtered to this source
    const metricsForSource = metrics.filter(m =>
      m.data_source_id === selectedSource.id || m.data_source_name === selectedSource.name
    );
    const metricsSnapshot = metricsForSource.length > 0 ? metricsForSource : metrics.slice(0, 100);

    try {
      const res = await base44.functions.invoke("dataAnalyst", {
        question: q,
        source_id: selectedSource.id,
        source_name: selectedSource.name,
        source_type: selectedSource.type,
        sample_data: sampleData || [],
        metrics_snapshot: metricsSnapshot,
      });
      const result = res.data?.result;
      if (result) {
        setConversation(prev => [...prev, { role: "ai", result, ts: new Date() }]);
        addLog("success", "AI analysis complete");
      } else {
        setConversation(prev => [...prev, { role: "error", text: res.data?.error || "No response", ts: new Date() }]);
      }
    } catch (e) {
      setConversation(prev => [...prev, { role: "error", text: e.message, ts: new Date() }]);
      addLog("error", e.message);
    }
    setLoading(false);
  };

  const selectStyle = {
    background: "var(--bg-overlay)", border: "1px solid var(--border-default)",
    color: "var(--text-primary)", padding: "8px 12px", borderRadius: 8,
    fontSize: 12, outline: "none", width: "100%",
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── LEFT PANEL: source selector ── */}
      <aside className="flex flex-col shrink-0 border-r"
        style={{ width: 260, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <Brain size={14} style={{ color: "var(--accent-primary)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Data Analyst
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Ask natural language questions about any data source.
          </p>
        </div>

        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>
            Select Data Source
          </div>
          {loadingSources ? (
            <div className="flex items-center gap-2 py-2" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={12} className="animate-spin" />
              <span className="text-xs">Loading sources...</span>
            </div>
          ) : sources.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No data sources found. Import one first.</p>
          ) : (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {sources.map(src => (
                <button key={src.id} onClick={() => handleSelectSource(src)}
                  className="w-full text-left px-2.5 py-2 rounded-lg flex items-start gap-2 transition-colors"
                  style={{
                    background: selectedSource?.id === src.id ? "var(--bg-hover)" : "transparent",
                    border: `1px solid ${selectedSource?.id === src.id ? "var(--border-emphasis)" : "transparent"}`,
                  }}
                  onMouseOver={e => { if (selectedSource?.id !== src.id) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                  onMouseOut={e => { if (selectedSource?.id !== src.id) e.currentTarget.style.background = "transparent"; }}>
                  <Database size={12} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: 1 }} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{src.name}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                      {src.type?.replace(/_/g, " ")} · {src.category?.replace(/_/g, " ") || "—"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Also allow querying the full metrics DB */}
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={() => { setSelectedSource({ id: "__metrics__", name: "Health Metrics Repository", type: "internal", category: "all" }); setSampleData(null); setConversation([]); }}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-start gap-2 transition-colors"
            style={{
              background: selectedSource?.id === "__metrics__" ? "var(--bg-hover)" : "transparent",
              border: `1px solid ${selectedSource?.id === "__metrics__" ? "var(--border-emphasis)" : "var(--border-subtle)"}`,
            }}>
            <BarChart2 size={12} style={{ color: "var(--mnbc-yellow)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Health Metrics Repository</div>
              <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                All {metrics.length} imported health metrics
              </div>
            </div>
          </button>
        </div>

        {/* Example questions */}
        <div className="px-3 py-2 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>
            Example Questions
          </div>
          <div className="space-y-1">
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => setQuestion(q)}
                className="w-full text-left px-2 py-1.5 rounded text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                onMouseOut={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
                <Lightbulb size={10} className="inline mr-1.5" style={{ color: "var(--accent-primary)" }} />
                {q}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN: conversation ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Conversation header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          {selectedSource ? (
            <>
              <Database size={14} style={{ color: "var(--accent-primary)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selectedSource.name}</span>
              {loadingPreview && (
                <span className="flex items-center gap-1 text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={11} className="animate-spin" /> Loading data preview...
                </span>
              )}
              {sampleData && (
                <span className="text-xs ml-2" style={{ color: "var(--color-success)" }}>
                  ✓ {sampleData.length} rows loaded for analysis
                </span>
              )}
            </>
          ) : (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>← Select a data source to begin</span>
          )}
        </div>

        {/* Conversation messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedSource && (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
              <Brain size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium mb-1">AI Data Analyst</p>
              <p className="text-xs text-center max-w-xs">
                Select a data source from the left panel, then ask any question about it in natural language.
              </p>
            </div>
          )}

          {selectedSource && conversation.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
              <Sparkles size={32} className="mb-3 opacity-20" />
              <p className="text-xs text-center">
                Ask a question about <strong style={{ color: "var(--text-primary)" }}>{selectedSource.name}</strong>.
                <br />Try an example from the sidebar, or type your own below.
              </p>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" && (
                <div className="flex justify-end">
                  <div className="max-w-xl rounded-2xl rounded-tr-sm px-4 py-2.5"
                    style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
                    <div className="text-xs font-medium mb-0.5" style={{ color: "var(--accent-primary)" }}>You</div>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{msg.text}</p>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                      {msg.ts.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              )}

              {msg.role === "ai" && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "var(--accent-muted)" }}>
                    <Brain size={13} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1 space-y-3">
                    {/* Main answer */}
                    <div className="rounded-2xl rounded-tl-sm p-4"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={11} style={{ color: "var(--accent-primary)" }} />
                        <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>AI Analysis</span>
                        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                          {msg.ts.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{msg.result.answer}</p>
                    </div>

                    {/* Supporting data table + Visualise button */}
                    {msg.result.supporting_data?.length > 0 && (
                      <div className="rounded-lg overflow-hidden"
                        style={{ border: "1px solid var(--border-subtle)" }}>
                        <div className="flex items-center justify-between px-3 py-1.5"
                          style={{ background: "var(--bg-surface)" }}>
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: 10 }}>Supporting Data</span>
                          <button onClick={() => setChartMsgIdx(chartMsgIdx === i ? null : i)}
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                            style={{
                              background: chartMsgIdx === i ? "var(--accent-muted)" : "var(--bg-elevated)",
                              color: chartMsgIdx === i ? "var(--accent-primary)" : "var(--text-muted)",
                              border: `1px solid ${chartMsgIdx === i ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                            }}>
                            <BarChart3 size={10} />
                            {chartMsgIdx === i ? "Hide Chart" : "Visualise"}
                          </button>
                        </div>
                        <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                          {msg.result.supporting_data.map((d, j) => (
                            <div key={j} className="flex items-center justify-between px-3 py-2">
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{d.label}</span>
                              <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent-primary)" }}>{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline chart from supporting data */}
                    {msg.result.supporting_data?.length > 0 && chartMsgIdx === i && (
                      <AnalystChartPanel
                        title={msg.result.answer?.slice(0, 50) + "..."}
                        chartData={msg.result.supporting_data.map(d => ({
                          name: d.label,
                          value: parseFloat(String(d.value).replace(/[^0-9.-]/g, "")) || 0,
                        }))}
                        onClose={() => setChartMsgIdx(null)}
                      />
                    )}

                    {/* Key insights */}
                    {msg.result.insights?.length > 0 && (
                      <div className="rounded-lg p-3 space-y-1.5"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--text-muted)", fontSize: 10 }}>Key Insights</div>
                        {msg.result.insights.map((ins, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs">
                            <span style={{ color: "var(--accent-primary)", flexShrink: 0 }}>▸</span>
                            <span style={{ color: "var(--text-secondary)" }}>{ins}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Caveats */}
                    {msg.result.caveats && (
                      <div className="flex items-start gap-2 text-xs px-1"
                        style={{ color: "var(--text-muted)" }}>
                        <Info size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{msg.result.caveats}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {msg.role === "error" && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(185,38,45,0.1)", border: "1px solid var(--color-error)" }}>
                  <AlertCircle size={13} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-xs" style={{ color: "var(--color-error)" }}>{msg.text}</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-muted)" }}>
                <Brain size={13} style={{ color: "var(--accent-primary)" }} />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={13} className="animate-spin" />
                  <span className="text-xs">Analysing data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          {conversation.length > 0 && (
            <button onClick={() => setConversation([])}
              className="flex items-center gap-1 text-xs mb-2"
              style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={10} /> Clear conversation
            </button>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: "var(--bg-elevated)",
                border: `1px solid ${selectedSource ? "var(--border-default)" : "var(--border-subtle)"}`,
                opacity: selectedSource ? 1 : 0.5,
              }}>
              <MessageSquare size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }}
                placeholder={selectedSource
                  ? `Ask about "${selectedSource.name}"...`
                  : "Select a data source first..."}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAsk()}
                disabled={!selectedSource || loading}
              />
              {question && (
                <button onClick={() => setQuestion("")}>
                  <X size={12} style={{ color: "var(--text-muted)" }} />
                </button>
              )}
            </div>
            <button
              onClick={handleAsk}
              disabled={!selectedSource || !question.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {loading ? "Analysing..." : "Ask"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}