# Daykeeper

A colorful, private personal organizer for tasks, birthdays, and events. Built with React, vinext, and Cloudflare Workers, with persistent records in D1.

See [CLOUDFLARE.md](CLOUDFLARE.md) for the exact GitHub build settings, database initialization, and Cloudflare Access email-code setup.

## Features

- Today view with overdue and undated tasks
- Add, edit, prioritize, complete, reopen, search, and delete tasks
- Annual birthdays and events, calendar view, and dashboard reminders
- Responsive phone and desktop layouts
- Verified Cloudflare Access identity and per-user database records

The current version does not make AI calls, send notifications, or book appointments. Reminders appear in the dashboard.

## Development

Use Node.js 22.13 or newer. Run `npm ci`, `npm run build`, and `npm run db:migrate:local`. Copy `.dev.vars.example` to `.dev.vars`, then run `npm run dev`.

Local development uses a synthetic identity only with explicit opt-in and loopback access. The production build never accepts that identity. Local D1 data is separate from the live database.

## Checks

```text
npm run typecheck
npm test
npm run build
npm run deploy -- --dry-run
```

The original ChatGPT Site remains at its existing deployment. Its configuration is retained under `.openai/` for provenance, but the Cloudflare build no longer depends on Sites. Moving its records requires an explicit data transfer and owner-identity mapping.
