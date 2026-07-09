// policyAlertBridge — Data → Policy automation.
// Triggered when a critical/high AlertEvent is created by the Data app's
// sentinel scans. Finds Policy registry entries in the same health category
// and notifies admins with a policy signal so monitoring feeds directly
// into policy work.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const event = payload?.event ?? {};
    let alert = payload?.data;

    if (!alert && event.entity_id) {
      alert = await base44.asServiceRole.entities.AlertEvent.get(event.entity_id);
    }
    if (!alert) return Response.json({ skipped: true, reason: 'no alert data' });

    if (!['critical', 'high'].includes(alert.severity)) {
      return Response.json({ skipped: true, reason: 'severity below threshold' });
    }

    // Find matching policies by health category
    let matchingPolicies = [];
    if (alert.category) {
      matchingPolicies = await base44.asServiceRole.entities.Policy.filter({ category: alert.category });
    }

    const policyNote = matchingPolicies.length > 0
      ? ` Related policies: ${matchingPolicies.slice(0, 3).map((p) => p.title).join('; ')}${matchingPolicies.length > 3 ? '…' : ''}.`
      : ' No registered policies currently cover this category — possible policy gap.';

    // Notify all admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const notifications = admins.map((u) => ({
      title: `Policy signal: ${alert.severity} alert — ${alert.metric_name || alert.category || 'health metric'}`,
      message: `${alert.summary}${policyNote}`,
      type: 'health_alert',
      severity: alert.severity,
      recipient_email: u.email,
      channels: ['in_app'],
      related_entity_id: alert.id,
      related_entity_type: 'AlertEvent',
      action_url: '/os/apps/policy-workbench',
    }));
    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    return Response.json({
      processed: true,
      alert_id: alert.id,
      matched_policies: matchingPolicies.length,
      notified_admins: notifications.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});