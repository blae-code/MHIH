import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { MapPinned, RefreshCw, TriangleAlert } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const REGION_COORDS = {
  "BC": [53.7267, -127.6476],
  "Northern BC": [56.5, -124.5],
  "Interior BC": [50.5, -119.5],
  "Fraser": [49.1, -122.1],
  "Vancouver Island": [49.7, -125.4],
  "Vancouver Coastal": [49.28, -123.12],
  "Provincial": [53.7267, -127.6476],
};

export default function GeoEquityMap() {
  const { addLog } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.HealthMetric.list("-year", 3000);
      setMetrics(data || []);
    } catch (e) {
      addLog("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const regionStats = useMemo(() => {
    const grouped = new Map();
    for (const m of metrics) {
      if (!m.region || m.value == null) continue;
      if (!grouped.has(m.region)) grouped.set(m.region, []);
      grouped.get(m.region).push(m);
    }

    const rows = [];
    for (const [region, vals] of grouped.entries()) {
      const avg = vals.reduce((a, b) => a + Number(b.value || 0), 0) / vals.length;
      const withComp = vals.filter(v => v.comparison_value != null);
      const avgGap = withComp.length
        ? withComp.reduce((a, b) => a + (Number(b.value || 0) - Number(b.comparison_value || 0)), 0) / withComp.length
        : null;
      const missingShare = vals.filter(v => v.value == null).length / Math.max(1, vals.length);

      rows.push({
        region,
        count: vals.length,
        avgValue: Number(avg.toFixed(2)),
        avgGap: avgGap == null ? null : Number(avgGap.toFixed(2)),
        missingShare: Number(missingShare.toFixed(2)),
        coords: REGION_COORDS[region] || REGION_COORDS.BC,
      });
    }

    rows.sort((a, b) => Math.abs(b.avgGap || 0) - Math.abs(a.avgGap || 0));
    return rows;
  }, [metrics]);

  const hotspots = regionStats.filter(r => Math.abs(r.avgGap || 0) > 5 || r.missingShare > 0.2).slice(0, 8);

  return (
    <div className="p-5 h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <MapPinned size={14} style={{ color: "var(--accent-primary)" }} />
            Geo Equity Map
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Map-first regional burden and disparity hotspots across BC Métis health indicators.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="metric-card xl:col-span-2" style={{ minHeight: 520 }}>
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Regional Burden Map</div>
          <div className="rounded overflow-hidden" style={{ height: 470, border: "1px solid var(--border-subtle)" }}>
            <MapContainer center={[53.7267, -127.6476]} zoom={5.3} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {regionStats.map(region => {
                const magnitude = Math.abs(region.avgGap || 0);
                const radius = Math.max(6, Math.min(26, 6 + magnitude));
                const color = region.avgGap == null
                  ? "#94a3b8"
                  : region.avgGap > 0
                    ? "#ef4444"
                    : "#22c55e";

                return (
                  <CircleMarker key={region.region} center={region.coords} radius={radius} pathOptions={{ color, fillColor: color, fillOpacity: 0.35 }}>
                    <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                      <div style={{ fontSize: 11 }}>
                        <div><strong>{region.region}</strong></div>
                        <div>Avg value: {region.avgValue}</div>
                        <div>Avg gap vs comparison: {region.avgGap == null ? "n/a" : region.avgGap}</div>
                        <div>Data points: {region.count}</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="metric-card space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Hotspots</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Disparity and service-desert proxy flags</div>
          </div>
          <div className="space-y-1 max-h-60 overflow-auto">
            {hotspots.map(h => (
              <div key={h.region} className="p-2 rounded" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}>
                <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{h.region}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Gap: {h.avgGap == null ? "n/a" : h.avgGap} · Missing share: {(h.missingShare * 100).toFixed(0)}%
                </div>
              </div>
            ))}
            {!hotspots.length && <div className="text-xs" style={{ color: "var(--text-muted)" }}>No high-priority hotspots under current thresholds.</div>}
          </div>

          <div className="rounded p-3" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>Interpretation</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Red bubbles indicate higher positive gap vs comparison baseline; green indicates narrowing/negative gap.
              Larger radius means larger absolute disparity magnitude.
            </div>
          </div>
        </div>
      </div>

      <div className="metric-card overflow-auto">
        <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Region Summary</div>
        {loading ? (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}><RefreshCw size={11} className="inline animate-spin mr-1" /> Loading map data...</div>
        ) : (
          <table className="w-full data-table text-xs">
            <thead>
              <tr>
                <th className="text-left">Region</th>
                <th className="text-right">Data Points</th>
                <th className="text-right">Avg Value</th>
                <th className="text-right">Avg Gap</th>
                <th className="text-right">Missing %</th>
              </tr>
            </thead>
            <tbody>
              {regionStats.map(r => (
                <tr key={r.region}>
                  <td>{r.region}</td>
                  <td className="text-right">{r.count}</td>
                  <td className="text-right">{r.avgValue}</td>
                  <td className="text-right" style={{ color: (r.avgGap || 0) > 0 ? "var(--color-error)" : "var(--color-success)" }}>{r.avgGap == null ? "n/a" : r.avgGap}</td>
                  <td className="text-right">{(r.missingShare * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
        <TriangleAlert size={11} /> This view uses region centroid approximations. Replace with boundary polygons for production geospatial precision.
      </div>
    </div>
  );
}
