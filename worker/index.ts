import handler from 'vinext/server/fetch-handler';
import { accessIssuer, identityRequest, localDevelopmentIdentity, verifyAccessIdentity } from '../lib/access';
import type { AccessConfig } from '../lib/access';

export default {
  async fetch(request: Request, env: Cloudflare.Env & AccessConfig, ctx: ExecutionContext) {
    const localUser = localDevelopmentIdentity(request, env, import.meta.env.DEV);
    const user = localUser ?? await verifyAccessIdentity(request.headers.get('cf-access-jwt-assertion'), env);
    if (!user) {
      const configured = !!accessIssuer(env);
      const error = configured
        ? 'Sign in through Cloudflare Access to open Daykeeper.'
        : 'Daykeeper sign-in is being configured. Set ACCESS_TEAM_DOMAIN and ACCESS_AUD, then enable Cloudflare Access for this Worker.';
      const status = configured ? 401 : 503;
      const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
      if (new URL(request.url).pathname.startsWith('/api/')) return Response.json({ error }, { status, headers });
      return new Response(error, { status, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const response = await handler.fetch(identityRequest(request, user), env, ctx);
    const headers = new Headers(response.headers);
    // Private organizer responses must not be reused by another account or device.
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'same-origin');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
