/**
 * ApprovalDetailModal — focused detail view of a DataSource's approval record.
 * Shows full provenance from the SourceCandidate approval and lets the user
 * export the metadata as JSON or plain text.
 */
import React from "react";
import {
  X, ShieldCheck, Calendar, User, Mail, Hash, ExternalLink,
  Download, Copy, FileJson, FileText,
} from "lucide-react";

const RELEVANCE_COLOR = (score) => {
  if (score == null) return "var(--text-muted)";
  if (score >= 80) return "#00e676";
  if (score >= 60) return "#FEDD00";
  if (score >= 40) return "#ffab40";
  return "#8bafd4";
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "—";

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ApprovalDetailModal({ source, onClose }) {
  const approval = source?.metadata?.approval || {};
  const score = approval.relevance_score;
  const scoreColor = RELEVANCE_COLOR(score);

  const exportPayload = {
    source: {
      id: source.id,
      name: source.name,
      type: source.type,
      category: source.category,
      region: source.region,
      url: source.url,
      status: source.status,
      created_date: source.created_date,
    },
    approval,
  };

  const handleExportJSON = () => {
    const safe = (source.name || "source").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    downloadFile(`approval_${safe}.json`, JSON.stringify(exportPayload, null, 2), "application/json");
  };

  const handleExportText = () => {
    const lines = [
      `Approval Record — ${source.name}`,
      `========================================`,
      ``,
      `Source ID:        ${source.id}`,
      `Source Type:      ${source.type}`,
      `Category:         ${source.category || "—"}`,
      `Region:           ${source.region || "—"}`,
      `Source URL:       ${source.url || "—"}`,
      ``,
      `── Approval ──`,
      `Approved By:      ${approval.approved_by_name || "—"}`,
      `Approver Email:   ${approval.approved_by_email || "—"}`,
      `Approved At:      ${formatDate(approval.approved_at)}`,
      `Candidate ID:     ${approval.candidate_id || "—"}`,
      ``,
      `── Discovery Context ──`,
      `Relevance Score:  ${score ?? "—"} / 100`,
      `Relevance Reason: ${approval.relevance_reason || "—"}`,
      `Publisher:        ${approval.publisher || "—"}`,
      `Publication Date: ${approval.publication_date || "—"}`,
      `Discovered By:    ${approval.discovered_by || "—"}`,
      `Run ID:           ${approval.discovery_run_id || "—"}`,
      ``,
      `── AI Summary ──`,
      approval.summary || "—",
    ];
    const safe = (source.name || "source").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    downloadFile(`approval_${safe}.txt`, lines.join("\n"), "text/plain");
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(JSON.stringify(exportPayload, null, 2));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          maxHeight: "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,230,118,0.12) 0%, var(--bg-surface) 70%)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <span aria-hidden style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, #00e676 0%, #40c4ff 100%)",
          }} />
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #00e676 0%, #34d399 100%)",
                boxShadow: "0 4px 12px rgba(0,230,118,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <ShieldCheck size={16} style={{ color: "#fff", strokeWidth: 2.5 }} />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider font-bold" style={{ color: "#00e676", letterSpacing: "0.1em", fontSize: 10 }}>
                Approval Record
              </div>
              <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {source.name}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon shrink-0" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Approver block */}
          <Section title="Approved By" icon={User} accent="#00e676">
            <Row icon={User} label="Name" value={approval.approved_by_name} />
            <Row icon={Mail} label="Email" value={approval.approved_by_email} mono />
            <Row icon={Calendar} label="Approved At" value={formatDate(approval.approved_at)} />
          </Section>

          {/* Discovery context */}
          <Section title="Discovery Context" icon={Hash} accent="#40c4ff">
            <div className="flex items-center justify-between text-xs py-1.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Relevance Score</span>
              {score != null ? (
                <span
                  className="px-2 py-0.5 rounded font-mono font-bold"
                  style={{
                    background: `${scoreColor}22`,
                    color: scoreColor,
                    border: `1px solid ${scoreColor}55`,
                    fontSize: 11,
                  }}
                >
                  {score} / 100
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>—</span>
              )}
            </div>
            {approval.relevance_reason && (
              <div className="text-xs py-1.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="mb-1" style={{ color: "var(--text-muted)" }}>Relevance Reasoning</div>
                <div className="leading-snug" style={{ color: "var(--text-secondary)" }}>
                  {approval.relevance_reason}
                </div>
              </div>
            )}
            <Row label="Publisher" value={approval.publisher} />
            <Row label="Publication Date" value={approval.publication_date} />
            <Row label="Discovered By" value={approval.discovered_by} />
            <Row label="Candidate ID" value={approval.candidate_id} mono />
            <Row label="Run ID" value={approval.discovery_run_id} mono />
            {approval.original_url && (
              <div className="flex items-center justify-between text-xs py-1.5">
                <span style={{ color: "var(--text-muted)" }}>Original URL</span>
                <a
                  href={approval.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 truncate max-w-[60%] hover:underline"
                  style={{ color: "var(--color-info)" }}
                >
                  <ExternalLink size={9} className="shrink-0" />
                  <span className="truncate">{approval.original_url}</span>
                </a>
              </div>
            )}
          </Section>

          {/* AI summary */}
          {approval.summary && (
            <Section title="AI Summary" icon={FileText} accent="#FEDD00">
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {approval.summary}
              </p>
            </Section>
          )}
        </div>

        {/* Footer — export actions */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-3 border-t"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Export full approval metadata
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <Copy size={11} /> Copy
            </button>
            <button
              onClick={handleExportText}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <FileText size={11} /> Text
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold"
              style={{ background: "#00e676", color: "#04245a" }}
            >
              <Download size={11} /> Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, accent, children }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "var(--bg-overlay)",
        border: `1px solid ${accent}33`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon size={11} style={{ color: accent }} />}
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: accent, letterSpacing: "0.08em", fontSize: 10 }}
        >
          {title}
        </span>
      </div>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
        {Icon && <Icon size={10} />}
        {label}
      </span>
      <span
        className={`text-right ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--text-secondary)", maxWidth: "65%", wordBreak: "break-all" }}
      >
        {value}
      </span>
    </div>
  );
}