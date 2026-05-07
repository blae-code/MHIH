import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Plus, RefreshCw, Search, LayoutGrid, Table as TableIcon, Filter } from "lucide-react";
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

export default function PolicyRequestTable() {
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
        view="table"
      />

      <style>{`
        .prt-row { transition: background 0.15s ease, box-shadow 0.15s ease; }
        .prt-row:hover { background: rgba(254,221,0,0.05) !important; }
        .prt-row:hover td:first-child { box-shadow: inset 3px 0 0 #FEDD00; }
        .prt-table th {
          background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%);
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-default);
        }
        .prt-table td {
          padding: 11px 14px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 12px;
        }
        .prt-table tbody tr:last-child td { border-bottom: none; }
      `}</style>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={14} className="animate-spin" /> Loading requests…
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ color: "var(--text-muted)" }}>
            No requests yet. <button onClick={() => navigate(createPageUrl("PolicyRequestForm"))} className="underline" style={{ color: "#FEDD00" }}>Submit one →</button>
          </div>
        ) : (
          <div className="space-y-7">
            {grouped.map(([assignee, group]) => {
              const isUnassigned = assignee === "(Unassigned)";
              return (
                <div key={assignee}>
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: isUnassigned ? "var(--bg-overlay)" : "rgba(254,221,0,0.15)",
                        color: isUnassigned ? "var(--text-muted)" : "#FEDD00",
                        border: `1px solid ${isUnassigned ? "var(--border-default)" : "rgba(254,221,0,0.4)"}`,
                        fontSize: 10,
                      }}>
                      {isUnassigned ? "?" : assignee.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: isUnassigned ? "var(--text-muted)" : "var(--text-primary)", letterSpacing: "0.08em" }}>
                      {assignee}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: "var(--text-muted)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", fontSize: 10 }}>
                      {group.length} {group.length === 1 ? "request" : "requests"}
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    }}>
                    <table className="prt-table w-full" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }}>Title</th>
                          <th style={{ textAlign: "left" }}>Type</th>
                          <th style={{ textAlign: "left" }}>Department</th>
                          <th style={{ textAlign: "left" }}>Requester</th>
                          <th style={{ textAlign: "left" }}>Urgency</th>
                          <th style={{ textAlign: "left" }}>Status</th>
                          <th style={{ textAlign: "left" }}>Required By</th>
                          <th style={{ textAlign: "left" }}>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((r) => (
                          <tr key={r.id} className="prt-row" onClick={() => setActive(r)} style={{ cursor: "pointer" }}>
                            <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.request_title}</td>
                            <td style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{r.request_type?.replace(/_/g, " ")}</td>
                            <td style={{ color: "var(--text-secondary)" }}>{r.department}</td>
                            <td style={{ color: "var(--text-secondary)" }}>{r.contact_person_name}</td>
                            <td>
                              <span className="tag" style={{
                                color: URGENCY_COLORS[r.urgency],
                                borderColor: URGENCY_COLORS[r.urgency] + "55",
                                background: URGENCY_COLORS[r.urgency] + "15",
                                textTransform: "capitalize",
                              }}>{r.urgency}</span>
                            </td>
                            <td>
                              <span className="tag" style={{
                                color: STATUS_COLORS[r.current_status],
                                borderColor: STATUS_COLORS[r.current_status] + "55",
                                background: STATUS_COLORS[r.current_status] + "15",
                                textTransform: "capitalize",
                              }}>{r.current_status?.replace(/_/g, " ")}</span>
                            </td>
                            <td style={{ color: "var(--text-secondary)" }}>{r.required_completion_date || "—"}</td>
                            <td style={{ color: "var(--text-muted)" }}>{new Date(r.created_date).toLocaleDateString("en-CA")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export function Header({ navigate, rows, loading, onReload, search, setSearch, statusFilter, setStatusFilter, view }) {
  return (
    <div className="px-6 py-4 border-b shrink-0"
      style={{
        background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 45%, var(--bg-elevated) 100%)",
        borderColor: "var(--border-default)",
      }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="dashboard-section-label">Red River Module · Policy Requests</div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            All Policy Requests
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {rows.length} total · grouped by assignee
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <button onClick={() => navigate(createPageUrl("PolicyRequestTable"))}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
              style={{
                background: view === "table" ? "rgba(254,221,0,0.12)" : "transparent",
                color: view === "table" ? "#FEDD00" : "var(--text-muted)",
              }}>
              <TableIcon size={12} /> Table
            </button>
            <button onClick={() => navigate(createPageUrl("PolicyRequestCardView"))}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold"
              style={{
                background: view === "cards" ? "rgba(254,221,0,0.12)" : "transparent",
                color: view === "cards" ? "#FEDD00" : "var(--text-muted)",
              }}>
              <LayoutGrid size={12} /> Cards
            </button>
          </div>

          <button onClick={onReload} disabled={loading} className="activity-icon" title="Refresh">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>

          <button onClick={() => navigate(createPageUrl("PolicyRequestForm"))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ background: "#FEDD00", color: "#043673" }}>
            <Plus size={12} /> New Request
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md flex-1 max-w-sm"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
          <Search size={12} style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, requester, department, assignee…"
            className="bg-transparent outline-none flex-1 text-xs"
            style={{ color: "var(--text-primary)" }} />
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
          <Filter size={11} style={{ color: "var(--text-muted)" }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none text-xs cursor-pointer"
            style={{ color: "var(--text-primary)" }}>
            <option value="all" style={{ background: "#0f1829", color: "#f0f6ff" }}>All Statuses</option>
            <option value="submitted" style={{ background: "#0f1829", color: "#f0f6ff" }}>Submitted</option>
            <option value="received" style={{ background: "#0f1829", color: "#f0f6ff" }}>Received</option>
            <option value="in_review" style={{ background: "#0f1829", color: "#f0f6ff" }}>In Review</option>
            <option value="assigned" style={{ background: "#0f1829", color: "#f0f6ff" }}>Assigned</option>
            <option value="started" style={{ background: "#0f1829", color: "#f0f6ff" }}>Started</option>
            <option value="in_progress" style={{ background: "#0f1829", color: "#f0f6ff" }}>In Progress</option>
            <option value="proofing" style={{ background: "#0f1829", color: "#f0f6ff" }}>Proofing</option>
            <option value="sent_for_approval" style={{ background: "#0f1829", color: "#f0f6ff" }}>Sent for Approval</option>
            <option value="completed" style={{ background: "#0f1829", color: "#f0f6ff" }}>Completed</option>
            <option value="rejected" style={{ background: "#0f1829", color: "#f0f6ff" }}>Rejected</option>
            <option value="closed" style={{ background: "#0f1829", color: "#f0f6ff" }}>Closed</option>
          </select>
        </div>
      </div>
    </div>
  );
}