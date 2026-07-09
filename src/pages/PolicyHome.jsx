/**
 * PolicyHome — Policy app command centre.
 *
 * The unified landing page for the merged Policy app (former Policy
 * Workbench + Policy Intake). Live view of the intake pipeline,
 * pending recommendations, open alerts, and quick access to every
 * section of the policy lifecycle — cockpit-calibre, matching the
 * Data & Evidence design system.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scale, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CockpitShell from "@/components/shell/CockpitShell";
import PolicyStatStrip from "@/components/policy/PolicyStatStrip";
import IntakePipelinePanel from "@/components/policy/IntakePipelinePanel";
import PolicyRecommendationsPanel from "@/components/policy/PolicyRecommendationsPanel";
import PolicyAlertsPanel from "@/components/policy/PolicyAlertsPanel";
import PolicyQuickLinks from "@/components/policy/PolicyQuickLinks";

export default function PolicyHome() {
  const [requests, setRequests] = useState(null);
  const [recs, setRecs] = useState(null);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      base44.entities.PolicyRequest.list("-created_date", 300).catch(() => []),
      base44.entities.Recommendation.filter({ approval_status: "pending" }, "-priority_score", 20).catch(() => []),
      base44.entities.AlertEvent.filter({ status: "open" }, "-detected_at", 20).catch(() => []),
    ]).then(([reqs, recRows, alertRows]) => {
      if (!alive) return;
      setRequests(reqs);
      setRecs(recRows);
      setAlerts(alertRows);
    });
    return () => { alive = false; };
  }, []);

  const loading = requests === null;

  return (
    <CockpitShell
      icon={<Scale size={16} style={{ color: "#f472b6" }} />}
      title="Policy · Command Centre"
      subtitle="Intake pipeline, active development, evidence, and monitoring — the full policy lifecycle"
      topGlow="rgba(244,114,182,0.06)"
      fitViewport
      actions={
        <Link
          to={createPageUrl("PolicyRequestForm")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold"
          style={{ background: "#FEDD00", color: "#043673" }}
        >
          <Plus size={12} /> New Request
        </Link>
      }
    >
      <div className="mb-3 shrink-0">
        <PolicyStatStrip requests={requests ?? []} recs={recs ?? []} alerts={alerts ?? []} loading={loading} />
      </div>

      <div className="cockpit-zone-grid">
        <div className="cockpit-zone">
          <IntakePipelinePanel requests={requests ?? []} loading={loading} />
          <PolicyQuickLinks />
        </div>
        <div className="cockpit-zone">
          <PolicyRecommendationsPanel recs={recs ?? []} loading={recs === null} />
          <PolicyAlertsPanel alerts={alerts ?? []} loading={alerts === null} />
        </div>
      </div>
    </CockpitShell>
  );
}