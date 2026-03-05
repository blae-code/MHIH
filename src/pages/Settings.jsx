import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Save, RefreshCw, User, Bell, Shield, Palette } from "lucide-react";

export default function Settings() {
  const { user, addLog } = useApp();
  const [form, setForm] = useState({ department: "", preferences: {} });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ department: user.department || "", preferences: user.preferences || {} });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ department: form.department, preferences: form.preferences });
    addLog("success", "Settings saved");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)",
          borderColor: "var(--border-default)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(254,221,0,0.08)"
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 60%, transparent 100%)" }} />
        <div className="dashboard-section-label">Settings & Preferences</div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your profile and workspace preferences</p>
      </div>

    <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full space-y-6">

      {/* Profile Section */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-primary)", letterSpacing: "0.08em", fontSize: "10px", fontWeight: 700 }}>
          Profile Information
        </div>
        <div className="rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--bg-elevated) 0%, rgba(254,221,0,0.02) 100%)", border: "1px solid var(--border-subtle)" }}>
          <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Full Name</label>
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user?.full_name || "—"}</div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Email</label>
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user?.email || "—"}</div>
            </div>
          </div>

          <div className="h-px" style={{ background: "var(--border-subtle)" }} />

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Role</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
                  style={{ background: "rgba(254,221,0,0.1)", color: "var(--accent-primary)" }}>
                  {user?.role || "—"}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Department</label>
              <input
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Health Policy Implementation"
                className="w-full text-xs px-3 py-2 rounded-lg outline-none transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          </div>
          </div>
          </div>

          {/* About Section */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(254,221,0,0.05) 0%, rgba(64,196,255,0.03) 100%)", border: "1px solid rgba(254,221,0,0.15)" }}>
        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent-primary)", letterSpacing: "0.08em" }}>
              About MHIP
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The BC Métis Health Intelligence Platform is a comprehensive data repository and analytics system designed to track, analyze, and visualize Métis-specific health metrics across British Columbia.
            </p>
          </div>
          <div className="h-px" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Version 2.0 · 2026</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(46, 213, 115, 0.1)", color: "#2ea043" }}>
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a", boxShadow: "0 8px 24px rgba(254,221,0,0.2)" }}>
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
    </div>
  );
}