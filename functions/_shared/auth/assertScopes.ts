import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

export class AuthScopeError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status = 403, code = 'forbidden', details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type AuthPrincipal = {
  principal_id: string;
  principal_type: 'service_token' | 'user';
  scopes: string[];
  email?: string;
  role?: string;
};

type TokenScopeConfig = Record<string, string[] | { scopes: string[]; principal_id?: string }>;

const USER_SCOPE_MAP: Record<string, string[]> = {
  admin: ['rr_os:read_catalog', 'rr_os:read_projection', 'rr_os:snapshots', 'catalog:write'],
  user: ['rr_os:read_catalog', 'rr_os:read_projection', 'rr_os:snapshots'],
};

function parseAuthHeader(req: Request) {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function parseTokenConfig(): TokenScopeConfig {
  const raw = Deno.env.get('RR_OS_API_TOKENS');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // Ignore malformed env values; an authorization failure will surface.
  }
  return {};
}

function resolveTokenPrincipal(token: string, requiredScopes: string[]): AuthPrincipal | null {
  const config = parseTokenConfig();
  const configValue = config[token];
  if (!configValue) return null;

  const scopes = Array.isArray(configValue)
    ? configValue
    : Array.isArray(configValue?.scopes)
      ? configValue.scopes
      : [];
  if (!requiredScopes.every((scope) => scopes.includes(scope))) {
    throw new AuthScopeError('Insufficient token scope', 403, 'insufficient_scope', {
      required_scopes: requiredScopes,
      token_scopes: scopes,
    });
  }

  return {
    principal_id: Array.isArray(configValue) ? 'service_token' : String(configValue?.principal_id || 'service_token'),
    principal_type: 'service_token',
    scopes,
  };
}

async function resolveUserPrincipal(req: Request, requiredScopes: string[]): Promise<AuthPrincipal | null> {
  const base44 = createClientFromRequest(req);
  let user: any = null;
  try {
    user = await base44.auth.me();
  } catch {
    return null;
  }
  if (!user?.role || !USER_SCOPE_MAP[user.role]) return null;

  const scopes = USER_SCOPE_MAP[user.role];
  if (!requiredScopes.every((scope) => scopes.includes(scope))) {
    throw new AuthScopeError('User role does not have required scope', 403, 'insufficient_scope', {
      role: user.role,
      required_scopes: requiredScopes,
      allowed_scopes: scopes,
    });
  }

  return {
    principal_id: String(user.id || user.email || 'user'),
    principal_type: 'user',
    scopes,
    email: user.email,
    role: user.role,
  };
}

export async function assertScopes(req: Request, requiredScopes: string[]): Promise<AuthPrincipal> {
  if (!Array.isArray(requiredScopes) || requiredScopes.length === 0) {
    throw new AuthScopeError('No required scopes configured', 500, 'scope_config_error');
  }

  const token = parseAuthHeader(req);
  if (token) {
    const tokenPrincipal = resolveTokenPrincipal(token, requiredScopes);
    if (tokenPrincipal) return tokenPrincipal;
  }

  const userPrincipal = await resolveUserPrincipal(req, requiredScopes);
  if (userPrincipal) return userPrincipal;

  throw new AuthScopeError('Unauthorized', 401, 'unauthorized');
}
