import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { BellRing, Plus, RefreshCw, Save, Trash2, Activity } from "lucide-react";

const CATEGORIES = ["all", "chronic_disease", "mental_health", "substance_use", "maternal_child", "social_determinants", "demographics", "mortality", "access_to_care", "other"];
const STATUSES = ["active", "paused", "archived"];

export default function Watchlists() {
  const { addLog } = useApp();
  const [missions, setMissions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "all",
    region: "all",
    metric_keywords: "",
    threshold_pct: 12,
    owner: "",
    status: "active",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        base44.entities.WatchlistMission.list("-updated_date", 300).catch(() => []),
        base44.entities.AlertEvent.filter({ alert_type: "watchlist_breach" }, "-created_date", 300).catch(() => []),
      ]);
      setMissions(m || []);
      setAlerts(a || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeCount = useMemo(() => missions.filter(m => m.status === "active").length, [missions]);

  const saveMission = async () => {
    if (!form.name.trim()) return;
    setWorking(true);
    try {
      const payload = {
        ...form,
        metric_keywords: form.metric_keywords.split(",").map(s => s.trim()).filter(Boolean),
      };
      if (selected?.id) {
        await base44.entities.WatchlistMission.update(selected.id, payload);
        addLog("success", "Mission updated");
      } else {
        await base44.entities.WatchlistMission.create({ ...payload, created_by: "workspace" });
        addLog("success", "Mission created");
      }
      resetForm();
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  const editMission = (m) => {
    setSelected(m);
    setForm({
      name: m.name || "",
      description: m.description || "",
      category: m.category || "all",
      region: m.region || "all",
      metric_keywords: Array.isArray(m.metric_keywords) ? m.metric_keywords.join(", ") : String(m.metric_keywords || ""),
      threshold_pct: Number(m.threshold_pct ?? 12),
      owner: m.owner || "",
      status: m.status || "active",
    });
  };

  const deleteMission = async (m) => {
    try {
      await base44.entities.WatchlistMission.delete(m.id);
      addLog("success", `Deleted mission: ${m.name}`);
      if (selected?.id === m.id) resetForm();
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
  };

  const resetForm = () => {
    setSelected(null);
    setForm({
      name: "",
      description: "",
      category: "all",
      region: "all",
      metric_keywords: "",
      threshold_pct: 12,
      owner: "",
      status: "active",
    });
  };

  const runDigest = async (missionId = null) => {
    setWorking(true);
    try {
      const res = await base44.functions.invoke("generateWatchlistDigest", missionId ? { mission_id: missionId } : {});
      addLog("success", `Watchlist digest complete (${res.data?.breaches || 0} breaches)`);
      await load();
    } catch (e) {
      addLog("error", e.message);
    }
    setWorking(false);
  };

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BellRing size={14} style={{ color: "var(--accent-primary)" }} />
            Watchlists & KPI Missions
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Mission-based monitoring with threshold breaches and automated digest generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => runDigest()} disabled={working} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "var(--accent-primary)", color: "#000" }}>
            {working ? <RefreshCw size={11} className="animate-spin" /> : <Activity size={11} />} Run Digest
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Missions" value={missions.length} color="var(--accent-primary)" />
        <Stat label="Active" value={activeCount} color="var(--color-success)" />
        <Stat label="Recent Breaches" value={alerts.filter(a => a.status === "open").length} color="var(--color-error)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-1 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Mission Form</div>
          <Field label="Mission Name"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></Field>
          <Field label="Description"><textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Region"><input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={inputStyle} /></Field>
            <Field label="Threshold %"><input type="number" value={form.threshold_pct} onChange={e => setForm(f => ({ ...f, threshold_pct: Number(e.target.value || 0) }))} style={inputStyle} /></Field>
          </div>
          <Field label="Metric Keywords (comma separated)"><input value={form.metric_keywords} onChange={e => setForm(f => ({ ...f, metric_keywords: e.target.value }))} style={inputStyle} placeholder="opioid, depression, maternal" /></Field>
          <Field label="Owner"><input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} style={inputStyle} /></Field>
          <div className="flex items-center gap-2">
            <button onClick={saveMission} disabled={working} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "var(--accent-primary)", color: "#000" }}>
              {selected ? <Save size={11} /> : <Plus size={11} />} {selected ? "Update" : "Create"}
            </button>
            {selected && <button onClick={resetForm} className="px-3 py-1.5 rounded text-xs" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>Clear</button>}
          </div>
        </div>

        <div className="metric-card xl:col-span-2 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Mission Registry</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1 max-h-72 overflow-auto">
              {missions.map(m => (
                <div key={m.id} className="p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: selected?.id === m.id ? "var(--bg-hover)" : "var(--bg-overlay)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => editMission(m)} className="text-left flex-1">
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {m.category?.replace(/_/g, " ")} · {m.region} · threshold {m.threshold_pct}% · {m.status}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>Last run: {m.last_run_at ? new Date(m.last_run_at).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" }) : "never"}</div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => runDigest(m.id)} className="activity-icon" style={{ width: 22, height: 22 }} title="Run mission digest">
                        <BellRing size={10} />
                      </button>
                      <button onClick={() => deleteMission(m)} className="activity-icon" style={{ width: 22, height: 22, color: "var(--color-error)" }} title="Delete mission">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!missions.length && !loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No missions defined yet.</div>}
            </div>

            <div className="rounded-lg p-3" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Recent Watchlist Breaches</div>
              <div className="space-y-1 max-h-64 overflow-auto">
                {alerts.slice(0, 80).map(a => (
                  <div key={a.id} className="px-2 py-1.5 rounded text-xs" style={{ border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{a.summary}</div>
                    <div style={{ color: "var(--text-muted)" }}>{a.metric_name} · {a.region} · {a.severity}</div>
                    <div style={{ color: a.status === "open" ? "var(--color-error)" : "var(--color-success)" }}>{a.status}</div>
                  </div>
                ))}
                {!alerts.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No watchlist breaches logged yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading watchlists...</div>}
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>{children}</div>;
}

function Stat({ label, value, color }) {
  return <div className="metric-card"><div className="text-xl font-bold" style={{ color }}>{value}</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div></div>;
}

const inputStyle = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  fontSize: 12,
  outline: "none",
};
