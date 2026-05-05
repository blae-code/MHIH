import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { normalizeEmail, resolveRoleForUser } from './_shared/rolePolicy.ts';

async function getUserById(base44: any, id: string) {
  try {
    return await base44.asServiceRole.entities.User.get(id);
  } catch {
    const found = await base44.asServiceRole.entities.User.filter({ id }, '-created_date', 1).catch(() => []);
    return found?.[0] || null;
  }
}

async function getUserByEmail(base44: any, email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const users = await base44.asServiceRole.entities.User.list('-created_date', 3000).catch(() => []);
  return users.find((u: any) => normalizeEmail(u.email) === normalized) || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const actor = await base44.auth.me().catch(() => null);
    const actorIsAdmin = actor?.role === 'admin';

    const payloadUser = body?.user || body?.payload?.user || body?.data?.user || {};
    const targetUserId = String(body?.target_user_id || body?.user_id || payloadUser?.id || actor?.id || '').trim();
    const targetEmail = normalizeEmail(body?.email || payloadUser?.email || actor?.email);

    if (!targetUserId && !targetEmail) {
      return Response.json({ error: 'Missing target user' }, { status: 400 });
    }

    // Non-admin callers can only normalize themselves.
    if (actor && !actorIsAdmin) {
      if (targetUserId && targetUserId !== actor.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (targetEmail && targetEmail !== normalizeEmail(actor.email)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let target = null;
    if (targetUserId) target = await getUserById(base44, targetUserId);
    if (!target && targetEmail) target = await getUserByEmail(base44, targetEmail);
    if (!target && actor) target = actor;

    if (!target) {
      return Response.json({ error: 'Target user not found' }, { status: 404 });
    }

    const normalizedRole = resolveRoleForUser(target.email, target.role);
    if (target.role === normalizedRole) {
      return Response.json({
        success: true,
        updated: false,
        user_id: target.id,
        email: target.email,
        role: normalizedRole,
      });
    }

    await base44.asServiceRole.entities.User.update(target.id, { role: normalizedRole });

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'role_normalized',
      entity_type: 'User',
      entity_id: target.id,
      user_email: actor?.email || 'system',
      details: `Role normalized to ${normalizedRole} via assignDefaultUserRole`,
      metadata: {
        target_email: target.email,
        previous_role: target.role || null,
        next_role: normalizedRole,
      },
    }).catch(() => {});

    return Response.json({
      success: true,
      updated: true,
      user_id: target.id,
      email: target.email,
      role: normalizedRole,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
