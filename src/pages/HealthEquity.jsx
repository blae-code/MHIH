/**
 * Health Equity — Red River OS
 *
 * Anti-racism initiatives, systems barriers tracking, complaints/feedback process,
 * and LOU / health authority workplan coordination.
 *
 * Status: scaffold — data integration in progress.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  HeartHandshake, Shield, MessageSquare, AlertTriangle,
  FileText, ArrowRight, Plus, ChevronRight,
  CheckCircle, Clock, Users, Map,
} from "lucide-react";

const ANTI_RACISM_INITIATIVES = [
  {
    id: 1,
    title: "Culturally Safe Care Training — Interior Health",
    status: "active",
    phase: "Implementation",
    reach: "~240 staff",
  },
  {
    id: 2,
    title: "Anti-Racism Complaint Review Process Redesign",
    status: "in-progress",
    phase: "Consultation",
    reach: "Provincial",
  },
  {
    id: 3,
    title: "Métis Cultural Competency Module — PHSA",
    status: "active",
    phase: "Monitoring",
    reach: "~180 staff",
  },
  {
    id: 4,
    title: "Northern Health Partnership — Cultural Safety MOU",
    status: "pending",
    phase: "Negotiation",
    reach: "Northern BC",
  },
];

const HA_WORKPLANS = [
  { ha: "Interior Health", status: "submitted", year: "2025–26", items: 8 },
  { ha: "Northern Health", status: "in-progress", year: "2025–26", items: 6 },
  { ha: "Fraser Health", status: "overdue", year: "2025–26", items: 7 },
  { ha: "Vancouver Island Health", status: "submitted", year: "2025–26", items: 5 },
  { ha: "Vancouver Coastal Health", status: "in-progress", year: "2025–26", items: 6 },
  { ha: "PHSA", status: "submitted", year: "2025–26", items: 4 },
];

const STATUS_COLORS = {
  active: "#00e676",
  "in-progress": "#40c4ff",
  pending: "#ffab40",
  submitted: "#00e676",
  overdue: "#ff4d4f",
  complete: "#a78bfa",
};

export default function HealthEquity() {
  const [activeTab, setActiveTab] = useState("anti-racism");

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">Red River OS · Health Equity</div>
              <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
                Health Equity
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Anti-racism initiatives, systems barriers, complaints process, and HA workplan coordination.
              </p>
            </div>
            <div
              className="shrink-0 px-2 py-1 rounded text-xs font-semibold"
              style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}
            >
              Beta Module
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #34d399, transparent 70%)", borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Stat bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Initiatives", value: "4", color: "#34d399" },
            { label: "HA Workplans", value: "6", color: "#40c4ff" },
            { label: "Open Complaints", value: "3", color: "#ffab40" },
            { label: "Barriers Tracked", value: "12", color: "#a78bfa" },
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
          {["anti-racism", "complaints", "barriers", "lous"].map((tab) => {
            const labels = { "anti-racism": "Anti-Racism", complaints: "Complaints", barriers: "Systems Barriers", lous: "LOU / HA Workplans" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab ? "rgba(52,211,153,0.1)" : "transparent",
                  color: activeTab === tab ? "#34d399" : "var(--text-muted)",
                  border: activeTab === tab ? "1px solid rgba(52,211,153,0.25)" : "1px solid transparent",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Anti-Racism */}
        {activeTab === "anti-racism" && (
          <div className="space-y-3">
            {ANTI_RACISM_INITIATIVES.map((init) => {
              const color = STATUS_COLORS[init.status] ?? "var(--text-muted)";
              return (
                <div
                  key={init.id}
                  className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
                  >
                    <Shield size={15} style={{ color: "#34d399" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      {init.title}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Phase: {init.phase}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Reach: {init.reach}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, color,
                      background: color + "18", border: `1px solid ${color}33`,
                      padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                    }}
                  >
                    {init.status.charAt(0).toUpperCase() + init.status.slice(1).replace("-", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Complaints */}
        {activeTab === "complaints" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <MessageSquare size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Complaints & Feedback System
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto 20px" }}>
              A structured process for documenting, tracking, and resolving complaints related to culturally
              unsafe care, racism, and systems barriers. Integration with case management in progress.
            </p>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              3 open · 1 escalated · 18 resolved (YTD)
            </div>
          </div>
        )}

        {/* Barriers */}
        {activeTab === "barriers" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <AlertTriangle size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Systems Barriers Registry
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto 20px" }}>
              Systematic tracking of identified barriers to equitable, culturally safe Métis health services.
              Barriers feed into policy recommendations and advocacy priorities.
            </p>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              12 barriers tracked · 4 in advocacy · 3 resolved
            </div>
          </div>
        )}

        {/* LOU / HA Workplans */}
        {activeTab === "lous" && (
          <div className="space-y-2">
            {HA_WORKPLANS.map((plan) => {
              const color = STATUS_COLORS[plan.status] ?? "var(--text-muted)";
              return (
                <div
                  key={plan.ha}
                  className="rounded-xl px-4 py-3 flex items-center gap-4"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: color + "18", border: `1px solid ${color}33` }}
                  >
                    <FileText size={13} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{plan.ha}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {plan.year} · {plan.items} workplan items
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, color,
                      background: color + "18", border: `1px solid ${color}33`,
                      padding: "2px 7px", borderRadius: 4,
                    }}
                  >
                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1).replace("-", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
