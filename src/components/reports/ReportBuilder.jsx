import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, ChevronDown, FileText } from "lucide-react";
import { listAllHealthMetrics } from "@/lib/healthMetrics";

const REGIONS = ["BC", "Northern BC", "Interior BC", "Fraser", "Vancouver Island", "Vancouver Coastal"];
const CHART_TYPES = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" },
  { value: "scatter", label: "Scatter Plot" },
  { value: "pie", label: "Pie Chart" },
  { value: "heatmap", label: "Heatmap" }
];

export default function ReportBuilder({ onReportCreated }) {
  const [step, setStep] = useState(1);
  const [metrics, setMetrics] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedCharts, setSelectedCharts] = useState(["bar", "line"]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await listAllHealthMetrics();
        setMetrics(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load metrics:", error);
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  const handleCreateReport = async () => {
    if (!title.trim() || selectedMetrics.length === 0) {
      alert("Please enter a title and select at least one metric");
      return;
    }

    setGenerating(true);
    try {
      const report = await base44.entities.Report.create({
        title,
        description,
        metric_ids: selectedMetrics,
        regions: selectedRegions.length > 0 ? selectedRegions : REGIONS,
        date_range: {
          start_date: dateRange.start || new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0],
          end_date: dateRange.end || new Date().toISOString().split('T')[0]
        },
        chart_types: selectedCharts,
        status: "generated",
        generated_at: new Date().toISOString()
      });
      onReportCreated(report);
      resetForm();
      setStep(1);
    } catch (error) {
      console.error("Failed to create report:", error);
      alert("Failed to create report");
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedMetrics([]);
    setSelectedRegions([]);
    setSelectedCharts(["bar", "line"]);
    setDateRange({ start: "", end: "" });
  };

  const toggleMetric = (id) => {
    setSelectedMetrics(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleRegion = (region) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const toggleChart = (chart) => {
    setSelectedCharts(prev =>
      prev.includes(chart) ? prev.filter(c => c !== chart) : [...prev, chart]
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1 h-1.5 rounded-full transition-colors"
            style={{ background: s <= step ? "var(--accent-primary)" : "var(--border-subtle)" }} />
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>Report Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q1 2026 Métis Health Summary"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add context or notes about this report..."
              rows="3"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>
          <button onClick={() => setStep(2)}
            className="w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "var(--accent-primary)", color: "#04245a" }}>
            Next: Select Metrics
          </button>
        </div>
      )}

      {/* Step 2: Metrics & Configuration */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Metrics Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Health Metrics</label>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(254,221,0,0.1)", color: "var(--accent-primary)" }}>
                {selectedMetrics.length} selected
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
              {loading ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading metrics...</p>
              ) : metrics.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No metrics available</p>
              ) : (
                metrics.map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[var(--bg-hover)] transition">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(m.id)}
                      onChange={() => toggleMetric(m.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium block truncate" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                      <span className="text-xs block" style={{ color: "var(--text-muted)" }}>{m.category}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Regions */}
          <div>
            <label className="text-xs font-semibold block mb-3 uppercase" style={{ color: "var(--text-muted)" }}>Regions (Leave blank for all)</label>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map(r => (
                <button key={r} onClick={() => toggleRegion(r)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: selectedRegions.includes(r) ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
                    color: selectedRegions.includes(r) ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: `1px solid ${selectedRegions.includes(r) ? "var(--accent-primary)" : "var(--border-default)"}`
                  }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2 uppercase" style={{ color: "var(--text-muted)" }}>End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 rounded-lg text-sm font-medium"
              style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
              Back
            </button>
            <button onClick={() => setStep(3)} className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent-primary)", color: "#04245a" }}>
              Next: Chart Types
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Chart Types & Generate */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-3 uppercase" style={{ color: "var(--text-muted)" }}>Chart Types to Include</label>
            <div className="grid grid-cols-2 gap-2">
              {CHART_TYPES.map(c => (
                <button key={c.value} onClick={() => toggleChart(c.value)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: selectedCharts.includes(c.value) ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
                    color: selectedCharts.includes(c.value) ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: `1px solid ${selectedCharts.includes(c.value) ? "var(--accent-primary)" : "var(--border-default)"}`
                  }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 px-4 py-3 rounded-lg text-sm font-medium"
              style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
              Back
            </button>
            <button onClick={handleCreateReport} disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
              {generating ? "Generating..." : <>
                <FileText size={14} />
                Generate Report
              </>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
