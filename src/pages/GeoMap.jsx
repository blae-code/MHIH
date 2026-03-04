import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { MapPin, RefreshCw, Filter, Layers, Info, X } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// BC region approximate centre coordinates
const REGION_COORDS = {
  "BC": [54.0, -125.0],
  "Northern BC": [56.5, -124.5],
  "Interior BC": [50.5, -119.5],
  "Fraser": [49.3, -122.0],
  "Vancouver Island": [49.5, -125.0],
  "Vancouver Coastal": [49.4, -123.0],
  "Provincial": [53.7, -127.0],
};

const CATEGORY_COLORS = {
  chronic_disease: "#f85149",
  mental_health: "#a78bfa",
  substance_use: "#fb923c",
  maternal_child: "#f472b6",
  social_determinants: "#34d399",
  demographics: "#58a6ff",
  mortality: "#ef4444",
  access_to_care: "#fbbf24",
  other: "#6b7280",
};

export default function GeoMap() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.HealthMetric.list("-year", 500)
      .then(data => { setMetrics(data); addLog("success", `${data.length} metrics loaded for map`); })
      .catch(e => addLog("error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(metrics.map(m => m.category))].filter(Boolean);
  const years = [...new Set(metrics.map(m => m.year))].filter(Boolean).sort((a, b) => b - a);

  const filtered = metrics.filter(m => {
    const okCat = filterCat === "all" || m.category === filterCat;
    const okYr = filterYear === "all" || String(m.year) === filterYear;
    const hasCoords = REGION_COORDS[m.region];
    return okCat && okYr && hasCoords;
  });

  // Aggregate by region
  const regionData = filtered.reduce((acc, m) => {
    const key = m.region;
    if (!acc[key]) acc[key] = { region: key, metrics: [], total: 0, count: 0, coords: REGION_COORDS[key] };
    acc[key].metrics.push(m);
    acc[key].total += m.value || 0;
    acc[key].count++;
    return acc;
  }, {});

  const maxVal = Math.max(...Object.values(regionData).map(r => r.total), 1);

  const CATEGORIES = ["chronic_disease","mental_health","substance_use","maternal_child","social_determinants","demographics","mortality","access_to_care","other"];

  if (loading) return (
    <div className="flex items-center justify-center h-full gap-2" style={{ color: "var(--text-muted)" }}>
      <RefreshCw size={16} className="animate-spin" /> Loading map data...
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <MapPin size={13} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Geospatial Health Analysis</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={11} style={{ color: "var(--text-muted)" }} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="text-xs px-2 py-1 rounded outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="text-xs px-2 py-1 rounded outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} data points</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {typeof window !== "undefined" && (
            <MapContainer
              center={[54.0, -124.0]}
              zoom={5}
              style={{ height: "100%", width: "100%", background: "#06112a" }}
              zoomControl={false}>
              <ZoomControl position="topright" />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='© OpenStreetMap © CARTO'
              />
              {Object.values(regionData).map(rd => {
                const radius = 10 + (rd.total / maxVal) * 30;
                const topCat = rd.metrics.reduce((acc, m) => {
                  acc[m.category] = (acc[m.category] || 0) + 1; return acc;
                }, {});
                const mainCat = Object.entries(topCat).sort((a, b) => b[1] - a[1])[0]?.[0];
                const color = CATEGORY_COLORS[mainCat] || "#e6a817";
                return (
                  <CircleMarker
                    key={rd.region}
                    center={rd.coords}
                    radius={radius}
                    fillColor={color}
                    fillOpacity={0.7}
                    color={color}
                    weight={2}
                    opacity={0.9}
                    eventHandlers={{ click: () => setSelected(rd) }}>
                    <Tooltip sticky>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{rd.region}</div>
                      <div style={{ fontSize: 11 }}>{rd.count} metrics · total {rd.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Sidebar: selected region or legend */}
        <aside className="flex flex-col shrink-0 border-l overflow-y-auto"
          style={{ width: 260, background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          {selected ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selected.region}</div>
                <button onClick={() => setSelected(null)}><X size={13} style={{ color: "var(--text-muted)" }} /></button>
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{selected.count} metrics · total {selected.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="space-y-2">
                {selected.metrics.slice(0, 12).map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="truncate flex-1 pr-2" style={{ color: "var(--text-secondary)" }}>{m.name}</span>
                    <span className="font-mono shrink-0" style={{ color: CATEGORY_COLORS[m.category] || "var(--accent-primary)" }}>
                      {m.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })} {m.unit || ""}
                    </span>
                  </div>
                ))}
                {selected.metrics.length > 12 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>+{selected.metrics.length - 12} more</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Legend</div>
              <div className="space-y-1.5">
                {CATEGORIES.filter(c => categories.includes(c)).map(c => (
                  <div key={c} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[c] }} />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.replace(/_/g," ")}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Circle size = relative metric volume per region. Click a circle to see details.
              </div>
              {Object.values(regionData).length === 0 && (
                <div className="flex flex-col items-center py-8 gap-2" style={{ color: "var(--text-muted)" }}>
                  <MapPin size={24} className="opacity-20" />
                  <p className="text-xs text-center">No data matches. Import health metrics with BC region values.</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}