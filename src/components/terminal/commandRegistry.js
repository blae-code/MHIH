/**
 * Terminal-lite command registry.
 *
 * Every command runs against real app operations via the Base44 SDK.
 * Admin-only commands are double-gated: rejected here for non-admins,
 * and the backend functions they call independently verify the role.
 * Every executed command is written to the audit log by the console.
 */

import { base44 } from "@/api/base44Client";
import { listAllHealthMetrics } from "@/lib/healthMetrics";

const fmtTime = (d) => d ? new Date(d).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

async function findSource(query) {
  const sources = await base44.entities.DataSource.list("-updated_date", 200);
  const q = query.toLowerCase();
  const exact = sources.find((s) => s.id === query || s.name?.toLowerCase() === q);
  if (exact) return { match: exact };
  const partial = sources.filter((s) => s.name?.toLowerCase().includes(q));
  if (partial.length === 1) return { match: partial[0] };
  return { candidates: partial };
}

async function runSourceSync(source, print) {
  print("sys", `Syncing "${source.name}" (${source.id})...`);
  const res = await base44.functions.invoke("scheduledDataSync", { source_id: source.id });
  const result = res.data?.results?.[0];
  if (result?.status === "failed") print("err", `Sync failed: ${result.error}`);
  else if (result?.status === "skipped") print("warn", `Skipped: ${result.error}`);
  else print("ok", `Sync complete: ${source.name}${result?.records_inserted != null ? ` — ${result.records_inserted} records inserted` : ""}`);
}

export const COMMANDS = [
  {
    name: "help",
    usage: "/help",
    description: "List available commands",
    run: async ({ user, print }) => {
      const isAdmin = user?.role === "admin";
      print("sys", "Available commands:");
      COMMANDS.forEach((c) => {
        if (c.admin && !isAdmin) return;
        print("out", `  ${c.usage.padEnd(34)} ${c.description}${c.admin ? "  [admin]" : ""}`);
      });
      if (!isAdmin) print("warn", "Some commands are hidden — they require the admin role.");
    },
  },
  {
    name: "whoami",
    usage: "/whoami",
    description: "Show current user and access level",
    run: async ({ user, print }) => {
      print("out", `${user?.full_name ?? "—"} <${user?.email ?? "—"}>`);
      print("out", `role: ${user?.role ?? "user"} · access: ${user?.role === "admin" ? "full command set" : "read-only command set"}`);
    },
  },
  {
    name: "logs",
    usage: "/logs <sync|alerts|agents|audit> [n]",
    description: "Reproduce recent platform logs",
    run: async ({ argv, user, print }) => {
      const kind = argv[0];
      const n = Math.min(parseInt(argv[1], 10) || 10, 50);
      if (kind === "sync") {
        const jobs = await base44.entities.SyncJob.list("-created_date", n);
        if (jobs.length === 0) return print("warn", "No sync jobs found.");
        jobs.forEach((j) => print(j.status === "failed" ? "err" : j.status === "success" ? "ok" : "out",
          `[${(j.status || "?").padEnd(7)}] ${fmtTime(j.started_at || j.created_date)}  ${j.source_name}  fetched=${j.records_fetched ?? "—"} inserted=${j.records_inserted ?? "—"}  id=${j.id}`));
      } else if (kind === "alerts") {
        const alerts = await base44.entities.AlertEvent.list("-created_date", n);
        if (alerts.length === 0) return print("warn", "No alert events found.");
        alerts.forEach((a) => print(a.severity === "critical" || a.severity === "high" ? "err" : "out",
          `[${(a.severity || "?").padEnd(8)}] [${(a.status || "?").padEnd(12)}] ${fmtTime(a.created_date)}  ${a.summary}  id=${a.id}`));
      } else if (kind === "agents") {
        const tasks = await base44.entities.AgentTask.list("-created_date", n);
        if (tasks.length === 0) return print("warn", "No agent tasks found.");
        tasks.forEach((t) => print(t.status === "failed" ? "err" : "out",
          `[${(t.status || "?").padEnd(9)}] ${fmtTime(t.created_date)}  ${t.agent_name} · ${t.task_type}  ${t.summary ?? ""}`));
      } else if (kind === "audit") {
        if (user?.role !== "admin") return print("err", "Permission denied: /logs audit requires admin role.");
        const entries = await base44.entities.AuditLog.list("-created_date", n);
        if (entries.length === 0) return print("warn", "No audit entries found.");
        entries.forEach((e) => print("out",
          `${fmtTime(e.created_date)}  ${e.user_email}  ${e.action}${e.entity_type ? ` ${e.entity_type}` : ""}${e.entity_name ? ` "${e.entity_name}"` : ""}${e.details ? ` — ${e.details}` : ""}`));
      } else {
        print("err", "Usage: /logs <sync|alerts|agents|audit> [n]");
      }
    },
  },
  {
    name: "sources",
    usage: "/sources",
    description: "List connected data sources",
    run: async ({ print }) => {
      const sources = await base44.entities.DataSource.list("-updated_date", 100);
      if (sources.length === 0) return print("warn", "No data sources.");
      sources.forEach((s) => print(s.status === "error" ? "err" : "out",
        `[${(s.status || "?").padEnd(8)}] ${(s.name || "").slice(0, 48).padEnd(50)} last_synced=${s.last_synced ? fmtTime(s.last_synced) : "never"}`));
      print("sys", `${sources.length} sources.`);
    },
  },
  {
    name: "sync",
    usage: "/sync <source name>",
    description: "Trigger a data sync for a source",
    admin: true,
    run: async ({ argv, print }) => {
      const query = argv.join(" ").trim();
      if (!query) return print("err", "Usage: /sync <source name>");
      const { match, candidates } = await findSource(query);
      if (!match) {
        if (!candidates || candidates.length === 0) return print("err", `No source matching "${query}".`);
        print("warn", `Ambiguous — ${candidates.length} matches:`);
        candidates.slice(0, 8).forEach((s) => print("out", `  ${s.name}`));
        return;
      }
      await runSourceSync(match, print);
    },
  },
  {
    name: "replay",
    usage: "/replay <sync-job-id>",
    description: "Re-run the sync behind a previous job",
    admin: true,
    run: async ({ argv, print }) => {
      const id = argv[0];
      if (!id) return print("err", "Usage: /replay <sync-job-id>  (find ids with /logs sync)");
      const jobs = await base44.entities.SyncJob.filter({ id });
      const job = jobs?.[0];
      if (!job) return print("err", `Sync job ${id} not found.`);
      print("sys", `Original run: [${job.status}] ${fmtTime(job.started_at || job.created_date)} ${job.source_name}${job.error_message ? ` — ${job.error_message}` : ""}`);
      const sources = await base44.entities.DataSource.filter({ id: job.source_id });
      if (!sources?.[0]) return print("err", `Source ${job.source_id} no longer exists.`);
      await runSourceSync(sources[0], print);
    },
  },
  {
    name: "scan",
    usage: "/scan <sentinel|quality>",
    description: "Run a detection pipeline",
    admin: true,
    run: async ({ argv, print }) => {
      const kind = argv[0];
      const fn = kind === "sentinel" ? "runSentinelScan" : kind === "quality" ? "runDataQualityScan" : null;
      if (!fn) return print("err", "Usage: /scan <sentinel|quality>");
      print("sys", `Running ${fn}... (this can take a while)`);
      const res = await base44.functions.invoke(fn, {});
      const out = JSON.stringify(res.data ?? {}, null, 0);
      print(res.data?.error ? "err" : "ok", out.length > 600 ? out.slice(0, 600) + " …[truncated]" : out);
    },
  },
  {
    name: "alerts",
    usage: "/alerts [open]",
    description: "List alert events",
    run: async ({ argv, print }) => {
      const alerts = argv[0] === "open"
        ? await base44.entities.AlertEvent.filter({ status: "open" }, "-created_date", 25)
        : await base44.entities.AlertEvent.list("-created_date", 25);
      if (alerts.length === 0) return print("ok", "No alerts. All clear.");
      alerts.forEach((a) => print(a.severity === "critical" || a.severity === "high" ? "err" : "out",
        `[${(a.severity || "?").padEnd(8)}] [${(a.status || "?").padEnd(12)}] ${a.summary}  id=${a.id}`));
      print("sys", `${alerts.length} alerts. Use /ack <id> to acknowledge.`);
    },
  },
  {
    name: "ack",
    usage: "/ack <alert-id>",
    description: "Acknowledge an alert",
    admin: true,
    run: async ({ argv, print }) => {
      const id = argv[0];
      if (!id) return print("err", "Usage: /ack <alert-id>");
      await base44.entities.AlertEvent.update(id, { status: "acknowledged", acknowledged_at: new Date().toISOString() });
      print("ok", `Alert ${id} acknowledged.`);
    },
  },
  {
    name: "metrics",
    usage: "/metrics count [category]",
    description: "Query health metric counts",
    run: async ({ argv, print }) => {
      if (argv[0] !== "count") return print("err", "Usage: /metrics count [category]");
      const metrics = await listAllHealthMetrics();
      const category = argv[1];
      if (category) {
        const filtered = metrics.filter((m) => m.category === category);
        return print("out", `${filtered.length} metrics in category "${category}" (of ${metrics.length} total)`);
      }
      const byCat = {};
      metrics.forEach((m) => { byCat[m.category || "?"] = (byCat[m.category || "?"] || 0) + 1; });
      Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => print("out", `  ${c.padEnd(24)} ${n}`));
      print("sys", `${metrics.length} metrics total.`);
    },
  },
  {
    name: "users",
    usage: "/users",
    description: "List registered users",
    admin: true,
    run: async ({ print }) => {
      const users = await base44.entities.User.list();
      users.forEach((u) => print("out", `[${(u.role || "user").padEnd(6)}] ${(u.full_name || "—").padEnd(28)} ${u.email}`));
      print("sys", `${users.length} users.`);
    },
  },
  {
    name: "invite",
    usage: "/invite <email> [user|admin]",
    description: "Invite a user to the platform",
    admin: true,
    run: async ({ argv, print }) => {
      const email = argv[0];
      const role = argv[1] === "admin" ? "admin" : "user";
      if (!email || !email.includes("@")) return print("err", "Usage: /invite <email> [user|admin]");
      await base44.users.inviteUser(email, role);
      print("ok", `Invited ${email} as ${role}.`);
    },
  },
];

export function findCommand(name) {
  const clean = name.replace(/^\//, "").toLowerCase();
  return COMMANDS.find((c) => c.name === clean);
}