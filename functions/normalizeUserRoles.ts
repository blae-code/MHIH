import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { normalizeEmail, resolveRoleForUser } from './_shared/rolePolicy.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dry_run);
    const limit = Math.max(1, Math.min(5000, Number(body?.limit || 3000)));

    const actor = await base44.auth.me().catch(() => null);
    if (actor && actor.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', limit);
    const updates = users
      .map((u: any) => {
        const nextRole = resolveRoleForUser(u.email, u.role);
        if (u.role === nextRole) return null;
        return {
          id: u.id,
          email: normalizeEmail(u.email),
          previous_role: u.role || null,
          next_role: nextRole,
        };
      })
      .filter(Boolean);

    if (!dryRun) {
      for (const change of updates) {
        await base44.asServiceRole.entities.User.update(change!.id, { role: change!.next_role });
      }

      if (updates.length > 0) {
        await base44.asServiceRole.entities.AuditLog.create({
          action: 'role_bulk_normalized',
          entity_type: 'User',
          user_email: actor?.email || 'system',
          details: `Normalized ${updates.length} user roles to admin/user model`,
          metadata: {
            changed_count: updates.length,
            limit,
          },
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      scanned: users.length,
      changed_count: updates.length,
      changed_users: updates.slice(0, 200),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
