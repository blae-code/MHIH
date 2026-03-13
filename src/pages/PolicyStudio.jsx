/**
 * Policy Studio — Red River OS
 *
 * Policy development lifecycle tool.
 * Supports the Métis policy journey from Rechèrche through Nispaahtoon,
 * with registry, stage tracking, evidence library, and approval workflows.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Scale, Library, ClipboardCheck,
  Plus, ChevronRight, AlertTriangle,
  Search, ArrowRight,
  BookOpen, ExternalLink,
  User, Calendar, ThumbsUp, MessageSquare,
  CircleDot,
} from "lucide-react";

// ── Policy lifecycle stages ────────────────────────────────────────────────
const LIFECYCLE_STAGES = [
  {
    key: "recherche",
    label: "Rechèrche",
    description: "Research, evidence scanning, and environmental analysis.",
    color: "#a78bfa",
    detail: "Grounded in Métis ways of knowing — gathering evidence, environmental scan, community context, and existing literature before any policy direction is set.",
  },
  {
    key: "kashkihtamowin",
    label: "Kashkihtamowin",
    description: "Building capacity and internal readiness.",
    color: "#40c4ff",
    detail: "Ensuring the ministry and its teams have the knowledge, tools, and capacity to lead the policy process — training, resource allocation, and internal alignment.",
  },
  {
    key: "kiinaymaakinan",
    label: "Kiinaymaakinan",
    description: "Relationship building with partners and communities.",
    color: "#34d399",
    detail: "Establishing or deepening trust with health authorities, federal partners, community organizations, and Métis citizens before formal consultation begins.",
  },
  {
    key: "li-liain",
    label: "Li Liain",
    description: "Dialogue, consultation, and community engagement.",
    color: "#FEDD00",
    detail: "Meaningful, structured engagement with Métis communities, citizens, and rights holders. Consent and input — not just information-sharing — drive the direction.",
  },
  {
    key: "apoorbaa",
    label: "Apoorbaa",
    description: "Decision-making and formal resolution.",
    color: "#fb923c",
    detail: "Governance bodies deliberate and reach a formal decision. Cultural review, legal analysis, equity assessment, and leadership signoff all occur here.",
  },
  {
    key: "apihtowachik",
    label: "Apihtowachik",
    description: "Implementation and operationalisation.",
    color: "#f472b6",
    detail: "The policy moves into practice — coordination with partners, resource deployment, training, and systems integration.",
  },
  {
    key: "nispaahtoon",
    label: "Nispaahtoon",
    description: "Monitoring, accountability, and continuous improvement.",
    color: "#00e676",
    detail: "Ongoing measurement of outcomes against the policy's goals. Accountability to the community, reporting cycles, and learning loops to refine the approach.",
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
    priority: "high",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "high",
  },
  {
    id: 6,
    title: "Traditional Medicine Integration Protocol",
    stage: "recherche",
    portfolio: "Health Policy Implementation",
    owner: "MHIH Policy Team",
    lastUpdated: "2025-03-05",
    status: "draft",
    tags: ["traditional-medicine", "integration"],
    priority: "medium",
  },
  {
    id: 7,
    title: "Métis Women's Health Initiative Policy",
    stage: "kiinaymaakinan",
    portfolio: "Health Equity",
    owner: "Health Equity Team",
    lastUpdated: "2025-02-20",
    status: "in-progress",
    tags: ["women's-health", "equity", "partnership"],
    priority: "medium",
  },
];

// ── Evidence items ─────────────────────────────────────────────────────────
const EVIDENCE_ITEMS = [
  {
    id: 1,
    title: "FNHA Cultural Safety and Humility Model",
    type: "Framework",
    source: "First Nations Health Authority",
    year: 2015,
    linkedPolicies: [1, 5],
    relevance: "high",
    notes: "Foundational reference for culturally safe care standards.",
  },
  {
    id: 2,
    title: "Métis Nation Mental Health Dialogue Report 2024",
    type: "Community Report",
    source: "MNC Research Division",
    year: 2024,
    linkedPolicies: [2],
    relevance: "high",
    notes: "Primary community evidence base for the Mental Health Strategy.",
  },
  {
    id: 3,
    title: "Diabetes in Indigenous Populations — BC Evidence Review",
    type: "Evidence Review",
    source: "BCCDC",
    year: 2023,
    linkedPolicies: [3],
    relevance: "high",
    notes: "Epidemiological baseline for diabetes prevention policy.",
  },
  {
    id: 4,
    title: "OCAP® Principles — FNIGC",
    type: "Principles Document",
    source: "First Nations Information Governance Centre",
    year: 2023,
    linkedPolicies: [4],
    relevance: "high",
    notes: "Core data sovereignty framework — adapted for Métis context.",
  },
  {
    id: 5,
    title: "Addressing Anti-Indigenous Racism in BC Health Care",
    type: "Government Report",
    source: "Addressing Racism Review (Turpel-Lafond)",
    year: 2020,
    linkedPolicies: [5],
    relevance: "critical",
    notes: "Foundational report driving anti-racism policy obligations.",
  },
  {
    id: 6,
    title: "Traditional Medicine in Canadian Indigenous Communities — Scoping Review",
    type: "Scoping Review",
    source: "Canadian Journal of Public Health",
    year: 2022,
    linkedPolicies: [6],
    relevance: "medium",
    notes: "Background for integration protocol development.",
  },
];

// ── Pending approvals ──────────────────────────────────────────────────────
const PENDING_APPROVALS = [
  {
    id: 1,
    policy: "Anti-Racism Action Plan — Health Sector",
    policyId: 5,
    type: "Cultural Review",
    requestedBy: "Health Equity Team",
    requestedDate: "2025-03-10",
    dueDate: "2025-03-24",
    status: "pending",
    reviewers: ["Director, Health Equity", "Cultural Safety Advisor"],
    notes: "Requires cultural review before Governance signoff at Apoorbaa stage.",
  },
  {
    id: 2,
    policy: "Mental Health Strategy 2025–28",
    policyId: 2,
    type: "Community Engagement Sign-off",
    requestedBy: "Provincial Wellness Team",
    requestedDate: "2025-03-01",
    dueDate: "2025-03-31",
    status: "in-review",
    reviewers: ["VP, Community Engagement", "Métis Community Representatives"],
    notes: "Li Liain phase complete — sign-off confirming community voice was incorporated.",
  },
  {
    id: 3,
    policy: "Data Sovereignty & Governance Framework",
    policyId: 4,
    type: "Legal Review",
    requestedBy: "Research Team",
    requestedDate: "2025-02-28",
    dueDate: "2025-03-20",
    status: "overdue",
    reviewers: ["Legal Counsel"],
    notes: "Legal review of data sovereignty provisions — overdue by 3 days.",
  },
];

// ── Static config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: "Active", color: "#00e676" },
  "in-progress": { label: "In Progress", color: "#40c4ff" },
  monitoring: { label: "Monitoring", color: "#a78bfa" },
  review: { label: "In Review", color: "#FEDD00" },
  draft: { label: "Draft", color: "var(--text-muted)" },
};

const EVIDENCE_RELEVANCE = {
  critical: { label: "Critical", color: "#ff4d4f" },
  high: { label: "High", color: "#00e676" },
  medium: { label: "Medium", color: "#40c4ff" },
  low: { label: "Low", color: "var(--text-muted)" },
};

const APPROVAL_STATUS = {
  pending: { label: "Pending", color: "#ffab40" },
  "in-review": { label: "In Review", color: "#40c4ff" },
  overdue: { label: "Overdue", color: "#ff4d4f" },
  approved: { label: "Approved", color: "#00e676" },
  rejected: { label: "Returned", color: "#a78bfa" },
};

const EVIDENCE_TYPE_COLORS = {
  "Framework": "#a78bfa",
  "Community Report": "#34d399",
  "Evidence Review": "#40c4ff",
  "Principles Document": "#FEDD00",
  "Government Report": "#fb923c",
  "Scoping Review": "#f472b6",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function StageChip({ stageKey, small = false }) {
  const stage = LIFECYCLE_STAGES.find((s) => s.key === stageKey);
  if (!stage) return null;
  return (
    <span
      style={{
        fontSize: small ? 9 : 10,
        fontWeight: 600,
        color: stage.color,
        background: stage.color + "18",
        border: `1px solid ${stage.color}33`,
        padding: small ? "1px 5px" : "2px 7px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {stage.label}
    </span>
  );
}

function StatusChip({ status, cfg }) {
  const c = cfg[status] ?? { label: status, color: "var(--text-muted)" };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: c.color,
        background: c.color + "18",
        border: `1px solid ${c.color}33`,
        padding: "2px 6px",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PolicyStudio() {
  const [activeTab, setActiveTab] = useState("registry");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStage, setExpandedStage] = useState(null);

  const filteredPolicies = DEMO_POLICIES.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.includes(searchQuery.toLowerCase())) ||
      p.portfolio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highPriority = DEMO_POLICIES.filter((p) => p.priority === "high").length;
  const inDialogue = DEMO_POLICIES.filter((p) => p.stage === "li-liain").length;
  const overdueReviews = PENDING_APPROVALS.filter((a) => a.status === "overdue").length;
  const pendingReviews = PENDING_APPROVALS.filter((a) => a.status === "pending" || a.status === "in-review").length;

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
                Policy development lifecycle, registry, evidence management, and approval workflows — grounded in Métis governance values.
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

        {/* Stat bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Policies Tracked", value: DEMO_POLICIES.length, color: "#f472b6" },
            { label: "High Priority", value: highPriority, color: "#fb923c" },
            { label: "In Community Dialogue", value: inDialogue, color: "#FEDD00" },
            {
              label: "Pending Review",
              value: overdueReviews > 0 ? `${pendingReviews} · ${overdueReviews} overdue` : pendingReviews,
              color: overdueReviews > 0 ? "#ff4d4f" : "#40c4ff",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderTop: `2px solid ${s.color}` }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg flex-wrap" style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
          {["registry", "lifecycle", "evidence", "approvals"].map((tab) => {
            const labels = {
              registry: "Policy Registry",
              lifecycle: "Lifecycle Stages",
              evidence: "Evidence Library",
              approvals: "Review & Approval",
            };
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

        {/* ── Policy Registry ───────────────────────────────────────────── */}
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
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
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(244,114,182,0.3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                  >
                    <Scale size={16} style={{ color: "#f472b6", flexShrink: 0, marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1.5">
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{policy.title}</h3>
                        <StatusChip status={policy.status} cfg={STATUS_CONFIG} />
                        {policy.priority === "high" && (
                          <span
                            style={{
                              fontSize: 9, fontWeight: 700, color: "#fb923c",
                              background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)",
                              padding: "2px 5px", borderRadius: 3, letterSpacing: "0.04em",
                            }}
                          >
                            HIGH PRIORITY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{policy.portfolio}</span>
                        <span style={{ color: "var(--border-subtle)", fontSize: 11 }}>·</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Owner: {policy.owner}</span>
                        <span style={{ color: "var(--border-subtle)", fontSize: 11 }}>·</span>
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
              {filteredPolicies.length === 0 && (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <Search size={24} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No policies match your search.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Lifecycle Stages ──────────────────────────────────────────── */}
        {activeTab === "lifecycle" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              The Métis policy lifecycle reflects the Nation's governance values — from grounded research through
              community dialogue to accountable implementation and continuous improvement. Each stage has cultural
              and procedural significance that must be honoured.
            </p>

            {/* Stage pipeline */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
              {LIFECYCLE_STAGES.map((stage, i) => (
                <React.Fragment key={stage.key}>
                  <button
                    onClick={() => setExpandedStage(expandedStage === stage.key ? null : stage.key)}
                    className="flex flex-col items-center gap-1 shrink-0 rounded-lg px-3 py-2 transition-all"
                    style={{
                      background: expandedStage === stage.key ? stage.color + "18" : "var(--bg-elevated)",
                      border: `1px solid ${expandedStage === stage.key ? stage.color + "55" : "var(--border-subtle)"}`,
                      minWidth: 90,
                    }}
                  >
                    <CircleDot size={12} style={{ color: stage.color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: stage.color, textAlign: "center" }}>
                      {stage.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9, color: "var(--text-muted)",
                        background: "var(--bg-overlay)", borderRadius: 3, padding: "0 4px",
                      }}
                    >
                      {DEMO_POLICIES.filter((p) => p.stage === stage.key).length} active
                    </span>
                  </button>
                  {i < LIFECYCLE_STAGES.length - 1 && (
                    <ChevronRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="space-y-3">
              {LIFECYCLE_STAGES.map((stage, i) => {
                const isExpanded = expandedStage === stage.key;
                const stagePolicies = DEMO_POLICIES.filter((p) => p.stage === stage.key);
                return (
                  <div
                    key={stage.key}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      borderLeft: `3px solid ${stage.color}`,
                    }}
                  >
                    <button
                      className="w-full p-4 text-left flex items-start justify-between gap-4"
                      onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                    >
                      <div className="flex-1">
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Stage {i + 1}</div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: stage.color, marginBottom: 3 }}>
                          {stage.label}
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{stage.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {stagePolicies.length > 0 && (
                          <span
                            style={{
                              fontSize: 10, fontWeight: 600, color: stage.color,
                              background: stage.color + "18", border: `1px solid ${stage.color}33`,
                              padding: "2px 7px", borderRadius: 4,
                            }}
                          >
                            {stagePolicies.length} {stagePolicies.length === 1 ? "policy" : "policies"}
                          </span>
                        )}
                        <ChevronRight
                          size={12}
                          style={{
                            color: "var(--text-muted)",
                            transform: isExpanded ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${stage.color}22`, padding: "0 16px 16px" }}>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: stagePolicies.length ? 12 : 0, paddingTop: 12 }}>
                          {stage.detail}
                        </p>
                        {stagePolicies.length > 0 && (
                          <div className="space-y-2">
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.06em" }}>
                              POLICIES AT THIS STAGE
                            </div>
                            {stagePolicies.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2"
                                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                              >
                                <Scale size={12} style={{ color: stage.color, flexShrink: 0 }} />
                                <div className="flex-1 min-w-0">
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{p.title}</div>
                                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.portfolio} · {p.owner}</div>
                                </div>
                                <StatusChip status={p.status} cfg={STATUS_CONFIG} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Evidence Library ──────────────────────────────────────────── */}
        {activeTab === "evidence" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Centralised evidence store for policy development — research, government reports, community documents,
                and frameworks linked to active policies.
              </p>
              <Link
                to={createPageUrl("EvidenceSnapshots")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
              >
                Evidence Snapshots <ExternalLink size={11} />
              </Link>
            </div>

            <div className="space-y-3">
              {EVIDENCE_ITEMS.map((item) => {
                const typeColor = EVIDENCE_TYPE_COLORS[item.type] ?? "#a78bfa";
                const relCfg = EVIDENCE_RELEVANCE[item.relevance];
                const linked = item.linkedPolicies
                  .map((id) => DEMO_POLICIES.find((p) => p.id === id))
                  .filter(Boolean);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      borderLeft: `3px solid ${typeColor}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: typeColor + "18", border: `1px solid ${typeColor}33` }}
                      >
                        <BookOpen size={13} style={{ color: typeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap mb-1">
                          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</h3>
                          <span
                            style={{
                              fontSize: 10, fontWeight: 600, color: typeColor,
                              background: typeColor + "15", border: `1px solid ${typeColor}33`,
                              padding: "1px 6px", borderRadius: 3,
                            }}
                          >
                            {item.type}
                          </span>
                          <span
                            style={{
                              fontSize: 10, fontWeight: 600, color: relCfg.color,
                              background: relCfg.color + "15", border: `1px solid ${relCfg.color}33`,
                              padding: "1px 6px", borderRadius: 3,
                            }}
                          >
                            {relCfg.label} relevance
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                          {item.source} · {item.year}
                        </div>
                        {item.notes && (
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>{item.notes}</p>
                        )}
                        {linked.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Linked to:</span>
                            {linked.map((p) => (
                              <span
                                key={p.id}
                                style={{
                                  fontSize: 10, color: "#f472b6",
                                  background: "rgba(244,114,182,0.08)",
                                  border: "1px solid rgba(244,114,182,0.2)",
                                  padding: "1px 6px", borderRadius: 3,
                                }}
                              >
                                {p.title.length > 40 ? p.title.slice(0, 40) + "…" : p.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-4 rounded-xl p-4 flex items-center justify-between gap-4"
              style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border-subtle)" }}
            >
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {EVIDENCE_ITEMS.length} evidence items · {EVIDENCE_ITEMS.filter((e) => e.relevance === "critical").length} critical · {EVIDENCE_ITEMS.filter((e) => e.relevance === "high").length} high relevance
              </div>
              <Link
                to={createPageUrl("EvidenceSnapshots")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "#f472b6" }}
              >
                View all evidence snapshots <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Review & Approval ─────────────────────────────────────────── */}
        {activeTab === "approvals" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Policy approvals, governance signoffs, and cultural review checkpoints — ensuring each policy
                honours the appropriate Métis governance process at each lifecycle stage.
              </p>
              <Link
                to={createPageUrl("ApprovalsInbox")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
              >
                Approvals Inbox <ExternalLink size={11} />
              </Link>
            </div>

            {PENDING_APPROVALS.some((a) => a.status === "overdue") && (
              <div
                className="rounded-xl p-3 flex items-start gap-3 mb-4"
                style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.25)" }}
              >
                <AlertTriangle size={14} style={{ color: "#ff4d4f", flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: "#ff4d4f" }}>
                  <strong>{PENDING_APPROVALS.filter((a) => a.status === "overdue").length} review(s) overdue.</strong>{" "}
                  Action required to keep policy timelines on track.
                </div>
              </div>
            )}

            <div className="space-y-3">
              {PENDING_APPROVALS.map((approval) => {
                const statusCfg = APPROVAL_STATUS[approval.status] ?? APPROVAL_STATUS.pending;
                const policy = DEMO_POLICIES.find((p) => p.id === approval.policyId);

                return (
                  <div
                    key={approval.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-elevated)",
                      border: `1px solid ${approval.status === "overdue" ? "rgba(255,77,79,0.3)" : "var(--border-subtle)"}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: statusCfg.color + "18", border: `1px solid ${statusCfg.color}33` }}
                      >
                        <ClipboardCheck size={14} style={{ color: statusCfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap mb-1">
                          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                            {approval.type}
                          </h3>
                          <StatusChip status={approval.status} cfg={APPROVAL_STATUS} />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {policy && <StageChip stageKey={policy.stage} small />}
                          <span style={{ fontSize: 11, color: "#f472b6" }}>{approval.policy}</span>
                        </div>

                        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
                          {approval.notes}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            <User size={10} />
                            Requested by {approval.requestedBy}
                          </div>
                          <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            <Calendar size={10} />
                            Due {approval.dueDate}
                          </div>
                        </div>

                        {approval.reviewers.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Reviewers:</span>
                            {approval.reviewers.map((r) => (
                              <span
                                key={r}
                                style={{
                                  fontSize: 10, color: "var(--text-secondary)",
                                  background: "var(--bg-overlay)",
                                  border: "1px solid var(--border-subtle)",
                                  padding: "1px 6px", borderRadius: 3,
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
                          style={{ background: "rgba(0,230,118,0.1)", color: "#00e676", border: "1px solid rgba(0,230,118,0.25)" }}
                        >
                          <ThumbsUp size={11} /> Approve
                        </button>
                        <button
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
                          style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                        >
                          <MessageSquare size={11} /> Return
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-4 rounded-xl p-4 text-center"
              style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border-subtle)" }}
            >
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                {PENDING_APPROVALS.length} open reviews · Full approval history and workflow management in the Approvals Inbox.
              </div>
              <Link
                to={createPageUrl("ApprovalsInbox")}
                className="inline-flex items-center gap-2 text-xs font-semibold"
                style={{ color: "#f472b6" }}
              >
                Open Approvals Inbox <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
