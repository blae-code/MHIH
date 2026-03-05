import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, Calendar, Download, Trash2, Play } from "lucide-react";
import ReportBuilder from "../components/reports/ReportBuilder";
import ScheduleReportModal from "../components/reports/ScheduleReportModal";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [activeTab, setActiveTab] = useState("reports");
  const [showBuilder, setShowBuilder] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 50%, var(--bg-elevated) 100%)",
          borderColor: "var(--border-default)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(254,221,0,0.08)"
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #FEDD00 0%, #40c4ff 60%, transparent 100%)" }} />
        <div className="flex items-center justify-between">
          <div>
            <div className="dashboard-section-label">Reports Center</div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Create and manage custom health reports</p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            {[
              { key: "reports", label: "Generated", icon: FileText },
              { key: "schedules", label: "Scheduled", icon: Calendar }
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: activeTab === tab.key ? "rgba(254,221,0,0.12)" : "transparent",
                  color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-muted)",
                  border: activeTab === tab.key ? "1px solid rgba(254,221,0,0.3)" : "1px solid transparent"
                }}>
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full space-y-6">

      {/* Generated Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <button onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
            <Plus size={16} />
            Create Custom Report
          </button>

          {showBuilder && (
            <div className="p-6 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <ReportBuilder onReportCreated={handleReportCreated} />
            </div>
          )}

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading...</p>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-subtle)" }}>
              <FileText size={28} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No reports yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {reports.map(r => (
                <div key={r.id} className="p-4 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{r.title}</h3>
                      {r.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{r.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded" style={{ background: "rgba(254,221,0,0.1)", color: "var(--accent-primary)" }}>
                          {r.metric_ids?.length || 0} metrics
                        </span>
                        {r.generated_at && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Generated {new Date(r.generated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition"
                        title="Download" style={{ color: "var(--text-muted)" }}>
                        <Download size={16} />
                      </button>
                      <button onClick={() => handleDeleteReport(r.id)} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition"
                        title="Delete" style={{ color: "var(--color-error)" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === "schedules" && (
        <div className="space-y-4">
          <button onClick={() => setScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)", color: "#04245a" }}>
            <Plus size={16} />
            Schedule Report
          </button>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading...</p>
          ) : configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-subtle)" }}>
              <Calendar size={28} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No scheduled reports yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {configs.map(c => (
                <div key={c.id} className="p-4 rounded-lg" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded capitalize" style={{ background: "rgba(254,221,0,0.1)", color: "var(--accent-primary)" }}>
                          {c.schedule}
                        </span>
                        <span className="px-2 py-1 text-xs rounded" style={{ 
                          background: c.status === "active" ? "rgba(46,213,115,0.1)" : "rgba(244,67,54,0.1)", 
                          color: c.status === "active" ? "#2ea043" : "#f44336" 
                        }}>
                          {c.status === "active" ? "Active" : "Paused"}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {c.recipients?.length || 0} recipients
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition"
                        title="Run now" style={{ color: "var(--text-muted)" }}>
                        <Play size={16} />
                      </button>
                      <button onClick={() => handleDeleteConfig(c.id)} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition"
                        title="Delete" style={{ color: "var(--color-error)" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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