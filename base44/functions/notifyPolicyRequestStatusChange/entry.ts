import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Pretty labels for status values (kept in sync with the modal UI)
const STATUS_LABELS = {
  submitted: "Submitted",
  received: "Received",
  in_review: "In Review",
  assigned: "Assigned",
  started: "Started",
  in_progress: "In Progress",
  proofing: "Proofing",
  sent_for_approval: "Sent for Approval",
  completed: "Completed",
  rejected: "Rejected",
  closed: "Closed",
};

const labelFor = (s) => STATUS_LABELS[s] || (s ? String(s).replace(/_/g, " ") : "—");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { data, old_data, changed_fields = [], event } = body;

    if (!data) {
      return Response.json({ skipped: "no data in payload" });
    }

    // Only notify if the requester opted in.
    if (!data.subscribe_to_updates) {
      return Response.json({ skipped: "user did not subscribe to updates" });
    }

    const to = data.contact_person_email;
    if (!to) {
      return Response.json({ skipped: "no contact email on request" });
    }

    const statusChanged = changed_fields.includes("current_status");
    const progressChanged = changed_fields.includes("progress_percent");

    if (!statusChanged && !progressChanged) {
      return Response.json({ skipped: "no relevant field changed" });
    }

    const newStatus = labelFor(data.current_status);
    const oldStatus = labelFor(old_data?.current_status);
    const newPct = data.progress_percent;
    const oldPct = old_data?.progress_percent;

    // Build subject
    let subject;
    if (statusChanged) {
      subject = `Update on your policy request: "${data.request_title}" — ${newStatus}`;
    } else {
      subject = `Update on your policy request: "${data.request_title}" — ${newPct ?? 0}% complete`;
    }

    // Build body
    const lines = [];
    lines.push(`Hi ${data.contact_person_name || "there"},`);
    lines.push("");
    lines.push(`There has been an update on your policy request "${data.request_title}".`);
    lines.push("");

    if (statusChanged) {
      lines.push(`Status: ${oldStatus} → ${newStatus}`);
    } else {
      lines.push(`Status: ${newStatus}`);
    }

    if (data.current_status === "in_progress" && typeof newPct === "number") {
      if (progressChanged && typeof oldPct === "number") {
        lines.push(`Progress: ${oldPct}% → ${newPct}% complete`);
      } else {
        lines.push(`Progress: ${newPct}% complete`);
      }
    } else if (progressChanged && typeof newPct === "number") {
      lines.push(`Progress: ${newPct}% complete`);
    }

    if (data.assigned_to_user_name) {
      lines.push(`Assigned to: ${data.assigned_to_user_name}`);
    }
    if (data.progress_notes) {
      lines.push("");
      lines.push("Latest note from the assignee:");
      lines.push(data.progress_notes);
    }

    lines.push("");
    lines.push("You are receiving this email because you opted in to progress updates when submitting this request.");
    lines.push("");
    lines.push("— MNBC Policy Intake");

    const emailBody = lines.join("\n");

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: "MNBC Policy Intake",
      to,
      subject,
      body: emailBody,
    });

    return Response.json({
      sent: true,
      to,
      changed: { statusChanged, progressChanged },
      event_id: event?.entity_id,
    });
  } catch (error) {
    console.error("notifyPolicyRequestStatusChange failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});