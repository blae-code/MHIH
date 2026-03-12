/**
 * Policy Studio — Red River OS
 *
 * Policy development lifecycle tool.
 * Supports the Métis policy journey from Rechèrche through Nispaahtoon,
 * with registry, stage tracking, evidence, and approval workflows.
 *
 * Status: scaffold — wiring and data integration in progress.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Scale, ScrollText, GitBranch, Library, ClipboardCheck,
  Plus, ChevronRight, AlertTriangle, CheckCircle, Clock,
  Search, Filter, ArrowRight, Tag,
} from "lucide-react";

// ── Policy lifecycle stages ────────────────────────────────────────────────
const LIFECYCLE_STAGES = [
  {
    key: "recherche",
    label: "Rechèrche",
    description: "Research, evidence scanning, and environmental analysis.",
    color: "#a78bfa",
  },
  {
    key: "kashkihtamowin",
    label: "Kashkihtamowin",
    description: "Building capacity and internal readiness.",
    color: "#40c4ff",
  },
  {
    key: "kiinaymaakinan",
    label: "Kiinaymaakinan",
    description: "Relationship building with partners and communities.",
    color: "#34d399",
  },
  {
    key: "li-liain",
    label: "Li Liain",
    description: "Dialogue, consultation, and community engagement.",
    color: "#FEDD00",
  },
  {
    key: "apoorbaa",
    label: "Apoorbaa",
    description: "Decision-making and formal resolution.",
    color: "#fb923c",
  },
  {
    key: "apihtowachik",
    label: "Apihtowachik",
    description: "Implementation and operationalisation.",
    color: "#f472b6",
  },
  {
    key: "nispaahtoon",
    label: "Nispaahtoon",
    description: "Monitoring, accountability, and continuous improvement.",
    color: "#00e676",
  },
];

// ── Demo policy registry entries ──────────────────────────────────────────
const DEMO_POLICIES = [
  {
    id: 1,
    title: "Culturally Safe Care Standards Framework",
    stage: "apihtowachik",
    portfolio: "Health Equity",
    owner: "Health Equity Team",
    lastUpdated: "2025-03-08",
    status: "active",
    tags: ["equity", "cultural-safety", "standards"],
  },
  {
    id: 2,
    title: "Mental Health Strategy 2025–28",
    stage: "li-liain",
    portfolio: "Provincial Health & Wellness",
    owner: "Provincial Wellness Team",
    lastUpdated: "2025-03-01",
    status: "in-progress",
    tags: ["mental-health", "strategy"],
  },
  {
    id: 3,
    title: "Diabetes Prevention & Management Policy",
    stage: "nispaahtoon",
    portfolio: "Health Policy Implementation",
    owner: "MHIH Policy Team",
    lastUpdated: "2025-02-15",
    status: "monitoring",
    tags: ["diabetes", "chronic-disease", "prevention"],
  },
  {
    id: 4,
    title: "Data Sovereignty & Governance Framework",
    stage: "kashkihtamowin",
    portfolio: "Research & Evaluation",
    owner: "Research Team",
    lastUpdated: "2025-02-28",
    status: "in-progress",
    tags: ["data-governance", "sovereignty"],
  },
  {
    id: 5,
    title: "Anti-Racism Action Plan — Health Sector",
    stage: "apoorbaa",
    portfolio: "Health Equity",
    owner: "Health Equity Team",
    lastUpdated: "2025-03-10",
    status: "review",
    tags: ["anti-racism", "equity", "action-plan"],
  },
];

const STATUS_CONFIG = {
  active: { label: "Active", color: "#00e676" },
  "in-progress": { label: "In Progress", color: "#40c4ff" },
  monitoring: { label: "Monitoring", color: "#a78bfa" },
  review: { label: "In Review", color: "#FEDD00" },
  draft: { label: "Draft", color: "var(--text-muted)" },
};

function StageChip({ stageKey }) {
  const stage = LIFECYCLE_STAGES.find((s) => s.key === stageKey);
  if (!stage) return null;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: stage.color,
        background: stage.color + "18",
        border: `1px solid ${stage.color}33`,
        padding: "2px 7px",
        borderRadius: 4,
      }}
    >
      {stage.label}
    </span>
  );
}

export default function PolicyStudio() {
  const [activeTab, setActiveTab] = useState("registry");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPolicies = DEMO_POLICIES.filter((p) =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some((t) => t.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">Red River OS · Policy Studio</div>
              <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
                Policy Studio
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Policy development, lifecycle tracking, evidence management, and approval workflows.
              </p>
            </div>
            <div
              className="shrink-0 px-2 py-1 rounded text-xs font-semibold"
              style={{ background: "rgba(244,114,182,0.1)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.25)" }}
            >
              Beta Module
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #f472b6, transparent 70%)", borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
          {["registry", "lifecycle", "evidence", "approvals"].map((tab) => {
            const labels = { registry: "Policy Registry", lifecycle: "Lifecycle", evidence: "Evidence Library", approvals: "Review & Approval" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab ? "rgba(244,114,182,0.1)" : "transparent",
                  color: activeTab === tab ? "#f472b6" : "var(--text-muted)",
                  border: activeTab === tab ? "1px solid rgba(244,114,182,0.25)" : "1px solid transparent",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Policy Registry */}
        {activeTab === "registry" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <Search size={13} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search policies, tags, portfolios…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    color: "var(--text-primary)", fontSize: 12, flex: 1,
                  }}
                />
              </div>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(244,114,182,0.1)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.25)" }}
              >
                <Plus size={12} /> New Policy
              </button>
            </div>

            <div className="space-y-2">
              {filteredPolicies.map((policy) => {
                const statusCfg = STATUS_CONFIG[policy.status] ?? STATUS_CONFIG.draft;
                return (
                  <div
                    key={policy.id}
                    className="rounded-xl px-4 py-3 flex items-start gap-4 transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(244,114,182,0.3)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
                  >
                    <Scale size={16} style={{ color: "#f472b6", flexShrink: 0, marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1.5">
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{policy.title}</h3>
                        <span
                          style={{
                            fontSize: 10, fontWeight: 600,
                            color: statusCfg.color,
                            background: statusCfg.color + "18",
                            border: `1px solid ${statusCfg.color}33`,
                            padding: "2px 6px", borderRadius: 3,
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{policy.portfolio}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Updated {policy.lastUpdated}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StageChip stageKey={policy.stage} />
                        {policy.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 10, color: "var(--text-muted)",
                              background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                              padding: "1px 6px", borderRadius: 3,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lifecycle */}
        {activeTab === "lifecycle" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              The Métis policy lifecycle reflects the Nation's governance values — from grounded research through
              community dialogue to accountable implementation and continuous improvement.
            </p>
            <div className="space-y-3">
              {LIFECYCLE_STAGES.map((stage, i) => (
                <div
                  key={stage.key}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderLeft: `3px solid ${stage.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Stage {i + 1}</div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: stage.color, marginBottom: 4 }}>
                        {stage.label}
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{stage.description}</p>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {DEMO_POLICIES.filter(p => p.stage === stage.key).length} active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Library */}
        {activeTab === "evidence" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <Library size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Evidence Library
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 20px" }}>
              Centralised evidence storage for policy development. Links to MHIH Evidence Snapshots,
              research outputs, and external sources.
            </p>
            <Link
              to={createPageUrl("EvidenceSnapshots")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(244,114,182,0.1)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.25)" }}
            >
              Open Evidence Snapshots <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Approvals */}
        {activeTab === "approvals" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <ClipboardCheck size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Review & Approval
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 20px" }}>
              Policy approvals, governance signoffs, and cultural review checkpoints.
              Wiring to the MHIH Approvals Inbox and workflow engine in progress.
            </p>
            <Link
              to={createPageUrl("ApprovalsInbox")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(244,114,182,0.1)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.25)" }}
            >
              Open Approvals Inbox <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
