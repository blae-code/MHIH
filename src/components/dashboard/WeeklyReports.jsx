import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, RefreshCw, Zap, Download, ChevronDown, ChevronUp, Pin } from "lucide-react";
import { useApp } from "../../Layout";

export default function WeeklyReports() {
  const { user, addLog } = useApp();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const isAdmin = user?.role === "admin";

  const load = async () => {
    const all = await base44.entities.AIInsight.filter(
      { generated_by: "AI Agent — Weekly Summary Report" },
      "-created_date",
      10
    );
    setReports(all);
    setLoading(false);
  };

  useEffect(() => {load();}, []);

  const handleGenerate = async () => {
    setRunning(true);
    addLog("info", "Generating weekly summary report...");
    try {
      await base44.functions.invoke("agentAnomalyReport", {});
      addLog("success", "Weekly report generated");
      await load();
      setExpanded(null);
    } catch (e) {
      addLog("error", `Report generation failed: ${e.message}`);
    }
    setRunning(false);
  };

  const handleDownload = (report) => {
    const blob = new Blob([report.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog("success", "Report downloaded");
  };

  return null;


































































































































}