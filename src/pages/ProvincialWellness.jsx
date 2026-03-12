/**
 * Provincial Wellness — Red River OS
 *
 * Community-facing health initiatives, workshops, health promotion,
 * and regional coordination.
 *
 * Status: scaffold — data integration in progress.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Leaf, Activity, Users, MapPin, Heart,
  ArrowRight, ChevronRight, Plus, Calendar,
} from "lucide-react";

const INITIATIVES = [
  {
    id: 1,
    title: "Walking Together — Métis Wellness Circles",
    region: "Provincial",
    participants: "340+",
    status: "active",
    type: "Community Program",
  },
  {
    id: 2,
    title: "Land-Based Healing & Cultural Reconnection",
    region: "Northern BC",
    participants: "85",
    status: "active",
    type: "Cultural Program",
  },
  {
    id: 3,
    title: "Métis Seniors Wellness Initiative",
    region: "Interior BC",
    participants: "120",
    status: "active",
    type: "Elder Support",
  },
  {
    id: 4,
    title: "Youth Mental Health Peer Support Network",
    region: "Fraser",
    participants: "95",
    status: "in-progress",
    type: "Youth Program",
  },
  {
    id: 5,
    title: "Harvest & Nutrition Program",
    region: "Vancouver Island",
    participants: "60",
    status: "planning",
    type: "Food Security",
  },
];

const REGIONS = [
  { name: "Northern BC", programs: 4, coordinator: "TBD" },
  { name: "Interior BC", programs: 5, coordinator: "TBD" },
  { name: "Fraser", programs: 6, coordinator: "TBD" },
  { name: "Vancouver Island", programs: 3, coordinator: "TBD" },
  { name: "Vancouver Coastal", programs: 4, coordinator: "TBD" },
  { name: "Provincial", programs: 2, coordinator: "TBD" },
];

const STATUS_COLORS = {
  active: "#00e676",
  "in-progress": "#40c4ff",
  planning: "#ffab40",
};

export default function ProvincialWellness() {
  const [activeTab, setActiveTab] = useState("initiatives");

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="section-label mb-1">Red River OS · Provincial Wellness</div>
              <h1 className="mnbc-heading" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 4 }}>
                Provincial Wellness
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Community health initiatives, wellness programs, and regional coordination.
              </p>
            </div>
            <div
              className="shrink-0 px-2 py-1 rounded text-xs font-semibold"
              style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}
            >
              Beta Module
            </div>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, #4ade80, transparent 70%)", borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Initiatives", value: "3", color: "#4ade80" },
            { label: "Participants (Active)", value: "700+", color: "#40c4ff" },
            { label: "Regions Covered", value: "6", color: "#FEDD00" },
            { label: "Workshops (YTD)", value: "24", color: "#fb923c" },
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
          {["initiatives", "workshops", "regional", "engagement"].map((tab) => {
            const labels = { initiatives: "Initiatives", workshops: "Workshops", regional: "Regional", engagement: "Engagement" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab ? "rgba(74,222,128,0.1)" : "transparent",
                  color: activeTab === tab ? "#4ade80" : "var(--text-muted)",
                  border: activeTab === tab ? "1px solid rgba(74,222,128,0.25)" : "1px solid transparent",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Initiatives */}
        {activeTab === "initiatives" && (
          <div className="space-y-3">
            {INITIATIVES.map((init) => {
              const color = STATUS_COLORS[init.status] ?? "var(--text-muted)";
              return (
                <div
                  key={init.id}
                  className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}
                  >
                    <Leaf size={15} style={{ color: "#4ade80" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      {init.title}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{init.type}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        <MapPin size={10} style={{ display: "inline", marginRight: 2 }} />
                        {init.region}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        <Users size={10} style={{ display: "inline", marginRight: 2 }} />
                        {init.participants} participants
                      </span>
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

        {/* Regional */}
        {activeTab === "regional" && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {REGIONS.map((region) => (
              <div
                key={region.name}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} style={{ color: "#4ade80" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{region.name}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{region.programs} programs active</div>
              </div>
            ))}
          </div>
        )}

        {/* Workshops / Engagement */}
        {(activeTab === "workshops" || activeTab === "engagement") && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {activeTab === "workshops" ? (
              <Calendar size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            ) : (
              <Heart size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            )}
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              {activeTab === "workshops" ? "Workshop Calendar" : "Community Engagement"}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto" }}>
              {activeTab === "workshops"
                ? "Scheduling, registration, and delivery tracking for wellness workshops and cultural programming."
                : "LOU tracking, community consultation records, and engagement metrics across all initiatives."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
