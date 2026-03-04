import React, { useState } from "react";
import { Save, Trash2, Copy, X } from "lucide-react";

export const PRESET_LAYOUTS = {
  executive: {
    name: "Executive Dashboard",
    description: "High-level KPIs and summaries",
    widgets: [
      { id: "stat_cards", visible: true, span: 4 },
      { id: "year_trend", visible: true, span: 2 },
      { id: "category_pie", visible: true, span: 2 },
      { id: "weekly_reports", visible: true, span: 4 },
      { id: "ai_insights", visible: true, span: 4 },
    ]
  },
  analyst: {
    name: "Analyst Dashboard",
    description: "Deep-dive data exploration",
    widgets: [
      { id: "stat_cards", visible: true, span: 4 },
      { id: "disparity_explorer", visible: true, span: 4 },
      { id: "data_sources", visible: true, span: 2 },
      { id: "pinned_metrics", visible: true, span: 2 },
      { id: "ai_insights", visible: true, span: 4 },
    ]
  },
  compact: {
    name: "Compact View",
    description: "Essential metrics only",
    widgets: [
      { id: "stat_cards", visible: true, span: 4 },
      { id: "year_trend", visible: true, span: 2 },
      { id: "category_pie", visible: true, span: 2 },
    ]
  }
};

export default function DashboardLayoutManager({ layouts, currentLayout, onLoadLayout, onSaveLayout, onDeleteLayout, onClose }) {
  const [newLayoutName, setNewLayoutName] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const handleSaveNew = () => {
    if (!newLayoutName.trim()) return;
    setSavingNew(true);
    onSaveLayout(newLayoutName);
    setNewLayoutName("");
    setSavingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Dashboard Layouts</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Save, load, and manage your dashboard configurations</div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4">
          
          {/* Save Current Layout */}
          <div className="p-3 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Save Current Layout</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Layout name (e.g., My Custom View)"
                value={newLayoutName}
                onChange={e => setNewLayoutName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveNew()}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-md outline-none"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
              <button
                onClick={handleSaveNew}
                disabled={!newLayoutName.trim() || savingNew}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: "var(--accent-primary)", color: "#000", opacity: !newLayoutName.trim() ? 0.5 : 1 }}>
                <Save size={11} /> Save
              </button>
            </div>
          </div>

          {/* Saved Layouts */}
          {layouts.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>YOUR LAYOUTS</div>
              <div className="space-y-1.5">
                {layouts.map(layout => (
                  <div
                    key={layout.id}
                    className="flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all"
                    style={{
                      background: currentLayout?.id === layout.id ? "rgba(254,221,0,0.08)" : "var(--bg-base)",
                      border: `1px solid ${currentLayout?.id === layout.id ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    }}
                    onClick={() => onLoadLayout(layout.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{layout.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{layout.widgetCount || 0} widgets</div>
                    </div>
                    {currentLayout?.id !== layout.id && (
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteLayout(layout.id); }}
                        className="p-1 rounded-md transition-all ml-2"
                        style={{ color: "var(--text-muted)" }}
                        onMouseOver={e => { e.currentTarget.style.background = "rgba(255,23,68,0.1)"; e.currentTarget.style.color = "var(--color-error)"; }}
                        onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Presets */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>PRESET LAYOUTS</div>
            <div className="space-y-1.5">
              {Object.entries(PRESET_LAYOUTS).map(([key, preset]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all"
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onClick={() => onLoadLayout(`preset_${key}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>{preset.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{preset.description}</div>
                  </div>
                  <div className="ml-2" style={{ color: "var(--text-muted)" }}>
                    <Copy size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex justify-end" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--bg-overlay)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}