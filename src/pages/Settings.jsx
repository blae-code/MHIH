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
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Manage your profile and workspace preferences</p>
      </div>

      {/* Profile */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Profile</div>
        <div className="p-4 rounded-lg space-y-3"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Full Name</label>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.full_name || "—"}</div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.email || "—"}</div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Role</label>
            <div className="text-sm capitalize" style={{ color: "var(--accent-primary)" }}>{user?.role || "—"}</div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Department</label>
            <input
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              placeholder="e.g. Health Policy Implementation"
              className="w-full text-xs px-3 py-2 rounded-md outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="p-4 rounded-lg"
        style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)" }}>
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>BC Métis Health Intelligence Platform</div>
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          A data repository and analytics platform for Métis-specific health metrics in British Columbia.
          Built for the Senior Manager of Health Policy Implementation.
        </div>
        <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Version 1.0 · 2026</div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        style={{ background: "var(--accent-primary)", color: "#000" }}>
        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}