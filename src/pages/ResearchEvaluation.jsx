/**
 * Research & Evaluation — Red River OS
 *
 * Research projects, evaluation plans, metrics frameworks, data governance,
 * and ROI / equity methodology.
 *
 * Status: scaffold — integration with MHIH data platform in progress.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FlaskConical, BookOpen, ClipboardList, Shield,
  TrendingUp, ArrowRight, ChevronRight, Plus,
  BarChart3, Database, FileText,
} from "lucide-react";

const RESEARCH_PROJECTS = [
  {
    id: 1,
    title: "Métis Health Equity Index Development",
    type: "Methods Development",
    status: "active",
    lead: "Research Team",
    phase: "Data collection",
    year: "2025",
  },
  {
    id: 2,
    title: "Chronic Disease Burden — Northern Métis Communities",
    type: "Epidemiological Study",
    status: "active",
    lead: "MHIH Analytics",
    phase: "Analysis",
    year: "2024–25",
  },
  {
    id: 3,
    title: "Cultural Safety Intervention Outcomes Evaluation",
    type: "Program Evaluation",
    status: "in-progress",
    lead: "Health Equity Team",
    phase: "Protocol design",
    year: "2025",
  },
  {
    id: 4,
    title: "Métis Mental Health & Wellness Survey",
    type: "Community Survey",
    status: "planning",
    lead: "Research Team",
    phase: "Ethics review",
    year: "2025–26",
  },
];

const EVALUATION_PLANS = [
  { program: "Mental Health Strategy 2025–28", framework: "Logic model + RCT", status: "approved" },
  { program: "Diabetes Prevention Initiative", framework: "Pre/post outcomes", status: "in-progress" },
  { program: "Culturally Safe Care Training", framework: "Kirkpatrick Model", status: "draft" },
];

const STATUS_COLORS = {
  active: "#00e676",
  "in-progress": "#40c4ff",
  planning: "#ffab40",
  approved: "#00e676",
  draft: "var(--text-muted)",
};

export default function ResearchEvaluation() {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">Red River OS · Research & Evaluation</div>
              <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
                Research & Evaluation
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Research projects, evaluation plans, data governance, and equity methodology.
              </p>
            </div>
            <div
              className="shrink-0 px-2 py-1 rounded text-xs font-semibold"
              style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              Beta Module
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #a78bfa, transparent 70%)", borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Projects", value: "4", color: "#a78bfa" },
            { label: "Evaluation Plans", value: "3", color: "#40c4ff" },
            { label: "Data Sources", value: "12", color: "#FEDD00" },
            { label: "Publications (YTD)", value: "2", color: "#34d399" },
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
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-elevated)", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
          {["projects", "evaluations", "governance", "roi"].map((tab) => {
            const labels = { projects: "Research Projects", evaluations: "Evaluation Plans", governance: "Data Governance", roi: "ROI & Methods" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab ? "rgba(167,139,250,0.1)" : "transparent",
                  color: activeTab === tab ? "#a78bfa" : "var(--text-muted)",
                  border: activeTab === tab ? "1px solid rgba(167,139,250,0.25)" : "1px solid transparent",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Research Projects */}
        {activeTab === "projects" && (
          <div className="space-y-3">
            {RESEARCH_PROJECTS.map((proj) => {
              const color = STATUS_COLORS[proj.status] ?? "var(--text-muted)";
              return (
                <div
                  key={proj.id}
                  className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}
                  >
                    <FlaskConical size={15} style={{ color: "#a78bfa" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      {proj.title}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{proj.type}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Phase: {proj.phase}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{proj.year}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, color,
                      background: color + "18", border: `1px solid ${color}33`,
                      padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                    }}
                  >
                    {proj.status.charAt(0).toUpperCase() + proj.status.slice(1).replace("-", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Evaluation Plans */}
        {activeTab === "evaluations" && (
          <div className="space-y-3">
            {EVALUATION_PLANS.map((plan) => {
              const color = STATUS_COLORS[plan.status] ?? "var(--text-muted)";
              return (
                <div
                  key={plan.program}
                  className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <ClipboardList size={16} style={{ color: "#a78bfa", flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1">
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      {plan.program}
                    </h3>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Framework: {plan.framework}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, color,
                      background: color + "18", border: `1px solid ${color}33`,
                      padding: "2px 7px", borderRadius: 4,
                    }}
                  >
                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Data Governance */}
        {activeTab === "governance" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <Shield size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Data Governance
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto 20px" }}>
              Métis data sovereignty, data sharing agreements, collection protocols, and privacy governance.
              Connected to the MHIH data governance and audit framework.
            </p>
            <Link
              to={createPageUrl("DataGovernance")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              Open Data Governance <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* ROI & Methods */}
        {activeTab === "roi" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <TrendingUp size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              ROI & Equity Methodology
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto 20px" }}>
              Return-on-investment modelling for health interventions, equity-weighted methodology,
              and health economics frameworks tailored to Métis context.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
