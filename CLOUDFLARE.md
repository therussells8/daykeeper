# Deploy Daykeeper to your Cloudflare account

The app uses the existing vinext / Cloudflare Vite plugin build. Its generated Wrangler config is `dist/server/wrangler.json`; `vite.config.ts` and `cloudflare.project.json` are the source configuration. This preserves the tested runtime compatibility date and dependency versions. No ChatGPT Sites service or AI API key is required.

## GitHub integration

In Cloudflare, choose **Workers & Pages → Create application → GitHub**, authorize access to `therussells8/daykeeper`, and select that repository.

| Setting | Value |
| --- | --- |
| Worker name | `daykeeper` |
| Production branch | `main` |
| Root directory | Repository root (`/`) |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Build environment variable | `NODE_VERSION` = `22` |

Disable non-production branch builds for now. They must not deploy against the production database. No output directory is entered for a Worker. The build prepares static assets, the server, and the SQL migration files. The deploy command explicitly uses the generated config and preserves runtime variables entered in the dashboard.

The first deployment returns a setup message until Access is configured. All application routes, assets, and API operations are protected by the Worker authentication check. Unconfigured or invalid authentication cannot read or change the database.

## Database

The `DB` binding points to the existing `daykeeper-db` database:

`111c33b3-b1c9-4ea7-ba17-1bd75b5c2449`

For the initial empty database, open **D1 SQL Database → daykeeper-db → Console** and execute the schema from `drizzle/0000_normal_mathemanic.sql`:

```sql
CREATE TABLE entries (
  id text PRIMARY KEY NOT NULL,
  owner text NOT NULL,
  data text NOT NULL
);
CREATE INDEX entries_owner_idx ON entries (owner);
```

Execute this once, on the empty database. This dashboard initialization does not record a Wrangler migration. For future changes, either use reviewed dashboard SQL or first reconcile the migration history before switching to automated migrations. Never replay an already applied schema migration.

Alternatively, **instead of** dashboard SQL, authenticate the local CLI to the intended account and run `npm run build` then `npm run db:migrate:remote` to apply and track migrations. This needs D1 Edit permission. `npm run deploy:cloudflare` combines tracked migrations and deployment for a configured CLI or CI token with that permission. Cloudflare's default build token may need its permissions extended before using automated D1 migrations.

The ChatGPT Site database is separate. Its records are not transferred automatically, and Access user identifiers differ from Sites identifiers. Any transfer must explicitly remap the owner's records to the verified Access identity. The existing hosted ChatGPT Site is unchanged.

## Private sign-in with an email code

1. Enable Cloudflare Zero Trust for the account and choose a team name. Use a plan appropriate for personal use.
2. In the identity-provider settings, add **One-time PIN**. New organizations may default to a different login provider.
3. Enable **Cloudflare Access** for the `daykeeper` Worker's production `workers.dev` address. Protect any later custom domain too. Keep version/preview URLs disabled until their access policy and database isolation are configured.
4. Edit the application's Allow policy so **Include → Emails** contains only your intended sign-in email. Remove broad allow rules. Select One-time PIN as the login method.
5. Copy the Access team's HTTPS domain (`https://YOUR-TEAM.cloudflareaccess.com`) and the application's **Application Audience (AUD) Tag**.
6. Under the Worker's **Settings → Variables and Secrets**, add these runtime text variables:

   | Variable | Value |
   | --- | --- |
   | `ACCESS_TEAM_DOMAIN` | Your complete HTTPS team domain |
   | `ACCESS_AUD` | The application's Audience (AUD) Tag |

7. Apply/deploy the runtime variable change, open the Worker URL, and sign in using your email code.

These values are configuration identifiers, not login codes or API tokens. Never commit access JWTs, email login codes, API tokens, or local secret files. The Worker verifies the JWT signature, issuer, audience, expiry, and user identity before forwarding a request. Incoming identity headers cannot grant access.

## Verification

- Open the URL in a private browser window: Access should require an email code.
- An email not listed in the Allow policy must not receive access.
- Add a task, reload, complete and edit it, then verify it from your phone after signing in.
- Add an annual birthday and check its calendar date and dashboard reminder.
- Confirm the Worker has the `DB` binding and no placeholder database identifier.

Notifications and unattended actions are not part of this version. Dashboard reminders appear while the app is open.

## Local development

```text
npm ci
npm run build
npm run db:migrate:local
```

Copy `.dev.vars.example` to `.dev.vars`, then run `npm run dev`. It listens on loopback only. `DAYKEEPER_DEV_AUTH=1` enables a synthetic identity only in development and only for loopback requests; the production build always ignores it. This never uses the live D1 database during local development.

```text
npm run typecheck
npm test
```

After changing bindings, build and run `npm run types:cloudflare` to regenerate `cloudflare-env.d.ts`. A deployment dry run is available with `npm run deploy -- --dry-run` after building; it does not deploy or validate live account settings.

To roll back code, use a prior Worker deployment or redeploy a prior Git commit. Database changes and data transfers need their own backup and recovery plan; rolling back a Worker does not roll back D1.

Official references: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).
