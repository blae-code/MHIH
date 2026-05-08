import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Plus, RefreshCw, Search, LayoutGrid, Table as TableIcon, Filter, X, Layers, Trash2 } from "lucide-react";
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

const GROUP_BY_OPTIONS = [
  { value: "assignee", label: "Assignee" },
  { value: "status", label: "Status" },
  { value: "urgency", label: "Urgency" },
  { value: "type", label: "Type" },
  { value: "department", label: "Department" },
];

const GROUP_BY_2_OPTIONS = [{ value: "none", label: "None" }, ...GROUP_BY_OPTIONS];

const GROUP_KEY_FNS = {
  assignee: (r) => r.assigned_to_user_name || "(Unassigned)",
  status: (r) => (r.current_status ? r.current_status.replace(/_/g, " ") : "(No status)"),
  urgency: (r) => r.urgency || "(No urgency)",
  type: (r) => (r.request_type ? r.request_type.replace(/_/g, " ") : "(No type)"),
  department: (r) => r.department || "(No department)",
};

const URGENCY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function sortEntries(entries, groupBy) {
  return entries.sort(([a], [b]) => {
    if (groupBy === "urgency") {
      const ao = URGENCY_ORDER[a] ?? 99;
      const bo = URGENCY_ORDER[b] ?? 99;
      if (ao !== bo) return ao - bo;
    }
    if (a.startsWith("(")) return -1;
    if (b.startsWith("(")) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Returns nested groups: [[label, items, subgroups?], ...]
 * subgroups (when groupBy2 !== "none") have shape [[subLabel, subItems], ...]
 */
export function buildGroups(rows, { search, statusFilter, groupBy, groupBy2 = "none" }) {
  const filtered = rows.filter((r) => {
    const matchesSearch = !search ||
      [r.request_title, r.contact_person_name, r.department, r.assigned_to_user_name]
        .some((v) => (v || "").toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ? true :
      statusFilter === "unassigned" ? !r.assigned_to_user_id :
      r.current_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const keyFn = GROUP_KEY_FNS[groupBy] || GROUP_KEY_FNS.assignee;
  const groups = {};
  for (const r of filtered) {
    const key = keyFn(r);
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  const sorted = sortEntries(Object.entries(groups), groupBy);

  if (groupBy2 === "none" || groupBy2 === groupBy) {
    return sorted.map(([label, items]) => [label, items, null]);
  }

  const subKeyFn = GROUP_KEY_FNS[groupBy2];
  return sorted.map(([label, items]) => {
    const subs = {};
    for (const r of items) {
      const k = subKeyFn(r);
      if (!subs[k]) subs[k] = [];
      subs[k].push(r);
    }
    return [label, items, sortEntries(Object.entries(subs), groupBy2)];
  });
}

export default function PolicyRequestTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("assignee");
  const [groupBy2, setGroupBy2] = useState("none");
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
    () => buildGroups(rows, { search, statusFilter, groupBy, groupBy2 }),
    [rows, search, statusFilter, groupBy, groupBy2]
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
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        groupBy2={groupBy2}
        setGroupBy2={setGroupBy2}
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
            {grouped.map(([groupLabel, group, subgroups]) => (
              <div key={groupLabel}>
                <GroupHeader label={groupLabel} count={group.length} groupBy={groupBy} sample={group[0]} size="primary" />
                {subgroups ? (
                  <div className="space-y-4 ml-3 pl-3 border-l" style={{ borderColor: "var(--border-subtle)" }}>
                    {subgroups.map(([subLabel, subItems]) => (
                      <div key={subLabel}>
                        <GroupHeader label={subLabel} count={subItems.length} groupBy={groupBy2} sample={subItems[0]} size="sub" />
                        <RequestsTable items={subItems} onRowClick={setActive} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <RequestsTable items={group} onRowClick={setActive} />
                )}
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

function GroupHeader({ label, count, groupBy, sample, size = "primary" }) {
  const isPlaceholder = label.startsWith("(");
  const accentColor = groupBy === "status" ? STATUS_COLORS[sample?.current_status] :
    groupBy === "urgency" ? URGENCY_COLORS[sample?.urgency] : "#FEDD00";
  const initials = groupBy === "assignee" && !isPlaceholder
    ? label.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()
    : (label[0] || "?").toUpperCase();
  const isSub = size === "sub";
  const dotSize = isSub ? 5 : 6;
  return (
    <div className={`flex items-center gap-2 px-1 ${isSub ? "mb-2 mt-1" : "mb-2.5"}`}>
      <span
        className="rounded-full flex items-center justify-center font-bold shrink-0"
        style={{
          width: dotSize * 4, height: dotSize * 4,
          background: isPlaceholder ? "var(--bg-overlay)" : `${accentColor || "#FEDD00"}26`,
          color: isPlaceholder ? "var(--text-muted)" : (accentColor || "#FEDD00"),
          border: `1px solid ${isPlaceholder ? "var(--border-default)" : (accentColor || "#FEDD00") + "66"}`,
          fontSize: isSub ? 9 : 10,
        }}>
        {isPlaceholder ? "?" : initials}
      </span>
      <span className="font-bold uppercase tracking-wider"
        style={{
          color: isPlaceholder ? "var(--text-muted)" : "var(--text-primary)",
          letterSpacing: "0.08em",
          fontSize: isSub ? 10 : 12,
        }}>
        {label}
      </span>
      <span className="px-2 py-0.5 rounded-full"
        style={{ color: "var(--text-muted)", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", fontSize: isSub ? 9 : 10 }}>
        {count} {count === 1 ? "request" : "requests"}
      </span>
    </div>
  );
}

function RequestsTable({ items, onRowClick }) {
  return (
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
          {items.map((r) => (
            <tr key={r.id} className="prt-row" onClick={() => onRowClick(r)} style={{ cursor: "pointer" }}>
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
  );
}

export { GroupHeader };

export function Header({
  navigate, rows, loading, onReload,
  search, setSearch,
  statusFilter, setStatusFilter,
  groupBy = "assignee", setGroupBy = () => {},
  groupBy2 = "none", setGroupBy2 = () => {},
  view,
}) {
  const filtersActive = (search && search.length > 0) || statusFilter !== "all";
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

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            disabled={!filtersActive}
            className="flex items-center justify-center rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              width: 28, height: 28,
              background: filtersActive ? "rgba(255,77,79,0.12)" : "var(--bg-overlay)",
              border: `1px solid ${filtersActive ? "rgba(255,77,79,0.5)" : "var(--border-default)"}`,
              color: filtersActive ? "#ff4d4f" : "var(--text-muted)",
            }}
            title="Clear all filters">
            <Trash2 size={12} />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
          <Filter size={10} style={{ color: "var(--text-muted)" }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none text-xs cursor-pointer"
            style={{ color: "var(--text-primary)" }}>
            <option value="all" style={{ background: "#0f1829", color: "#f0f6ff" }}>All Statuses</option>
            <option value="unassigned" style={{ background: "#0f1829", color: "#f0f6ff" }}>Unassigned</option>
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

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{ background: "rgba(254,221,0,0.06)", border: "1px solid rgba(254,221,0,0.3)" }}
          title="Group results by">
          <Layers size={10} style={{ color: "#FEDD00" }} />
          <span className="text-xs font-semibold" style={{ color: "#FEDD00" }}>Group by</span>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
            className="bg-transparent outline-none text-xs cursor-pointer font-semibold"
            style={{ color: "#FEDD00" }}>
            {GROUP_BY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "#0f1829", color: "#f0f6ff" }}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{
            background: groupBy2 !== "none" ? "rgba(254,221,0,0.06)" : "var(--bg-overlay)",
            border: `1px solid ${groupBy2 !== "none" ? "rgba(254,221,0,0.3)" : "var(--border-default)"}`,
            opacity: 1,
          }}
          title="Then group within each by">
          <Layers size={10} style={{ color: groupBy2 !== "none" ? "#FEDD00" : "var(--text-muted)" }} />
          <span className="text-xs font-semibold" style={{ color: groupBy2 !== "none" ? "#FEDD00" : "var(--text-muted)" }}>Then by</span>
          <select value={groupBy2} onChange={(e) => setGroupBy2(e.target.value)}
            className="bg-transparent outline-none text-xs cursor-pointer font-semibold"
            style={{ color: groupBy2 !== "none" ? "#FEDD00" : "var(--text-primary)" }}>
            {GROUP_BY_2_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} disabled={o.value !== "none" && o.value === groupBy}
                style={{ background: "#0f1829", color: "#f0f6ff" }}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}