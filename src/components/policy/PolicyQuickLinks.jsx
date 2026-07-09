/**
 * PolicyQuickLinks — navigation grid to every section of the Policy app.
 */

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FileSignature, ClipboardCheck, FlaskConical, ListOrdered,
  BellRing, Link2, Scale, Workflow,
} from "lucide-react";

const LINKS = [
  { label: "New Request", page: "PolicyRequestForm", icon: FileSignature, color: "#FEDD00", desc: "Submit a policy assistance request" },
  { label: "Requests", page: "PolicyRequestTable", icon: ClipboardCheck, color: "#40c4ff", desc: "Triage, assign, and track intake" },
  { label: "Policy Lab", page: "PolicyLab", icon: FlaskConical, color: "#f472b6", desc: "Scenario simulation and development" },
  { label: "Recommendations", page: "Recommendations", icon: ListOrdered, color: "#fb923c", desc: "Ranked, evidence-backed actions" },
  { label: "Policy Studio", page: "PolicyStudio", icon: Scale, color: "#a78bfa", desc: "Lifecycle registry and approvals" },
  { label: "Evidence Explorer", page: "EvidenceExplorer", icon: Link2, color: "#34d399", desc: "Link metrics to policy evidence" },
  { label: "Watchlists", page: "Watchlists", icon: BellRing, color: "#ff7ab8", desc: "Monitor metrics that matter" },
  { label: "Workflows", page: "Workflows", icon: Workflow, color: "#8bafd4", desc: "Automated policy workflows" },
];

export default function PolicyQuickLinks() {
  return (
    <div className="cockpit-widget-card">
      <div className="dashboard-section-label mb-3">Policy Lifecycle</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LINKS.map((l) => (
          <Link
            key={l.page + l.label}
            to={createPageUrl(l.page)}
            className="rounded-lg p-2.5 transition-all"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = l.color + "66"; e.currentTarget.style.boxShadow = `0 0 14px ${l.color}22`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <l.icon size={13} style={{ color: l.color, marginBottom: 6 }} />
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>{l.label}</div>
            <div style={{ fontSize: 8.5, color: "var(--text-muted)", lineHeight: 1.3, marginTop: 2 }}>{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}