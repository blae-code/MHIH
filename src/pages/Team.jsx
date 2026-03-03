import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { UserPlus, Mail, Shield, User, Eye, RefreshCw, Trash2 } from "lucide-react";

const ROLES = ["admin", "analyst", "viewer"];
const ROLE_COLORS = { admin: "var(--accent-primary)", analyst: "var(--color-info)", viewer: "var(--text-muted)" };
const ROLE_ICONS = { admin: Shield, analyst: User, viewer: Eye };

export default function Team() {
  const { user, addLog } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    base44.entities.User.list("-created_date", 100)
      .then(data => { setUsers(data); addLog("success", `${data.length} team members loaded`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    addLog("success", `Invited ${inviteEmail} as ${inviteRole}`);
    setInviteEmail("");
    setShowInvite(false);
    setInviting(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addLog("success", "Role updated");
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
      <Shield size={32} className="mb-3 opacity-30" />
      <p className="text-sm">Admin access required to manage team members.</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Team Management</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Manage access and roles for your MHIP workspace</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
          style={{ background: "var(--accent-primary)", color: "#000" }}>
          <UserPlus size={12} /> Invite Member
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map(role => {
          const RoleIcon = ROLE_ICONS[role];
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="metric-card flex items-center gap-3">
              <RoleIcon size={18} style={{ color: ROLE_COLORS[role] }} />
              <div>
                <div className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{role}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{count} member{count !== 1 ? "s" : ""}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User list */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Members</div>
        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={14} className="animate-spin" />
          </div>
        ) : users.map(u => {
          const RoleIcon = ROLE_ICONS[u.role] || User;
          return (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "var(--bg-overlay)", color: ROLE_COLORS[u.role] }}>
                  {u.full_name?.[0] || u.email?.[0] || "?"}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {u.full_name || "—"}
                    {u.email === "blae@katrasoluta.com" && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", fontSize: 9 }}>
                        SYSTEM ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Mail size={10} /> {u.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role || "viewer"}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={u.email === "blae@katrasoluta.com"}
                  className="text-xs px-2 py-1 rounded outline-none"
                  style={{
                    background: "var(--bg-overlay)",
                    border: `1px solid ${ROLE_COLORS[u.role] || "var(--border-subtle)"}`,
                    color: ROLE_COLORS[u.role] || "var(--text-muted)",
                    opacity: u.email === "blae@katrasoluta.com" ? 0.6 : 1
                  }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-sm rounded-xl p-6 space-y-4 shadow-2xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Invite Team Member</h3>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Work Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@organization.ca"
                className="w-full text-xs px-3 py-2 rounded-md outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowInvite(false)}
                className="px-3 py-1.5 rounded-md text-xs"
                style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                Cancel
              </button>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "#000" }}>
                {inviting ? <RefreshCw size={11} className="animate-spin" /> : <Mail size={11} />}
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}