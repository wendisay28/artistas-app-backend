import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { blogPosts } from './blog.js';
import { events } from './events.js';
import { venues } from './companies.js';

export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').references(() => blogPosts.id, { onDelete: 'cascade' }),
  artistId: varchar('artist_id').references(() => users.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }),
  venueId: integer('venue_id').references(() => venues.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(),
  content: text('content').notNull(),
  type: varchar('type', { enum: ['artist', 'event', 'venue', 'post'] }).notNull(),
  score: numeric('score', { precision: 3, scale: 2 }).default(sql`0`),
  isApproved: boolean('is_approved').default(true),
  likeCount: integer('like_count').default(sql`0`),
  replyCount: integer('reply_count').default(sql`0`),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
