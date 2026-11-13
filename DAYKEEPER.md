# Daykeeper

A private, responsive personal organizer. Tasks, birthdays, and events are stored in Cloudflare D1 and scoped to the signed-in ChatGPT user. Sites provides the private hosting and sign-in boundary. No OpenAI API key or AI calls are used in this version.

## Run

Install with `npm run install:ci`, generate migrations with `npm run db:generate`, and build with `npm run build`. Apply each pending migration locally using the commands in README.md, then run `npm run dev`. The development sign-in link uses the starter's loopback-only mock identity. Hosted data and local data are separate.

Checks: `npx tsc --noEmit` and `node --experimental-strip-types --test tests/model.test.mjs`.

## Current behavior

- Add, edit, complete, reopen, search, and delete tasks. Tasks support due dates, priority, and notes.
- Birthdays and events support annual recurrence and advance dashboard reminders. February 29 is observed on February 28 in non-leap years.
- Today includes overdue and undated open tasks. My tasks includes future and completed tasks.
- Calendar displays tasks and events with month navigation.
- All dates are calendar dates in the browser's local timezone. Reminder counts use calendar days.

Reminders appear when the dashboard is opened; this version does not send email, push notifications, or execute unattended jobs. Calendar integrations, AI conversation, reservations, and purchasing are future work. Deleting an entry asks for confirmation and permanently removes it.

The tracked .openai/hosting.json retains the private Site identity. The repository can later be adapted for a user-managed Cloudflare account; no paid Workers subscription is needed for the current Sites deployment.
