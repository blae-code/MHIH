/**
 * DashboardToolbarMenu — compact "⋯" overflow menu housing the rarely-used
 * dashboard chrome (rename title, save/load layout, customize widgets, reset).
 * Export is intentionally kept inline as a primary action, not in the menu.
 */
import React, { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Layout as LayoutIcon, SlidersHorizontal, RotateCcw } from "lucide-react";

export default function DashboardToolbarMenu({
  onRenameTitle,
  onOpenLayoutManager,
  onOpenCustomizer,
  onResetLayout,
  hasChanges,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { icon: Pencil, label: "Rename dashboard", onClick: onRenameTitle },
    { icon: LayoutIcon, label: "Save / load layouts", onClick: onOpenLayoutManager },
    { icon: SlidersHorizontal, label: "Customize widgets", onClick: onOpenCustomizer },
    ...(hasChanges ? [{ icon: RotateCcw, label: "Reset to default", onClick: onResetLayout, danger: true }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
        style={{
          background: open ? "var(--bg-hover)" : "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
        title="More options"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 rounded-lg overflow-hidden z-30"
          style={{
            minWidth: 200,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { setOpen(false); item.onClick?.(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
              style={{
                color: item.danger ? "#ffab40" : "var(--text-secondary)",
                fontSize: 12,
                borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = item.danger ? "#ffab40" : "var(--text-secondary)"; }}
            >
              <item.icon size={13} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}