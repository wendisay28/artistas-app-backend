import { pgTable, serial, varchar, text, timestamp, integer, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  clientId: varchar('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  artistId: varchar('artist_id').references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category').notNull(),
  description: text('description').notNull(),
  budgetMin: numeric('budget_min', { precision: 12, scale: 2 }),
  budgetMax: numeric('budget_max', { precision: 12, scale: 2 }),
  modality: varchar('modality', { enum: ['presencial', 'online', 'ambas'] }).default('presencial'),
  eventDate: timestamp('event_date'),
  eventTime: varchar('event_time'),
  location: text('location'),
  status: varchar('status', {
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled']
  }).default('pending'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
