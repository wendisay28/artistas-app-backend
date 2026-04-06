import { pgTable, serial, varchar, text, timestamp, integer, numeric, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { venues } from './companies.js';

export const hiringRequests = pgTable('hiring_requests', {
  id: serial('id').primaryKey(),
  clientId: varchar('client_id').notNull().references(() => users.id),
  artistId: varchar('artist_id').references(() => users.id),
  venueId: integer('venue_id').references(() => venues.id),
  details: text('details').notNull(),
  eventDate: date('event_date'),
  budget: numeric('budget', { precision: 10, scale: 2 }),
  status: varchar('status', { enum: ['pending', 'accepted', 'rejected', 'completed'] }).default('pending'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const hiringResponses = pgTable('hiring_responses', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => hiringRequests.id),
  artistId: varchar('artist_id').notNull().references(() => users.id),
  proposal: text('proposal').notNull(),
  message: text('message'),
  status: varchar('status', { enum: ['pending', 'accepted', 'rejected', 'completed'] }).default('pending'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
