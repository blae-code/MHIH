import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Download, FileText, BarChart3, Table, RefreshCw, CheckCircle } from "lucide-react";

const EXPORT_FORMATS = [
  { id: "csv", label: "CSV", desc: "Comma-separated values — compatible with Excel, SPSS, R", icon: Table },
  { id: "json", label: "JSON", desc: "Structured JSON data for developers and APIs", icon: FileText },
  { id: "summary", label: "Summary Report", desc: "AI-generated narrative summary of selected metrics", icon: BarChart3 },
];

export default function Export() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState("csv");
  const [filters, setFilters] = useState({ category: "all", region: "all", year: "all" });
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    base44.entities.HealthMetric.list("-year", 1000)
      .then(data => { setMetrics(data); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = metrics.filter(m => {
    const okCat = filters.category === "all" || m.category === filters.category;
    const okReg = filters.region === "all" || m.region === filters.region;
    const okYr = filters.year === "all" || String(m.year) === filters.year;
    return okCat && okReg && okYr;
  });

  const cats = [...new Set(metrics.map(m => m.category))].filter(Boolean);
  const regions = [...new Set(metrics.map(m => m.region))].filter(Boolean);
  const years = [...new Set(metrics.map(m => m.year))].filter(Boolean).sort((a,b)=>b-a);

  const handleExport = async () => {
    setGenerating(true);
    setDone(false);
    try {
      if (format === "csv") {
        const headers = ["Name","Category","Region","Year","Value","Unit","Comparison Value","Confidence","Source","Notes"];
        const rows = [headers, ...filtered.map(m => [
          m.name, m.category, m.region, m.year, m.value, m.unit || "",
          m.comparison_value || "", m.confidence_level || "", m.data_source_name || "", m.notes || ""
        ])];
        const csv = rows.map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
        download(new Blob([csv], { type: "text/csv" }), "metis_health_metrics.csv");
        addLog("success", `Exported ${filtered.length} records as CSV`);
      } else if (format === "json") {
        const json = JSON.stringify({ exported: new Date().toISOString(), count: filtered.length, data: filtered }, null, 2);
        download(new Blob([json], { type: "application/json" }), "metis_health_metrics.json");
        addLog("success", `Exported ${filtered.length} records as JSON`);
      } else if (format === "summary") {
        const summary = filtered.slice(0, 80).map(m =>
          `${m.name} (${m.category}, ${m.region}, ${m.year}): ${m.value} ${m.unit || ""}`
        ).join("\n");
        const prompt = `You are a health policy analyst for the BC Métis Nation. Generate a professional narrative summary report of the following Métis health metrics data for use in policy briefings and stakeholder presentations. Include key trends, disparities, and recommendations. Data:\n\n${summary}`;
        const result = await base44.integrations.Core.InvokeLLM({ prompt });
        const blob = new Blob([`BC MÉTIS HEALTH INTELLIGENCE PLATFORM\nSUMMARY REPORT — ${new Date().toLocaleDateString("en-CA")}\n\n${result}`], { type: "text/plain" });
        download(blob, "metis_health_summary_report.txt");
        addLog("success", "AI summary report exported");
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setGenerating(false);
    }
  };

  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Export Data</h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Export filtered health metrics as CSV, JSON, or an AI-generated summary report.
        </p>
      </div>

      {/* Format selection */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Export Format</div>
        {EXPORT_FORMATS.map(f => (
          <button key={f.id} onClick={() => setFormat(f.id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
            style={{
              background: format === f.id ? "var(--accent-muted)" : "var(--bg-elevated)",
              border: `1px solid ${format === f.id ? "var(--accent-primary)" : "var(--border-subtle)"}`,
            }}>
            <f.icon size={16} style={{ color: format === f.id ? "var(--accent-primary)" : "var(--text-muted)", flexShrink: 0 }} />
            <div>
              <div className="text-sm font-medium" style={{ color: format === f.id ? "var(--accent-primary)" : "var(--text-primary)" }}>{f.label}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Filter Data</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "category", options: cats, label: "Category" },
            { key: "region", options: regions, label: "Region" },
            { key: "year", options: years, label: "Year" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>{f.label}</label>
              <select
                value={filters[f.key]}
                onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded outline-none"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
                <option value="all">All</option>
                {f.options.map(o => <option key={o} value={String(o)}>{String(o).replace(/_/g," ")}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Preview count */}
      <div className="flex items-center justify-between p-3 rounded-lg"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Records to export</span>
        <span className="text-lg font-bold" style={{ color: "var(--accent-primary)" }}>
          {loading ? "—" : filtered.length.toLocaleString()}
        </span>
      </div>

      {/* Export button */}
      <button onClick={handleExport} disabled={generating || loading || filtered.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50"
        style={{ background: done ? "var(--color-success)" : "var(--accent-primary)", color: "#000" }}>
        {generating ? <RefreshCw size={15} className="animate-spin" />
          : done ? <CheckCircle size={15} />
          : <Download size={15} />}
        {generating ? "Generating..." : done ? "Export Complete!" : `Export as ${EXPORT_FORMATS.find(f=>f.id===format)?.label}`}
      </button>
    </div>
  );
}