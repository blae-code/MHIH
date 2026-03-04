import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { BookMarked, Database, RefreshCw, Search, Upload } from "lucide-react";

export default function KnowledgeAdmin() {
  const { addLog } = useApp();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportWorking, setReportWorking] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    source_url: "",
    source_type: "manual",
    tags: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.KnowledgeDocument.list("-indexed_at", 300).catch(() => []);
      setDocs(data || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const indexManual = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setWorking(true);
    try {
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await base44.functions.invoke("indexKnowledgeDocs", {
        documents: [{ ...form, tags }],
        include_approved_memos: false,
      });
      addLog("success", `Indexed ${res.data?.indexed || 0} documents`);
      setForm({ title: "", content: "", source_url: "", source_type: "manual", tags: "" });
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const indexMemos = async () => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("indexKnowledgeDocs", {
        documents: [],
        include_approved_memos: true,
      });
      addLog("success", `Indexed approved memos (${res.data?.indexed || 0})`);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const ask = async () => {
    if (!searchQuery.trim()) return;
    setQuerying(true);
    setAnswer(null);
    try {
      const res = await base44.functions.invoke("queryPolicyKnowledge", {
        query: searchQuery,
        top_k: 4,
        cache_ttl_minutes: 60,
        min_retrieval_score: 0.22,
        max_context_chars: 2200,
      });
      setAnswer(res.data);
    } catch (e) {
      addLog("error", e.message);
    }
    setQuerying(false);
  };

  const indexUploadedReport = async () => {
    if (!reportFile) return;
    setReportWorking(true);
    try {
      const upload = await base44.integrations.Core.UploadFile({ file: reportFile });
      const queued = await base44.functions.invoke("queueReportIngestion", {
        file_url: upload.file_url,
        file_name: reportFile.name,
        source_name: reportFile.name,
        source_type: "uploaded_report",
        import_metrics: false,
        index_knowledge: true,
        create_insight: true,
        use_llm_summary: true,
        max_context_chars: 2400,
        max_metrics: 600,
        max_qual_findings: 180,
        token_budget: 120000,
      });
      const queueDocId = queued.data?.queue_doc_id;
      const res = await base44.functions.invoke("runReportIngestionWorker", {
        queue_doc_id: queueDocId,
        queue_limit: 1,
        import_metrics: false,
        index_knowledge: true,
        create_insight: true,
        use_llm_summary: true,
        max_context_chars: 2400,
        max_metrics: 600,
        max_qual_findings: 180,
        token_budget: 120000,
      });
      let first = res.data?.worker?.results?.[0] || res.data?.results?.[0];
      if (!first && queueDocId) {
        const status = await base44.functions.invoke("getReportIngestionStatus", { report_document_id: queueDocId });
        first = {
          qualitative_extracted: status.data?.findings?.qualitative_total || 0,
          quantitative_extracted: status.data?.findings?.quantitative_total || 0,
        };
      }
      addLog("success", `Report indexed (${first?.qualitative_extracted || 0} qualitative, ${first?.quantitative_extracted || 0} quantitative)`);
      setReportFile(null);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setReportWorking(false);
  };

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BookMarked size={14} style={{ color: "var(--accent-primary)" }} />
            Policy Knowledge Admin
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Curate knowledge docs and query grounded policy answers (RAG-style).
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-1 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Index Document</div>
          <Field label="Title"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></Field>
          <Field label="Source URL"><input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} style={inputStyle} /></Field>
          <Field label="Source Type">
            <select value={form.source_type} onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))} style={inputStyle}>
              <option value="manual">manual</option>
              <option value="policy_doc">policy_doc</option>
              <option value="program_note">program_note</option>
              <option value="briefing">briefing</option>
            </select>
          </Field>
          <Field label="Tags (comma separated)"><input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inputStyle} placeholder="mental health, funding, youth" /></Field>
          <Field label="Content"><textarea rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={inputStyle} /></Field>
          <div className="flex items-center gap-2">
            <button onClick={indexManual} disabled={working} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
              {working ? <RefreshCw size={11} className="animate-spin" /> : <Upload size={11} />} Index Document
            </button>
            <button onClick={indexMemos} disabled={working} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              <Database size={11} /> Index Approved Memos
            </button>
          </div>
          <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Upload Report (PDF/CSV/XLSX)</div>
            <input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt"
              onChange={(e) => setReportFile(e.target.files?.[0] || null)}
              style={inputStyle}
            />
            <button onClick={indexUploadedReport} disabled={reportWorking || !reportFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              {reportWorking ? <RefreshCw size={11} className="animate-spin" /> : <Upload size={11} />} Process Report
            </button>
          </div>
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Knowledge Query</div>
            <div className="flex items-center gap-2">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ask policy knowledge base..." style={{ ...inputStyle, flex: 1 }} />
              <button onClick={ask} disabled={querying} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
                {querying ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />} Query
              </button>
            </div>
          </div>

          {answer && (
            <div className="rounded-lg p-3" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>Answer</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{answer.answer}</div>
              <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Confidence: {answer.confidence != null ? `${(Number(answer.confidence) * 100).toFixed(0)}%` : "n/a"}
              </div>
              {answer.citations?.length > 0 && (
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Citations: {answer.citations.join(", ")}</div>
              )}
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Indexed Documents</div>
            <div className="space-y-1 max-h-[440px] overflow-auto">
              {docs.map(d => (
                <div key={d.id} className="p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                  <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{d.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{d.source_type || "manual"} · {d.indexed_at ? new Date(d.indexed_at).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" }) : "—"}</div>
                  <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{d.summary || d.content}</div>
                  {!!d.keywords?.length && <div className="text-xs mt-1" style={{ color: "var(--accent-primary)" }}>{d.keywords.slice(0, 6).join(" · ")}</div>}
                </div>
              ))}
              {!docs.length && !loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No indexed docs yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading knowledge index...</div>}
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>{children}</div>;
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
