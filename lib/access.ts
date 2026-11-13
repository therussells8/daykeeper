import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTVerifyGetKey } from 'jose';

export type AccessConfig = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  DAYKEEPER_DEV_AUTH?: string;
};
export type UserIdentity = { userId: string; email: string };

// Only public verification keys are cached; user identities are request-scoped.
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export function accessIssuer(config: AccessConfig): string | null {
  if (!config.ACCESS_AUD || !config.ACCESS_TEAM_DOMAIN) return null;
  try {
    const url = new URL(config.ACCESS_TEAM_DOMAIN);
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(url.hostname)
      || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}

export async function verifyAccessIdentity(
  token: string | null,
  config: AccessConfig,
  testKey?: JWTVerifyGetKey,
): Promise<UserIdentity | null> {
  const issuer = accessIssuer(config);
  if (!issuer || !token) return null;
  try {
    let key = testKey ?? keySets.get(issuer);
    if (!key) {
      const remoteKey = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer), { timeoutDuration: 5000 });
      keySets.set(issuer, remoteKey);
      key = remoteKey;
    }
    const { payload } = await jwtVerify(token, key, {
      issuer, audience: config.ACCESS_AUD, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'],
    });
    if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.email !== 'string' || !payload.email) return null;
    return { userId: `access:${payload.sub}`, email: payload.email };
  } catch { return null; }
}

export function identityRequest(request: Request, user: UserIdentity): Request {
  const headers = new Headers(request.headers);
  // Caller-provided identity headers are never trusted or forwarded.
  for (const name of [...headers.keys()]) {
    if (name.startsWith('x-daykeeper-user-') || name.startsWith('oai-authenticated-user-')) headers.delete(name);
  }
  headers.set('x-daykeeper-user-id', user.userId);
  headers.set('x-daykeeper-user-email', user.email);
  return new Request(request, { headers });
}

export function localDevelopmentIdentity(request: Request, config: AccessConfig, isDevelopment: boolean): UserIdentity | null {
  if (!isDevelopment || config.DAYKEEPER_DEV_AUTH !== '1') return null;
  const url = new URL(request.url);
  if (!['localhost','127.0.0.1','[::1]'].includes(url.hostname)) return null;
  return { userId: 'local-development', email: 'developer@localhost' };
}
