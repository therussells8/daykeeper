import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(),
  owner: text('owner').notNull(),
  data: text('data').notNull(),
}, table => [index('entries_owner_idx').on(table.owner)]);
