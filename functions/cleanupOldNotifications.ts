import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all notifications that have expired
    const allNotifications = await base44.asServiceRole.entities.Notification.list('-created_date', 1000);
    
    const now = new Date();
    const expiredNotifications = allNotifications.filter(n => {
      if (!n.expires_at) return false;
      return new Date(n.expires_at) < now;
    });

    // Delete expired notifications
    let deletedCount = 0;
    for (const notification of expiredNotifications) {
      try {
        await base44.asServiceRole.entities.Notification.delete(notification.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete notification ${notification.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      checked: allNotifications.length,
      deleted: deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});