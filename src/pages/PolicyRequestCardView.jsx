import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Calendar, Building2, User as UserIcon, AlertTriangle } from "lucide-react";
import { Header, buildGroups } from "./PolicyRequestTable";
import PolicyRequestDetailModal from "../components/redriver/PolicyRequestDetailModal";

const STATUS_COLORS = {
  submitted: "#40c4ff",
  in_review: "#a78bfa",
  assigned: "#FEDD00",
  in_progress: "#fb923c",
  completed: "#52c41a",
  rejected: "#ff4d4f",
  closed: "#8bafd4",
};

const URGENCY_COLORS = {
  low: "#52c41a",
  medium: "#40c4ff",
  high: "#faad14",
  critical: "#ff4d4f",
};

export default function PolicyRequestCardView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("assignee");
  const [active, setActive] = useState(null);

  const { data: rows = [], isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: ["policy-requests"],
    queryFn: () => base44.entities.PolicyRequest.list("-created_date", 500),
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    staleTime: 0,
    gcTime: 0,
  });

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ["policy-requests"] });
    refetch();
  };

  const grouped = useMemo(
    () => buildGroups(rows, { search, statusFilter, urgencyFilter, groupBy }),
    [rows, search, statusFilter, urgencyFilter, groupBy]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header
        navigate={navigate}
        rows={rows}
        loading={loading || isFetching}
        onReload={load}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        urgencyFilter={urgencyFilter}
        setUrgencyFilter={setUrgencyFilter}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        view="cards"
      />

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={14} className="animate-spin" /> Loading requests…
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>No requests match your filters.</div>
        ) : (
          <div className="space-y-7">
            {grouped.map(([groupLabel, group]) => {
              const isPlaceholder = groupLabel.startsWith("(");
              const accentColor = groupBy === "status" ? STATUS_COLORS[group[0]?.current_status] :
                groupBy === "urgency" ? URGENCY_COLORS[group[0]?.urgency] : "#FEDD00";
              const initials = groupBy === "assignee" && !isPlaceholder
                ? groupLabel.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()
                : (groupLabel[0] || "?").toUpperCase();
              return (
                <div key={groupLabel}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: isPlaceholder ? "var(--bg-overlay)" : `${accentColor || "#FEDD00"}26`,
                        color: isPlaceholder ? "var(--text-muted)" : (accentColor || "#FEDD00"),
                        border: `1px solid ${isPlaceholder ? "var(--border-default)" : (accentColor || "#FEDD00") + "66"}`,
                        fontSize: 10,
                      }}>
                      {isPlaceholder ? "?" : initials}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: isPlaceholder ? "var(--text-muted)" : "var(--text-primary)", letterSpacing: "0.08em" }}>
                      {groupLabel}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: "var(--text-muted)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", fontSize: 10 }}>
                      {group.length} {group.length === 1 ? "request" : "requests"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((r) => (
                      <RequestCard key={r.id} request={r} onClick={() => setActive(r)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {active && (
        <PolicyRequestDetailModal
          request={active}
          onClose={() => setActive(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}

function RequestCard({ request, onClick }) {
  const statusColor = STATUS_COLORS[request.current_status] || "#8bafd4";
  const urgencyColor = URGENCY_COLORS[request.urgency] || "#40c4ff";
  const isHighPriority = request.urgency === "high" || request.urgency === "critical";

  return (
    <button onClick={onClick}
      className="prc-card text-left rounded-xl transition-all relative overflow-hidden group"
      style={{
        background: "linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)",
        border: `1px solid ${statusColor}33`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
      }}>
      <style>{`
        .prc-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${statusColor}77 !important;
          border-color: ${statusColor}88 !important;
        }
      `}</style>
      {/* Status accent bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}66 100%)`,
      }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span className="tag" style={{
            color: statusColor,
            borderColor: statusColor + "55",
            background: statusColor + "18",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "capitalize",
          }}>{request.current_status?.replace(/_/g, " ")}</span>
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{
              color: urgencyColor,
              background: urgencyColor + "15",
              border: `1px solid ${urgencyColor}44`,
              fontSize: 10,
              fontWeight: 600,
              textTransform: "capitalize",
            }}>
            {isHighPriority && <AlertTriangle size={10} />}
            {request.urgency}
          </span>
        </div>

        <h3 className="text-sm font-bold mb-1.5 line-clamp-2 leading-snug" style={{ color: "var(--text-primary)" }}>
          {request.request_title}
        </h3>

        <div className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {request.description}
        </div>

        <div className="space-y-1.5 pt-2.5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <Row icon={UserIcon} text={request.contact_person_name} />
          <Row icon={Building2} text={request.department} />
          {request.required_completion_date && (
            <Row icon={Calendar} text={`Due ${request.required_completion_date}`} />
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t"
          style={{ borderColor: "var(--border-subtle)", fontSize: 10, color: "var(--text-muted)" }}>
          <span style={{ textTransform: "capitalize" }}>{request.request_type?.replace(/_/g, " ")}</span>
          <span>{new Date(request.created_date).toLocaleDateString("en-CA")}</span>
        </div>
      </div>
    </button>
  );
}

function Row({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
      <Icon size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      <span className="truncate">{text}</span>
    </div>
  );
}