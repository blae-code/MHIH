import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Sends an email notification to the user a Policy Request has been assigned to.
 * Payload: {
 *   request_id, assignee_email, assignee_name, request_title,
 *   requester_name, requester_email, urgency, request_type
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      request_id,
      assignee_email,
      assignee_name,
      request_title,
      requester_name,
      requester_email,
      urgency,
      request_type,
    } = body;

    if (!assignee_email || !request_title) {
      return Response.json({ error: 'assignee_email and request_title are required' }, { status: 400 });
    }

    const typeLabel = (request_type || '').replace(/_/g, ' ');
    const urgencyLabel = (urgency || 'medium').toUpperCase();

    const subject = `New Policy Request Assigned: ${request_title}`;
    const bodyText = `
Hello ${assignee_name || ''},

A new policy request has been assigned to you in the Red River Module.

Title: ${request_title}
Type: ${typeLabel}
Urgency: ${urgencyLabel}
Submitted by: ${requester_name || 'Unknown'} (${requester_email || ''})

Please log in to the Red River OS to review the request, update progress, or contact the requester.

Request ID: ${request_id || 'n/a'}

— Red River OS
`.trim();

    await base44.integrations.Core.SendEmail({
      to: assignee_email,
      subject,
      body: bodyText,
      from_name: 'Red River OS',
    });

    // Also create an in-app notification if Notification entity exists
    try {
      await base44.asServiceRole.entities.Notification.create({
        title: 'Policy Request Assigned',
        message: `${request_title} has been assigned to you.`,
        type: 'system_info',
        severity: urgency === 'critical' ? 'critical' : urgency === 'high' ? 'high' : 'medium',
        recipient_email: assignee_email,
        channels: ['in_app', 'email'],
        related_entity_id: request_id,
        related_entity_type: 'PolicyRequest',
      });
    } catch (e) {
      // Non-fatal
      console.warn('notification create failed', e?.message ?? e);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});