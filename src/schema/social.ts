import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { events } from './events.js';
import { venues } from './companies.js';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  artistId: integer('artist_id'), // FK to artists.id removed (artists table merged into users)
  eventId: integer('event_id').references(() => events.id),
  venueId: integer('venue_id').references(() => venues.id),
  type: varchar('type', { enum: ['artist', 'event', 'venue'] }).notNull(),
  score: numeric('score').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de actividades del usuario (para feed de actividad)
export const userActivities = pgTable('user_activities', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: varchar('actor_id').references(() => users.id, { onDelete: 'cascade' }), // Quien hizo la acción
  type: varchar('type', {
    enum: [
      'profile_view',
      'follow',
      'unfollow',
      'comment',
      'like',
      'review',
      'contract',
      'recommendation',
      'profile_update',
      'portfolio_update',
      'achievement'
    ]
  }).notNull(),
  entityType: varchar('entity_type'), // 'user', 'post', 'portfolio', 'event', etc.
  entityId: varchar('entity_id'),     // ID de la entidad relacionada
  metadata: jsonb('metadata').default({}), // Datos adicionales de la actividad
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de notificaciones
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', {
    enum: [
      'follow',
      'comment',
      'like',
      'review',
      'contract',
      'message',
      'system'
    ]
  }).notNull(),
  title: varchar('title').notNull(),
  message: text('message').notNull(),
  link: varchar('link'), // URL a donde redirigir
  isRead: boolean('is_read').default(false),
  priority: varchar('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  readAt: timestamp('read_at'),
});

// Tabla de seguidores (follows)
export const follows = pgTable('follows', {
  id: serial('id').primaryKey(),
  followerId: varchar('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: varchar('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});
