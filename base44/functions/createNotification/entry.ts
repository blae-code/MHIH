import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, type, severity = 'info', related_entity_id, related_entity_type, action_url } = body;

    if (!title || !message || !type) {
      return Response.json({ error: 'Missing required fields: title, message, type' }, { status: 400 });
    }

    // Get user's notification preferences
    let prefs = await base44.entities.NotificationPreference.filter({ user_email: user.email });
    if (!prefs.length) {
      // Create default preferences if they don't exist
      prefs = [await base44.entities.NotificationPreference.create({
        user_email: user.email,
        data_source_failure: { enabled: true, channels: ['in_app', 'email'] },
        data_source_success: { enabled: false, channels: ['in_app'] },
        ai_insight: { enabled: true, channels: ['in_app', 'email'] },
        health_alert: { enabled: true, channels: ['in_app', 'email'] },
        quality_flag: { enabled: true, channels: ['in_app'] },
        system_info: { enabled: false, channels: ['in_app'] }
      })];
    }

    const userPrefs = prefs[0];
    const typePrefs = userPrefs[type];

    // Check if user has this notification type enabled
    if (!typePrefs?.enabled) {
      return Response.json({ skipped: true, reason: 'User disabled this notification type' });
    }

    // Determine channels to send to
    const channels = typePrefs.channels || ['in_app'];

    // Create notification record
    const notification = await base44.entities.Notification.create({
      title,
      message,
      type,
      severity,
      recipient_email: user.email,
      channels,
      read: false,
      related_entity_id,
      related_entity_type,
      action_url,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Send email if email channel is enabled
    if (channels.includes('email')) {
      const emailBody = `
<h2>${title}</h2>
<p>${message}</p>
${action_url ? `<a href="${action_url}" style="display: inline-block; padding: 10px 20px; background: #FEDD00; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Details</a>` : ''}
<p style="margin-top: 20px; font-size: 12px; color: #666;">
  You received this notification because of your notification preferences. <a href="#">Update preferences</a>
</p>
      `;

      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `[${severity.toUpperCase()}] ${title}`,
          body: emailBody
        });
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        // Don't fail the entire operation if email fails
      }
    }

    return Response.json({
      success: true,
      notification_id: notification.id,
      channels_sent: channels
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});