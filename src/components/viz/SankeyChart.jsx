import React, { useMemo } from "react";

const COLORS = ["#e6a817", "#58a6ff", "#2ea043", "#d29922", "#f85149", "#a78bfa", "#34d399", "#fb923c"];

// Simple custom Sankey using SVG
export default function SankeyChart({ data, onNodeClick, activeNode }) {
  // data: { nodes: [{id, label}], links: [{source, target, value}] }
  const { nodes, links } = data;
  const W = 600, H = 320, PAD = 60, NODE_W = 20, NODE_GAP = 12;

  const layout = useMemo(() => {
    if (!nodes?.length || !links?.length) return null;

    const leftNodes = [...new Set(links.map(l => l.source))];
    const rightNodes = [...new Set(links.map(l => l.target))];

    const leftTotals = leftNodes.map(n => ({ id: n, total: links.filter(l => l.source === n).reduce((s, l) => s + l.value, 0) }));
    const rightTotals = rightNodes.map(n => ({ id: n, total: links.filter(l => l.target === n).reduce((s, l) => s + l.value, 0) }));

    const maxLeft = Math.max(...leftTotals.map(n => n.total));
    const maxRight = Math.max(...rightTotals.map(n => n.total));
    const usableH = H - PAD * 2;

    let leftY = PAD;
    const leftLayout = leftTotals.map((n, i) => {
      const h = Math.max(20, (n.total / maxLeft) * (usableH - (leftTotals.length - 1) * NODE_GAP));
      const obj = { ...n, x: PAD, y: leftY, h, color: COLORS[i % COLORS.length] };
      leftY += h + NODE_GAP;
      return obj;
    });

    let rightY = PAD;
    const rightLayout = rightTotals.map((n, i) => {
      const h = Math.max(20, (n.total / maxRight) * (usableH - (rightTotals.length - 1) * NODE_GAP));
      const obj = { ...n, x: W - PAD - NODE_W, y: rightY, h, color: COLORS[(i + leftTotals.length) % COLORS.length] };
      rightY += h + NODE_GAP;
      return obj;
    });

    const allLayout = [...leftLayout, ...rightLayout];

    // Flow paths
    const linkPaths = links.map(link => {
      const src = leftLayout.find(n => n.id === link.source);
      const tgt = rightLayout.find(n => n.id === link.target);
      if (!src || !tgt) return null;
      const ratio = link.value / src.total;
      const srcH = src.h * ratio;
      const tgtRatio = link.value / tgt.total;
      const tgtH = tgt.h * tgtRatio;

      // Simple cubic bezier
      const x1 = src.x + NODE_W, y1 = src.y + src.h * 0.5;
      const x2 = tgt.x, y2 = tgt.y + tgt.h * 0.5;
      const cx = (x1 + x2) / 2;

      return { path: `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`, link, srcH, color: src.color };
    }).filter(Boolean);

    return { leftLayout, rightLayout, allLayout, linkPaths };
  }, [nodes, links, W, H]);

  if (!layout) return (
    <div className="flex items-center justify-center h-48 text-xs" style={{ color: "var(--text-muted)" }}>
      No data available for Sankey diagram.
    </div>
  );

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Links */}
      {layout.linkPaths.map((lp, i) => (
        <path key={i} d={lp.path}
          stroke={lp.color} strokeWidth={Math.max(2, lp.srcH)}
          fill="none" strokeOpacity={0.35}
          style={{ transition: "stroke-opacity 0.2s" }}
          onMouseOver={e => e.target.style.strokeOpacity = 0.65}
          onMouseOut={e => e.target.style.strokeOpacity = 0.35}
        />
      ))}
      {/* Nodes */}
      {layout.allLayout.map((node) => {
        const isActive = activeNode === node.id;
        return (
          <g key={node.id} onClick={() => onNodeClick && onNodeClick(node.id)} style={{ cursor: "pointer" }}>
            <rect x={node.x} y={node.y} width={NODE_W} height={node.h} rx={3}
              fill={node.color} opacity={isActive ? 1 : 0.8}
              stroke={isActive ? "#fff" : "none"} strokeWidth={isActive ? 1.5 : 0}
            />
            <text
              x={node.x < W / 2 ? node.x - 4 : node.x + NODE_W + 4}
              y={node.y + node.h / 2}
              textAnchor={node.x < W / 2 ? "end" : "start"}
              dominantBaseline="middle"
              fill="var(--text-secondary)" fontSize={10}>
              {node.id.replace(/_/g, " ")} ({node.total?.toFixed ? node.total.toFixed(0) : node.total})
            </text>
          </g>
        );
      })}
    </svg>
  );
}