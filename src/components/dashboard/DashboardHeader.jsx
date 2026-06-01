/**
 * DashboardHeader — compact, single-row hero for the Dashboard page.
 * Houses title (inline-editable), subtitle, live status dot, and a slim
 * toolbar (export + overflow "⋯" menu). Designed to occupy minimal vertical
 * space so widget content rises above the fold.
 */
import React from "react";
import { Save } from "lucide-react";
import DashboardExportMenu from "./DashboardExportMenu";
import DashboardToolbarMenu from "./DashboardToolbarMenu";

export default function DashboardHeader({
  title,
  editingTitle,
  tempTitle,
  onTempTitleChange,
  onStartEdit,
  onCommitEdit,
  metrics,
  hasChanges,
  onOpenLayoutManager,
  onOpenCustomizer,
  onResetLayout,
}) {
  return (
    <div
      className="mb-3 rounded-lg overflow-hidden shrink-0"
      style={{
        background: "linear-gradient(to bottom, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(254,221,0,0.06)",
      }}
    >
      <div className="px-3 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: "var(--color-success)", boxShadow: "0 0 6px rgba(0,230,118,0.5)" }}
          />
          {editingTitle ? (
            <>
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => onTempTitleChange(e.target.value)}
                onBlur={onCommitEdit}
                onKeyDown={(e) => e.key === "Enter" && onCommitEdit()}
                autoFocus
                className="text-sm font-bold tracking-wider outline-none px-2 py-0.5 rounded-md"
                style={{
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-default)",
                  minWidth: 200,
                }}
              />
              <button
                onClick={onCommitEdit}
                className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
                style={{ background: "var(--accent-primary)", color: "#000" }}
                title="Save title"
              >
                <Save size={11} />
              </button>
            </>
          ) : (
            <h1
              className="text-sm font-bold tracking-wider cursor-pointer truncate"
              style={{ color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}
              onClick={onStartEdit}
              title="Click to rename"
            >
              {title}
            </h1>
          )}
          <span
            className="text-xs shrink-0 hidden md:inline"
            style={{ color: "var(--text-muted)", opacity: 0.8 }}
          >
            · Real-time Métis health metrics across BC
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <DashboardExportMenu metrics={metrics} />
          <DashboardToolbarMenu
            onRenameTitle={onStartEdit}
            onOpenLayoutManager={onOpenLayoutManager}
            onOpenCustomizer={onOpenCustomizer}
            onResetLayout={onResetLayout}
            hasChanges={hasChanges}
          />
        </div>
      </div>
    </div>
  );
}