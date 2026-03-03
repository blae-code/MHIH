import React, { useRef, useEffect, useState } from "react";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#d29922", "#f85149", "#a78bfa", "#34d399", "#fb923c"];

export default function NetworkGraph({ nodes, edges, onNodeClick, activeNode }) {
  const svgRef = useRef(null);
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const W = 580, H = 340;

  // Simple force-like initial layout using circular + random
  useEffect(() => {
    if (!nodes?.length) return;
    const pos = {};
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.35;
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      pos[n.id] = {
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 40
      };
    });
    setPositions(pos);
  }, [nodes]);

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    setPositions(prev => ({
      ...prev,
      [dragging]: {
        x: Math.max(20, Math.min(W - 20, (e.clientX - rect.left) * scaleX)),
        y: Math.max(20, Math.min(H - 20, (e.clientY - rect.top) * scaleY))
      }
    }));
  };

  if (!nodes?.length) return (
    <div className="flex items-center justify-center h-48 text-xs" style={{ color: "var(--text-muted)" }}>
      No data available for network graph.
    </div>
  );

  const colorMap = {};
  const groups = [...new Set(nodes.map(n => n.group))];
  groups.forEach((g, i) => colorMap[g] = COLORS[i % COLORS.length]);

  return (
    <div className="relative">
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ cursor: dragging ? "grabbing" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--border-default)" />
          </marker>
        </defs>
        {/* Edges */}
        {(edges || []).map((e, i) => {
          const src = positions[e.source];
          const tgt = positions[e.target];
          if (!src || !tgt) return null;
          return (
            <line key={i}
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke="var(--border-default)" strokeWidth={Math.max(1, (e.weight || 1) * 0.5)}
              strokeOpacity={0.5} markerEnd="url(#arrow)"
            />
          );
        })}
        {/* Nodes */}
        {nodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return null;
          const isActive = activeNode === node.id;
          const r = Math.max(10, Math.min(24, (node.size || 1) * 3 + 10));
          return (
            <g key={node.id} style={{ cursor: "grab" }}
              onMouseDown={() => setDragging(node.id)}
              onClick={() => { onNodeClick && onNodeClick(node.id); }}
              onMouseEnter={(e) => setTooltip({ id: node.id, label: node.label, value: node.value, x: pos.x, y: pos.y })}
              onMouseLeave={() => setTooltip(null)}>
              <circle cx={pos.x} cy={pos.y} r={r}
                fill={colorMap[node.group] || COLORS[0]}
                opacity={isActive ? 1 : 0.75}
                stroke={isActive ? "#fff" : "transparent"}
                strokeWidth={2}
                style={{ transition: "opacity 0.2s" }} />
              <text x={pos.x} y={pos.y + r + 12} textAnchor="middle"
                fill="var(--text-secondary)" fontSize={9} style={{ pointerEvents: "none" }}>
                {node.label?.length > 14 ? node.label.slice(0, 12) + "…" : node.label}
              </text>
            </g>
          );
        })}
        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x + 8} y={tooltip.y - 28} width={140} height={28} rx={4}
              fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth={1} />
            <text x={tooltip.x + 14} y={tooltip.y - 18} fill="var(--text-primary)" fontSize={10} fontWeight={600}>
              {tooltip.label}
            </text>
            <text x={tooltip.x + 14} y={tooltip.y - 8} fill="var(--accent-primary)" fontSize={10}>
              {tooltip.value != null ? `Value: ${tooltip.value?.toFixed?.(1) ?? tooltip.value}` : ""}
            </text>
          </g>
        )}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {groups.map(g => (
          <div key={g} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: colorMap[g] }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{g?.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}