/**
 * ReportsCenter — the report assembly & delivery half of the Reporting suite.
 *
 * Generated-report library with the inline Report Builder, plus scheduled
 * report configurations. Extracted from the former Reports page; the page
 * shell/header and view tabs now live in Reporting.jsx.
 *
 * Props:
 *  - view: "reports" | "schedules" — which library to show
 *  - openBuilderSignal: number — increment to force the builder open
 *    (used by Chart Studio's "Build Report" hand-off)
 */

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, Calendar, Download, Trash2, Play, RefreshCw, Sparkles } from "lucide-react";
import ReportBuilder from "../reports/ReportBuilder";
import ScheduleReportModal from "../reports/ScheduleReportModal";
import ReportsStatStrip from "../reports/ReportsStatStrip";
import ZoneHeader from "../shell/ZoneHeader";

export default function ReportsCenter({ view = "reports", openBuilderSignal = 0 }) {
  const [reports, setReports] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeTab = view;

  useEffect(() => {
    loadData();
  }, []);

  // Chart Studio hand-off: open the builder when signalled
  useEffect(() => {
    if (openBuilderSignal > 0) setShowBuilder(true);
  }, [openBuilderSignal]);

  const loadData = async () => {
    try {
      const [reportsData, configsData] = await Promise.all([
        base44.entities.Report.list("-created_date", 50),
        base44.entities.ReportConfig.list("-created_date", 50)
      ]);
      setReports(reportsData);
      setConfigs(configsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportCreated = async (report) => {
    setReports(prev => [report, ...prev]);
    setShowBuilder(false);
  };

  const handleDeleteReport = async (id) => {
    if (confirm("Delete this report?")) {
      try {
        await base44.entities.Report.delete(id);
        setReports(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error("Failed to delete report:", error);
      }
    }
  };

  const handleDeleteConfig = async (id) => {
    if (confirm("Delete this schedule?")) {
      try {
        await base44.entities.ReportConfig.delete(id);
        setConfigs(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error("Failed to delete config:", error);
      }
    }
  };

  // Recent activity items for the Insights zone
  const recentActivity = [...reports]
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
    .slice(0, 4);

  if (loading) return (
    <div className="flex items-center justify-center py-24" style={{ color: "var(--text-muted)" }}>
      <RefreshCw size={20} className="animate-spin mr-2" /> Loading reports...
    </div>
  );

  return (
    <div className="flex flex-col">
      <style>{`
        .reports-widget-card {
          border-radius: 10px;
          border: 1.5px solid;
          border-image: linear-gradient(135deg, rgba(254,221,0,0.4) 0%, rgba(64,196,255,0.3) 50%, rgba(254,221,0,0.2) 100%) 1;
          background: #0a1220;
          padding: 14px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.08), 0 0 20px rgba(254,221,0,0.05);
        }
        .reports-widget-card:hover {
          border-image: linear-gradient(135deg, rgba(254,221,0,0.6) 0%, rgba(64,196,255,0.5) 50%, rgba(254,221,0,0.4) 100%) 1;
          box-shadow: inset 0 1px 0 rgba(254,221,0,0.15), 0 0 32px rgba(254,221,0,0.15), 0 8px 24px rgba(0,0,0,0.4);
        }
        .reports-widget-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(254,221,0,0.02) 0%, transparent 100%);
          pointer-events: none;
        }
        .reports-zone {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .report-list-item {
          background: var(--bg-overlay);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 12px;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;
        }
        .report-list-item:hover {
          border-color: rgba(254,221,0,0.3);
          background: rgba(254,221,0,0.03);
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── Stat strip ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <ReportsStatStrip reports={reports} configs={configs} />
      </div>

      {/* ── 2-zone cockpit ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 items-start">

        {/* ── Left zone: Library ──────────────────────────────────── */}
        <div className="reports-zone flex flex-col">
          <ZoneHeader
            label="Library"
            title={activeTab === "reports" ? "Generated Reports" : "Scheduled Reports"}
            count={activeTab === "reports" ? `${reports.length} reports` : `${configs.length} schedules`}
            hint={activeTab === "reports" ? "create, download, or remove" : "automated cadences"}
          />

          {/* Action card */}
          <div className="reports-widget-card" style={{ padding: 10 }}>
            <div className="flex flex-wrap items-center gap-2 relative z-10">
              {activeTab === "reports" ? (
                <button onClick={() => setShowBuilder(!showBuilder)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: showBuilder
                      ? "var(--bg-overlay)"
                      : "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)",
                    color: showBuilder ? "var(--text-primary)" : "#04245a",
                    border: showBuilder ? "1px solid var(--border-default)" : "none",
                  }}>
                  <Plus size={14} />
                  {showBuilder ? "Close Builder" : "Create Custom Report"}
                </button>
              ) : (
                <button onClick={() => setScheduleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
                  <Plus size={14} />
                  Schedule Report
                </button>
              )}
              <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
                {activeTab === "reports"
                  ? "Build a one-off report with the metrics, regions, and chart types you need."
                  : "Set a recurring delivery — daily, weekly, or monthly — to recipient email lists."
                }
              </span>
            </div>
          </div>

          {/* Report Builder (inline) */}
          {activeTab === "reports" && showBuilder && (
            <div className="reports-widget-card">
              <div className="relative z-10">
                <ReportBuilder onReportCreated={handleReportCreated} />
              </div>
            </div>
          )}

          {/* Generated reports list */}
          {activeTab === "reports" && (
            <div className="reports-widget-card">
              <div className="dashboard-section-label relative z-10">All Reports</div>
              <div className="relative z-10">
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <FileText size={28} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No reports yet.</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                      Click <span style={{ color: "var(--accent-primary)" }}>Create Custom Report</span> to build your first one.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2.5">
                    {reports.map(r => (
                      <div key={r.id} className="report-list-item">
                        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: "linear-gradient(180deg, #FEDD00 0%, transparent 100%)" }} />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg shrink-0" style={{ background: "rgba(254,221,0,0.08)", border: "1px solid rgba(254,221,0,0.2)" }}>
                              <FileText size={14} style={{ color: "var(--accent-primary)" }} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{r.title}</h3>
                              {r.description && (
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{r.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                                <span className="tag" style={{ background: "rgba(254,221,0,0.08)", color: "var(--accent-primary)", borderColor: "rgba(254,221,0,0.25)", fontSize: 10 }}>
                                  {r.metric_ids?.length || 0} metrics
                                </span>
                                {r.generated_at && (
                                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {new Date(r.generated_at).toLocaleDateString("en-CA")}
                                  </span>
                                )}
                                <span className="tag" style={{
                                  background: r.status === "generated" ? "rgba(0,230,118,0.08)" : "var(--bg-overlay)",
                                  color: r.status === "generated" ? "var(--color-success)" : "var(--text-muted)",
                                  fontSize: 10
                                }}>
                                  {r.status || "draft"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button className="activity-icon" title="Download" style={{ width: 30, height: 30 }}>
                              <Download size={14} />
                            </button>
                            <button onClick={() => handleDeleteReport(r.id)} className="activity-icon" title="Delete" style={{ width: 30, height: 30, color: "var(--color-error)" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scheduled reports list */}
          {activeTab === "schedules" && (
            <div className="reports-widget-card">
              <div className="dashboard-section-label relative z-10">All Schedules</div>
              <div className="relative z-10">
                {configs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Calendar size={28} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No scheduled reports yet.</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                      Create a schedule to auto-deliver reports on a recurring cadence.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2.5">
                    {configs.map(c => (
                      <div key={c.id} className="report-list-item">
                        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: "linear-gradient(180deg, #40c4ff 0%, transparent 100%)" }} />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg shrink-0" style={{ background: "rgba(64,196,255,0.08)", border: "1px solid rgba(64,196,255,0.2)" }}>
                              <Calendar size={14} style={{ color: "var(--color-info)" }} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.title}</h3>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                <span className="tag capitalize" style={{ background: "rgba(64,196,255,0.08)", color: "var(--color-info)", borderColor: "rgba(64,196,255,0.25)", fontSize: 10 }}>
                                  {c.schedule}
                                </span>
                                <span className="tag" style={{
                                  background: c.status === "active" ? "rgba(0,230,118,0.08)" : "rgba(255,23,68,0.08)",
                                  color: c.status === "active" ? "var(--color-success)" : "var(--color-error)",
                                  borderColor: c.status === "active" ? "rgba(0,230,118,0.25)" : "rgba(255,23,68,0.25)",
                                  fontSize: 10
                                }}>
                                  {c.status === "active" ? "Active" : "Paused"}
                                </span>
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {c.recipients?.length || 0} recipients
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button className="activity-icon" title="Run now" style={{ width: 30, height: 30 }}>
                              <Play size={14} />
                            </button>
                            <button onClick={() => handleDeleteConfig(c.id)} className="activity-icon" title="Delete" style={{ width: 30, height: 30, color: "var(--color-error)" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right zone: Insights ────────────────────────────────── */}
        <div className="reports-zone flex flex-col">
          <ZoneHeader
            label="Insights"
            title="Recent Activity"
            count={`${recentActivity.length} this week`}
            hint="latest reports + tips"
          />

          {/* Recent activity */}
          <div className="reports-widget-card">
            <div className="dashboard-section-label relative z-10">Recent Reports</div>
            <div className="space-y-2 relative z-10">
              {recentActivity.length === 0 ? (
                <p className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  No activity yet — create your first report to see it here.
                </p>
              ) : (
                recentActivity.map(r => (
                  <div key={r.id} className="p-2.5 rounded-md" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate" style={{ color: "var(--accent-primary)" }}>{r.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                          {r.metric_ids?.length || 0} metrics · {r.status || "draft"}
                        </div>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                        {new Date(r.created_date || Date.now()).toLocaleDateString("en-CA")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick stats summary */}
          <div className="reports-widget-card">
            <div className="dashboard-section-label relative z-10">At a Glance</div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Total reports</span>
                <span className="font-mono font-semibold" style={{ color: "var(--accent-primary)" }}>
                  {reports.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Drafts</span>
                <span className="font-mono" style={{ color: "var(--text-primary)" }}>
                  {reports.filter(r => !r.status || r.status === "draft").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Generated</span>
                <span className="font-mono" style={{ color: "var(--color-success)" }}>
                  {reports.filter(r => r.status === "generated" || r.status === "exported").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Active schedules</span>
                <span className="font-mono" style={{ color: "var(--color-info)" }}>
                  {configs.filter(c => c.status === "active").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 mt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Paused schedules</span>
                <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                  {configs.filter(c => c.status !== "active").length}
                </span>
              </div>
            </div>
          </div>

          {/* How to use widget */}
          <div className="reports-widget-card">
            <div className="dashboard-section-label flex items-center gap-1.5 relative z-10">
              <Sparkles size={11} style={{ color: "var(--accent-primary)" }} />
              How to Use
            </div>
            <ul className="space-y-1.5 text-xs relative z-10" style={{ color: "var(--text-secondary)" }}>
              <li className="flex gap-2">
                <span style={{ color: "#FEDD00" }}>·</span>
                <span>Craft chart components in the <span style={{ color: "#40c4ff" }}>Chart Studio</span> tab, then assemble them here into full reports.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "#FEDD00" }}>·</span>
                <span>Use <span style={{ color: "var(--accent-primary)" }}>Create Custom Report</span> to build one-off reports with selected metrics and charts.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "#FEDD00" }}>·</span>
                <span>Switch to <span style={{ color: "#40c4ff" }}>Schedules</span> to set up recurring deliveries to email recipients.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "#FEDD00" }}>·</span>
                <span>Generated reports can be downloaded as PDF or CSV; schedules can be paused or run on demand.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      <ScheduleReportModal
        isOpen={scheduleModal}
        onClose={() => setScheduleModal(false)}
        onConfigCreated={(config) => {
          setConfigs(prev => [config, ...prev]);
          setScheduleModal(false);
        }}
      />
    </div>
  );
}