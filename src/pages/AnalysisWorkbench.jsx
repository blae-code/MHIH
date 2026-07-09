/**
 * AnalysisWorkbench — upload Excel/CSV files for comprehensive quantitative
 * analysis: table outputs, descriptive statistics, correlations, and charts.
 * Part of the Data & Evidence module.
 */

import React, { useMemo, useState } from "react";
import { FlaskConical, Table2, Sigma, BarChart3, X, FileSpreadsheet, MessageSquareText } from "lucide-react";
import ThematicAnalysisPanel from "@/components/workbench/ThematicAnalysisPanel";
import FileUploadPanel from "@/components/workbench/FileUploadPanel";
import DataTablePanel from "@/components/workbench/DataTablePanel";
import StatsSummaryPanel from "@/components/workbench/StatsSummaryPanel";
import ChartsPanel from "@/components/workbench/ChartsPanel";
import { inferColumns } from "@/lib/quantStats";

const TABS = [
  { id: "table", label: "Data Table", icon: Table2 },
  { id: "stats", label: "Statistics", icon: Sigma },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "themes", label: "Thematic", icon: MessageSquareText },
];

export default function AnalysisWorkbench() {
  const [dataset, setDataset] = useState(null); // { fileName, columns, rows }
  const [tab, setTab] = useState("table");

  const columnTypes = useMemo(
    () => (dataset ? inferColumns(dataset.columns, dataset.rows) : []),
    [dataset]
  );

  return (
    <div className="p-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(64,196,255,0.12)", border: "1px solid rgba(64,196,255,0.3)" }}>
          <FlaskConical size={16} style={{ color: "#40c4ff" }} />
        </div>
        <div>
          <h1 className="text-lg" style={{ color: "var(--text-primary)" }}>Analysis Workbench</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Upload Excel or CSV files for quantitative analysis — tables, statistics, and visualizations
          </p>
        </div>
      </div>

      {!dataset ? (
        <div className="depth-card-lg p-6">
          <FileUploadPanel onData={(d) => { setDataset(d); setTab("table"); }} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active dataset bar */}
          <div className="depth-card flex items-center gap-3 px-4 py-3 flex-wrap">
            <FileSpreadsheet size={14} style={{ color: "#40c4ff" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {dataset.fileName}
            </span>
            <span className="tag">
              {dataset.rows.length.toLocaleString()} rows · {dataset.columns.length} columns ·{" "}
              {columnTypes.filter((c) => c.type === "numeric").length} numeric
            </span>
            <div className="flex-1" />
            <FileUploadPanelInline onData={(d) => { setDataset(d); setTab("table"); }} />
            <button onClick={() => setDataset(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-colors"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              title="Clear dataset">
              <X size={11} /> Clear
            </button>
          </div>

          {/* Tabs + attached panel */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card, var(--bg-elevated))",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 4px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="flex items-end px-3 pt-2"
              style={{
                background: "linear-gradient(180deg, var(--bg-overlay) 0%, var(--bg-elevated) 100%)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      color: active ? "#40c4ff" : "var(--text-secondary)",
                      background: active
                        ? "linear-gradient(180deg, rgba(64,196,255,0.10) 0%, rgba(64,196,255,0.02) 100%)"
                        : "transparent",
                      borderRadius: "8px 8px 0 0",
                      border: active ? "1px solid var(--border-default)" : "1px solid transparent",
                      borderBottom: "none",
                      marginBottom: -1,
                    }}
                  >
                    <t.icon size={13} style={{ opacity: active ? 1 : 0.65 }} />
                    {t.label}
                    {active && (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute", left: 10, right: 10, top: 0, height: 2,
                          borderRadius: "0 0 2px 2px",
                          background: "#40c4ff",
                          boxShadow: "0 0 8px rgba(64,196,255,0.7)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Panels */}
            <div className="p-4">
              {tab === "table" && <DataTablePanel columns={dataset.columns} rows={dataset.rows} columnTypes={columnTypes} />}
              {tab === "stats" && <StatsSummaryPanel columns={dataset.columns} rows={dataset.rows} columnTypes={columnTypes} />}
              {tab === "charts" && <ChartsPanel columns={dataset.columns} rows={dataset.rows} columnTypes={columnTypes} />}
              {tab === "themes" && <ThematicAnalysisPanel columns={dataset.columns} rows={dataset.rows} columnTypes={columnTypes} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact upload trigger reused in the dataset bar
function FileUploadPanelInline({ onData }) {
  return (
    <div style={{ minWidth: 180 }}>
      <FileUploadPanel onData={onData} compact />
    </div>
  );
}