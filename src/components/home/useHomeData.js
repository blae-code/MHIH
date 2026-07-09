/**
 * useHomeData — live cockpit data for the Red River OS home page.
 * Pulls health metrics, policy requests, and open alerts, then derives
 * stat counts, active priorities, and upcoming deadlines.
 */

import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { listAllHealthMetrics } from "@/lib/healthMetrics";

const CLOSED_STATUSES = ["completed", "closed", "rejected"];

export function daysUntilDate(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const target = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (isNaN(target)) return null;
  return Math.round((target - now) / 86400000);
}

export function formatCountdown(days) {
  if (days == null) return "";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

function shortDate(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function useHomeData() {
  const [data, setData] = useState({
    loading: true,
    metricsCount: 0,
    openRequests: 0,
    openAlerts: 0,
    overdue: 0,
    dueSoon: 0,
    priorities: [],
    deadlines: [],
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const [metrics, requests, alerts] = await Promise.all([
        listAllHealthMetrics().catch(() => []),
        base44.entities.PolicyRequest.list("-updated_date", 100).catch(() => []),
        base44.entities.AlertEvent.filter({ status: "open" }, "-created_date", 100).catch(() => []),
      ]);
      if (!alive) return;

      const now = new Date();
      const open = (requests || []).filter((r) => !CLOSED_STATUSES.includes(r.current_status));
      const withDue = open
        .map((r) => ({ ...r, _days: daysUntilDate(r.required_completion_date, now) }))
        .filter((r) => r._days != null);

      const overdue = withDue.filter((r) => r._days < 0).length;
      const dueSoon = withDue.filter((r) => r._days >= 0 && r._days <= 30).length;

      const priorities = open.slice(0, 8).map((r) => {
        const d = daysUntilDate(r.required_completion_date, now);
        const status =
          d != null && d < 0 ? "overdue"
            : (d != null && d <= 7) || ["high", "critical"].includes(r.urgency) ? "at-risk"
            : "on-track";
        return {
          id: r.id,
          label: r.request_title,
          app: r.department,
          dueLabel: r.required_completion_date ? shortDate(r.required_completion_date) : null,
          status,
        };
      });

      const deadlines = withDue
        .filter((r) => r._days >= -14)
        .sort((a, b) => a._days - b._days)
        .slice(0, 6)
        .map((r) => ({
          id: r.id,
          label: r.request_title,
          due: shortDate(r.required_completion_date),
          days: r._days,
          urgency: r._days < 7 ? "high" : r._days < 30 ? "medium" : "low",
        }));

      setData({
        loading: false,
        metricsCount: (metrics || []).length,
        openRequests: open.length,
        openAlerts: (alerts || []).length,
        overdue,
        dueSoon,
        priorities,
        deadlines,
      });
    })();
    return () => { alive = false; };
  }, []);

  return data;
}