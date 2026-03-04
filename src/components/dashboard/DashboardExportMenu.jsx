import React, { useState, useRef, useEffect } from "react";
import { Download, FileJson, FileText, Image, ChevronDown } from "lucide-react";

export default function DashboardExportMenu({ metrics, onExport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exportToCSV = () => {
    const cols = ["name", "category", "region", "year", "value", "comparison_value", "unit"];
    const header = cols.join(",");
    const rows = metrics.map((m) =>
      cols.map((c) => {
        const val = m[c] ?? "";
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      }).join(",")
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health_metrics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health_metrics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{
          background: open ? "rgba(254,221,0,0.12)" : "var(--bg-overlay)",
          border: `1px solid ${open ? "var(--accent-primary)" : "var(--border-subtle)"}`,
          color: open ? "var(--accent-primary)" : "var(--text-secondary)",
        }}
        title="Export dashboard data"
      >
        <Download size={13} />
        <span>Export</span>
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 rounded-lg overflow-hidden z-50 min-w-48 shadow-xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        >
          <button
            onClick={exportToCSV}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-left transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <FileText size={12} style={{ color: "#40C4FF" }} />
            <div className="flex-1">
              <div style={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: 1 }}>CSV Format</div>
              <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>Spreadsheet compatible</div>
            </div>
          </button>

          <div style={{ background: "var(--border-subtle)", height: "1px" }} />

          <button
            onClick={exportToJSON}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-left transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <FileJson size={12} style={{ color: "#2ED573" }} />
            <div className="flex-1">
              <div style={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: 1 }}>JSON Format</div>
              <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>Full data structure</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}