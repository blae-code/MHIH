export const SYSTEM_ADMIN_EMAIL = 'blae@katrasoluta.com';

export function normalizeEmail(email: string | null | undefined) {
  return String(email || '').trim().toLowerCase();
}

export function isCanonicalRole(role: string | null | undefined) {
  return role === 'admin' || role === 'user';
}

export function resolveRoleForUser(email: string | null | undefined, currentRole: string | null | undefined) {
  const normalized = normalizeEmail(email);
  if (normalized === SYSTEM_ADMIN_EMAIL) return 'admin';
  if (currentRole === 'admin') return 'admin';
  return 'user';
}
