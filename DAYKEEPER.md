# Daykeeper behavior

See README.md and CLOUDFLARE.md for development and deployment instructions.

Tasks support dates, priorities, notes, completion, reopening, editing, search, and deletion. Today includes overdue and undated open tasks; My tasks includes future and completed tasks.

Birthdays and events support annual recurrence and advance dashboard reminders. Annual February 29 events are observed on February 28 in non-leap years. The calendar supports month navigation.

Dates use the browser's local calendar. Reminder counts use calendar days rather than elapsed hours across daylight saving changes. No notification service or scheduled agent is running yet.

Records are scoped to the user ID from a verified Cloudflare Access JWT. Cloudflare Access must allow only the intended email address. In production, missing or invalid configuration blocks access to the whole app. A developer identity is available only in a loopback development build with DAYKEEPER_DEV_AUTH=1.

Deletion asks for confirmation and permanently removes the entry. Backups, undo, recurring tasks, integrations, and AI actions are later work.
