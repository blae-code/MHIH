import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { UserPlus, Mail, Shield, User, Eye, RefreshCw, Trash2 } from "lucide-react";

const SYSTEM_ADMIN_EMAIL = "blae@katrasoluta.com";
const ROLES = ["admin", "user"];
const ROLE_COLORS = { admin: "var(--accent-primary)", user: "var(--color-info)" };
const ROLE_ICONS = { admin: Shield, user: User };

export default function Team() {
  const { user, addLog } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    base44.functions.invoke("normalizeUserRoles", { dry_run: false, limit: 3000 })
      .catch(() => null)
      .then(() => base44.entities.User.list("-created_date", 200))
      .then(data => {
        const normalized = (data || []).map((u) => {
          const email = String(u.email || "").toLowerCase();
          const expectedRole = email === SYSTEM_ADMIN_EMAIL ? "admin" : (u.role === "admin" ? "admin" : "user");
          return { ...u, role: expectedRole };
        });
        setUsers(normalized);
        addLog("success", `${normalized.length} team members loaded`);
      })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const inviteEmailTrimmed = inviteEmail.trim();
      const normalizedRole = inviteEmailTrimmed.toLowerCase() === SYSTEM_ADMIN_EMAIL ? "admin" : (inviteRole === "admin" ? "admin" : "user");
      await base44.users.inviteUser(inviteEmailTrimmed, normalizedRole);
      addLog("success", `Invited ${inviteEmailTrimmed} as ${normalizedRole}`);
      setInviteEmail("");
      setShowInvite(false);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    try {
      const normalizedRole = targetUser.email?.toLowerCase() === SYSTEM_ADMIN_EMAIL ? "admin" : (newRole === "admin" ? "admin" : "user");
      await base44.entities.User.update(targetUser.id, { role: normalizedRole });
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: normalizedRole } : u));
      addLog("success", "Role updated");
    } catch (e) {
      addLog("error", e.message);
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
      <Shield size={32} className="mb-3 opacity-30" />
      <p className="text-sm">Admin access required to manage team members.</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div className="relative z-10">
        <div className="dashboard-section-label">Team Management</div>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Manage access and roles for your MHIP workspace</p>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold mt-4 transition-all"
          style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 12px rgba(254,221,0,0.25)" }}>
          <UserPlus size={12} /> Invite Member
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {ROLES.map(role => {
          const RoleIcon = ROLE_ICONS[role];
          const count = users.filter(u => u.role === role).length;
          const colors = { admin: "#FEDD00", user: "#40c4ff" };
          return (
            <div key={role} className="rounded-xl p-5 transition-all"
              style={{
                background: "linear-gradient(135deg, var(--bg-elevated) 0%, rgba(254,221,0,0.02) 100%)",
                border: "1px solid var(--border-subtle)",
              }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ background: `${colors[role]}20` }}>
                  <RoleIcon size={18} style={{ color: colors[role] }} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors[role], letterSpacing: "0.05em" }}>{role}</div>
                  <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{count}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User list */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.08em", fontSize: "10px" }}>
          Team Members ({users.length})
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={14} className="animate-spin" /> Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-subtle)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No team members yet. Invite someone to get started.</p>
          </div>
        ) : users.map(u => {
          const RoleIcon = ROLE_ICONS[u.role] || User;
          return (
            <div key={u.id} className="flex items-center justify-between p-4 rounded-xl transition-all"
              style={{ background: "linear-gradient(135deg, var(--bg-elevated) 0%, rgba(254,221,0,0.02) 100%)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role] }}>
                  {u.full_name?.[0] || u.email?.[0] || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {u.full_name || "—"}
                    {u.email === SYSTEM_ADMIN_EMAIL && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full ml-2"
                        style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", fontSize: 9, fontWeight: 700 }}>
                        SYSTEM ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                    <Mail size={10} /> <span className="truncate">{u.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                   value={u.role || "user"}
                   onChange={e => handleRoleChange(u, e.target.value)}
                   disabled={u.email === SYSTEM_ADMIN_EMAIL}
                   className="text-xs px-3 py-1.5 rounded-lg outline-none font-semibold transition-all"
                   style={{
                     background: "var(--bg-overlay)",
                     border: `1.5px solid ${ROLE_COLORS[u.role] || "var(--border-subtle)"}`,
                     color: ROLE_COLORS[u.role] || "var(--text-muted)",
                     opacity: u.email === SYSTEM_ADMIN_EMAIL ? 0.6 : 1
                   }}>
                   {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)", border: "1px solid rgba(254,221,0,0.15)" }}>
            
            <div className="p-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)", fontFamily: "'Sofia Sans Extra Condensed', sans-serif" }}>
                Invite Team Member
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Send an invitation to a colleague</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Work Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@organization.ca"
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-all"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-all"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button onClick={() => setShowInvite(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                Cancel
              </button>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 4px 12px rgba(254,221,0,0.25)" }}>
                {inviting ? <RefreshCw size={12} className="animate-spin" /> : <Mail size={12} />}
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
