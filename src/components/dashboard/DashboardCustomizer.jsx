import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Eye, EyeOff, X, RotateCcw } from "lucide-react";

export const DEFAULT_WIDGETS = [
  { id: "stat_cards", label: "Stat Cards", description: "Total metrics, sources, insights counts" },
  { id: "year_trend", label: "Metrics by Year Chart", description: "Area chart of metric volume over time" },
  { id: "category_pie", label: "Category Distribution", description: "Pie chart + legend of metric categories" },
  { id: "disparity_explorer", label: "Health Disparity Explorer", description: "Bar, scatter, trend & heatmap charts with filters" },
  { id: "weekly_reports", label: "Weekly Summary Reports", description: "AI-generated stakeholder reports" },
  { id: "pinned_metrics", label: "Pinned Metrics", description: "Your manually pinned health metrics" },
  { id: "data_sources", label: "Data Sources", description: "Live status of connected data sources" },
  { id: "ai_insights", label: "Recent AI Insights", description: "Latest AI-generated analysis cards" },
];

export default function DashboardCustomizer({ widgets, onWidgetsChange, onClose }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(widgets);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onWidgetsChange(items);
  };

  const toggleVisible = (id) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const handleReset = () => {
    onWidgetsChange(DEFAULT_WIDGETS.map(w => ({ ...w, visible: true })));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Customize Dashboard</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Drag to reorder · toggle visibility</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              <RotateCcw size={10} /> Reset
            </button>
            <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Drag list */}
        <div className="p-3 max-h-96 overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                  {widgets.map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md"
                          style={{
                            background: snapshot.isDragging ? "var(--bg-hover)" : "var(--bg-overlay)",
                            border: `1px solid ${snapshot.isDragging ? "var(--border-default)" : "var(--border-subtle)"}`,
                            opacity: widget.visible === false ? 0.5 : 1,
                          }}>
                          <div {...provided.dragHandleProps} style={{ cursor: "grab", color: "var(--text-muted)" }}>
                            <GripVertical size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{widget.label}</div>
                            <div className="text-xs truncate" style={{ color: "var(--text-muted)", fontSize: 10 }}>{widget.description}</div>
                          </div>
                          <button onClick={() => toggleVisible(widget.id)} title={widget.visible === false ? "Show" : "Hide"}>
                            {widget.visible === false
                              ? <EyeOff size={14} style={{ color: "var(--text-muted)" }} />
                              : <Eye size={14} style={{ color: "var(--accent-primary)" }} />}
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="px-4 py-3 border-t flex justify-end" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}