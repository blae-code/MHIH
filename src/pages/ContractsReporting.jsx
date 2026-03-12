/**
 * Contracts & Reporting — Red River OS
 *
 * Contribution agreements, deliverables, reporting deadlines,
 * budget tracking, and cashflow forecasting.
 *
 * Status: scaffold — data integration in progress.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FileSignature, CheckSquare, Calendar, DollarSign,
  AlertTriangle, ChevronRight, Plus, ArrowRight,
  TrendingUp, Clock,
} from "lucide-react";

const AGREEMENTS = [
  {
    id: 1,
    title: "Health Canada HIBC Contribution Agreement",
    funder: "Health Canada",
    value: "$2.4M",
    status: "active",
    expires: "Mar 31, 2026",
    deliverables: 12,
  },
  {
    id: 2,
    title: "BC Ministry of Health — Mental Health Partnership",
    funder: "BC MoH",
    value: "$890K",
    status: "active",
    expires: "Jun 30, 2025",
    deliverables: 8,
  },
  {
    id: 3,
    title: "FNHA — Métis-Specific Services Agreement",
    funder: "FNHA",
    value: "$450K",
    status: "renewal",
    expires: "Mar 31, 2025",
    deliverables: 5,
  },
  {
    id: 4,
    title: "Public Health Agency of Canada — Diabetes Prevention",
    funder: "PHAC",
    value: "$320K",
    status: "active",
    expires: "Sep 30, 2025",
    deliverables: 6,
  },
];

const UPCOMING_DEADLINES = [
  { title: "Q3 Progress Report — HIBC", due: "Mar 31", daysLeft: 19, urgency: "high" },
  { title: "Annual Workplan Update — BC MoH", due: "Apr 15", daysLeft: 34, urgency: "medium" },
  { title: "Midterm Evaluation — PHAC Diabetes", due: "Apr 30", daysLeft: 49, urgency: "medium" },
  { title: "FNHA Agreement Renewal Submission", due: "Apr 1", daysLeft: 20, urgency: "high" },
  { title: "Q4 Financial Report — HIBC", due: "Jun 30", daysLeft: 110, urgency: "low" },
];

const STATUS_COLORS = {
  active: "#00e676",
  renewal: "#ffab40",
  expired: "#ff4d4f",
  draft: "var(--text-muted)",
};

export default function ContractsReporting() {
  const [activeTab, setActiveTab] = useState("agreements");

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">Red River OS · Contracts & Reporting</div>
              <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
                Contracts & Reporting
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Contribution agreements, deliverables, reporting deadlines, and budget tracking.
              </p>
            </div>
            <div
              className="shrink-0 px-2 py-1 rounded text-xs font-semibold"
              style={{ background: "rgba(251,146,60,0.1)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" }}
            >
              Beta Module
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #fb923c, transparent 70%)", borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Agreements", value: "3", color: "#fb923c" },
            { label: "Total Portfolio", value: "$4.1M", color: "#FEDD00" },
            { label: "Overdue Deliverables", value: "1", color: "#ff4d4f" },
            { label: "Due Next 30 Days", value: "4", color: "#ffab40" },
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
          {["agreements", "deliverables", "calendar", "budget"].map((tab) => {
            const labels = { agreements: "Agreements", deliverables: "Deliverables", calendar: "Reporting Calendar", budget: "Budget & Cashflow" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab ? "rgba(251,146,60,0.1)" : "transparent",
                  color: activeTab === tab ? "#fb923c" : "var(--text-muted)",
                  border: activeTab === tab ? "1px solid rgba(251,146,60,0.25)" : "1px solid transparent",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Agreements */}
        {activeTab === "agreements" && (
          <div className="space-y-3">
            {AGREEMENTS.map((agr) => {
              const color = STATUS_COLORS[agr.status] ?? "var(--text-muted)";
              return (
                <div
                  key={agr.id}
                  className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}
                  >
                    <FileSignature size={15} style={{ color: "#fb923c" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      {agr.title}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Funder: {agr.funder}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Value: {agr.value}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Expires: {agr.expires}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{agr.deliverables} deliverables</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, color,
                      background: color + "18", border: `1px solid ${color}33`,
                      padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                    }}
                  >
                    {agr.status.charAt(0).toUpperCase() + agr.status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Calendar */}
        {activeTab === "calendar" && (
          <div className="space-y-2">
            {UPCOMING_DEADLINES.map((item) => {
              const urgencyColor = item.urgency === "high" ? "#ff4d4f" : item.urgency === "medium" ? "#ffab40" : "var(--text-muted)";
              return (
                <div
                  key={item.title}
                  className="rounded-xl px-4 py-3 flex items-center gap-4"
                  style={{ background: "var(--bg-elevated)", border: `1px solid ${urgencyColor}33`, borderLeft: `3px solid ${urgencyColor}` }}
                >
                  <Calendar size={14} style={{ color: urgencyColor, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Due {item.due}</div>
                  </div>
                  <div
                    className="shrink-0 px-2 py-1 rounded text-xs font-bold"
                    style={{ background: urgencyColor + "18", color: urgencyColor }}
                  >
                    {item.daysLeft}d
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Deliverables / Budget */}
        {(activeTab === "deliverables" || activeTab === "budget") && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {activeTab === "deliverables"
              ? <CheckSquare size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              : <DollarSign size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            }
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              {activeTab === "deliverables" ? "Deliverable Tracker" : "Budget & Cashflow"}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto" }}>
              {activeTab === "deliverables"
                ? "Structured deliverable tracking against each contribution agreement, with status, evidence, and submission history."
                : "Budget allocation, expenditure tracking, cashflow forecasting, and variance reporting against contribution agreements."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
