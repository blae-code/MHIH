import React, { useState } from "react";
import { X, Save } from "lucide-react";

const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];
const REGIONS = ["BC","Northern BC","Interior BC","Fraser","Vancouver Island","Vancouver Coastal","Provincial"];
const CONFIDENCE = ["high","medium","low"];

export default function MetricForm({ metric, onSave, onClose }) {
  const [form, setForm] = useState(metric || {
    name: "", category: "demographics", region: "BC", year: new Date().getFullYear(),
    value: "", unit: "", comparison_value: "", notes: "", confidence_level: "medium",
    data_source_name: "", tags: [], metis_specific: true
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, year: Number(form.year), value: Number(form.value), comparison_value: form.comparison_value ? Number(form.comparison_value) : undefined });
  };

  const input = "w-full text-xs px-3 py-2 rounded-md outline-none";
  const inputStyle = { background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {metric ? "Edit Metric" : "Add Health Metric"}
          </span>
          <button onClick={onClose} className="activity-icon" style={{ width: 26, height: 26 }}>
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: "80vh" }}>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Metric Name *</label>
            <input required className={input} style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Diabetes prevalence rate" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Category *</label>
              <select className={input} style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Region</label>
              <select className={input} style={inputStyle} value={form.region} onChange={e => set("region", e.target.value)}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Year *</label>
              <input required type="number" className={input} style={inputStyle} value={form.year} onChange={e => set("year", e.target.value)} placeholder="2024" />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Value *</label>
              <input required type="number" step="any" className={input} style={inputStyle} value={form.value} onChange={e => set("value", e.target.value)} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Unit</label>
              <input className={input} style={inputStyle} value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="%, per 100k" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>BC Pop. Comparison</label>
              <input type="number" step="any" className={input} style={inputStyle} value={form.comparison_value} onChange={e => set("comparison_value", e.target.value)} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Confidence</label>
              <select className={input} style={inputStyle} value={form.confidence_level} onChange={e => set("confidence_level", e.target.value)}>
                {CONFIDENCE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Data Source</label>
            <input className={input} style={inputStyle} value={form.data_source_name} onChange={e => set("data_source_name", e.target.value)} placeholder="e.g. Statistics Canada Table 13-10-0096-01" />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
            <textarea rows={2} className={input} style={inputStyle} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs"
              style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
              Cancel
            </button>
            <button type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "#000" }}>
              <Save size={11} /> {metric ? "Update" : "Add Metric"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}