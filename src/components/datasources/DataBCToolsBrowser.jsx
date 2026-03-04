import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Rss, Loader2, X, Download, ExternalLink, Search, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

const TABS = [
  { key: "csv", label: "CSV Parser", icon: FileText },
  { key: "news", label: "Health Ministry News", icon: Rss },
];

export default function DataBCToolsBrowser({ onClose, onImport }) {
  const [tab, setTab] = useState("csv");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex flex-col w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>DataBC Tools</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>CSV Parser API · BC Health Ministry News</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors"
              style={{
                color: tab === t.key ? "var(--accent-primary)" : "var(--text-muted)",
                borderBottom: tab === t.key ? "2px solid var(--accent-primary)" : "2px solid transparent",
                background: "transparent",
              }}>
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "csv" && <CSVParserTab onImport={onImport} />}
        {tab === "news" && <HealthNewsTab onImport={onImport} />}
      </div>
    </div>
  );
}

// ── CSV Parser Tab ───────────────────────────────────────────
function CSVParserTab({ onImport }) {
  const [csvUrl, setCsvUrl] = useState("");
  const [knownDatasets, setKnownDatasets] = useState([]);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState({});
  const [sortField, setSortField] = useState("");

  useEffect(() => {
    base44.functions.invoke("dataBCTools", { action: "known_csvs" })
      .then(res => setKnownDatasets(res.data?.datasets || []))
      .catch(() => {});
  }, []);

  const parse = async (url) => {
    const target = url || csvUrl;
    if (!target.trim()) return;
    setCsvUrl(target);
    setLoading(true);
    setRows([]);
    setColumns([]);
    try {
      const res = await base44.functions.invoke("dataBCTools", {
        action: "parse_csv",
        csvUrl: target,
        limit: 100,
        sort: sortField || undefined,
      });
      const d = res.data;
      if (d.success) {
        setRows(d.rows || []);
        setColumns(d.columns || []);
        setTotal(d.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const name = knownDatasets.find(d => d.url === csvUrl)?.label || csvUrl.split("/").pop() || "CSV Dataset";
    await onImport({
      name,
      type: "api",
      url: csvUrl,
      description: `DataBC CSV Parser — ${csvUrl}`,
      category: "other",
      status: "active",
      sync_frequency: "manual",
      metadata: { parser: "csv-parser.api.gov.bc.ca", columns, total_rows: total },
    });
    setImported(prev => ({ ...prev, [csvUrl]: true }));
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 px-3 py-1.5 rounded-md text-xs outline-none"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            placeholder="Enter CSV URL (e.g. https://catalogue.data.gov.bc.ca/.../file.csv)"
            value={csvUrl}
            onChange={e => setCsvUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && parse()}
          />
          <button onClick={() => parse()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Parse
          </button>
        </div>
        {knownDatasets.length > 0 && (
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Known BC datasets:</div>
            <div className="flex flex-wrap gap-1">
              {knownDatasets.map(d => (
                <button key={d.url} onClick={() => parse(d.url)}
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Parsing CSV via api.gov.bc.ca...</span>
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
            <FileText size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Paste a CSV URL above or pick a known BC dataset.</p>
            <p className="text-xs mt-1">The DataBC CSV Parser converts any BC government CSV to a queryable JSON API.</p>
          </div>
        )}
        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Showing {rows.length} of {total.toLocaleString()} rows · {columns.length} columns
              </div>
              <button onClick={handleImport} disabled={imported[csvUrl]}
                className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium"
                style={{ background: imported[csvUrl] ? "var(--color-success)" : "var(--accent-primary)", color: "#000" }}>
                <Download size={11} />
                {imported[csvUrl] ? "Imported" : "Import as Data Source"}
              </button>
            </div>
            <div className="overflow-auto rounded" style={{ border: "1px solid var(--border-subtle)" }}>
              <table className="data-table w-full text-xs" style={{ minWidth: columns.length * 120 }}>
                <thead>
                  <tr>
                    {columns.map(c => (
                      <th key={c} className="text-left whitespace-nowrap cursor-pointer hover:bg-opacity-80"
                        onClick={() => setSortField(c)}
                        style={{ color: sortField === c ? "var(--accent-primary)" : undefined }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map(c => (
                        <td key={c} className="whitespace-nowrap" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {String(row[c] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Health News Tab ──────────────────────────────────────────
function HealthNewsTab({ onImport }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [imported, setImported] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("dataBCTools", { action: "health_news", limit: 30 });
      setItems(res.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleImport = async () => {
    await onImport({
      name: "BC Health Ministry News Feed",
      type: "api",
      url: "https://news.gov.bc.ca/ministries/health/feed",
      description: "RSS news feed from the BC Ministry of Health — press releases, announcements, and policy updates.",
      category: "other",
      status: "active",
      sync_frequency: "daily",
      metadata: { format: "rss", source: "news.gov.bc.ca" },
    });
    setImported(true);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          BC Ministry of Health — news.gov.bc.ca RSS
        </span>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={handleImport} disabled={imported}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
            style={{ background: imported ? "var(--color-success)" : "var(--accent-primary)", color: "#000" }}>
            <Download size={11} />
            {imported ? "Imported" : "Import Feed as Source"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Loading BC Health Ministry news...</span>
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="rounded-md overflow-hidden"
            style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex items-start gap-2 px-3 py-2.5 cursor-pointer"
              onClick={() => setExpanded(expanded === i ? null : i)}>
              {expanded === i
                ? <ChevronDown size={13} style={{ color: "var(--text-muted)", marginTop: 1, flexShrink: 0 }} />
                : <ChevronRight size={13} style={{ color: "var(--text-muted)", marginTop: 1, flexShrink: 0 }} />}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {item.pubDate ? new Date(item.pubDate).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : ""}
                </div>
              </div>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="activity-icon shrink-0" style={{ width: 22, height: 22 }}
                  onClick={e => e.stopPropagation()}>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            {expanded === i && item.description && (
              <div className="px-4 pb-3 pt-1 text-xs border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                {item.description.replace(/<[^>]+>/g, "").trim()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}