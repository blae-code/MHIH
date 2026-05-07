import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Calendar, Building2, User as UserIcon, AlertTriangle } from "lucide-react";
import { Header } from "./PolicyRequestTable";
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PolicyRequest.list("-created_date", 500);
      setRows(data || []);
    } catch (e) {
      console.warn(e?.message ?? e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const filtered = rows.filter((r) => {
      const matchesSearch = !search ||
        [r.request_title, r.contact_person_name, r.department, r.assigned_to_user_name]
          .some((v) => (v || "").toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || r.current_status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const groups = {};
    for (const r of filtered) {
      const key = r.assigned_to_user_name || "(Unassigned)";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "(Unassigned)") return -1;
      if (b === "(Unassigned)") return 1;
      return a.localeCompare(b);
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header
        navigate={navigate}
        rows={rows}
        loading={loading}
        onReload={load}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
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
          <div className="space-y-6">
            {grouped.map(([assignee, group]) => (
              <div key={assignee}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: assignee === "(Unassigned)" ? "var(--text-muted)" : "#FEDD00", letterSpacing: "0.08em" }}>
                    {assignee}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {group.length} {group.length === 1 ? "request" : "requests"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.map((r) => (
                    <RequestCard key={r.id} request={r} onClick={() => setActive(r)} />
                  ))}
                </div>
              </div>
            ))}
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

  return (
    <button onClick={onClick}
      className="text-left rounded-xl p-4 transition-all hover:translate-y-[-1px]"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${statusColor}33`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="tag" style={{
          color: statusColor,
          borderColor: statusColor + "55",
          background: statusColor + "15",
          fontSize: 10,
        }}>{request.current_status?.replace(/_/g, " ")}</span>
        {request.urgency === "high" || request.urgency === "critical" ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: urgencyColor }}>
            <AlertTriangle size={11} /> {request.urgency}
          </span>
        ) : (
          <span className="text-xs" style={{ color: urgencyColor }}>{request.urgency}</span>
        )}
      </div>

      <h3 className="text-sm font-bold mb-1.5 line-clamp-2" style={{ color: "var(--text-primary)" }}>
        {request.request_title}
      </h3>

      <div className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>
        {request.description}
      </div>

      <div className="space-y-1 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <Row icon={UserIcon} text={request.contact_person_name} />
        <Row icon={Building2} text={request.department} />
        {request.required_completion_date && (
          <Row icon={Calendar} text={`Due ${request.required_completion_date}`} />
        )}
      </div>

      <div className="text-xs mt-2 pt-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>
        {request.request_type?.replace(/_/g, " ")} · {new Date(request.created_date).toLocaleDateString("en-CA")}
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