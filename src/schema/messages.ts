import { pgTable, serial, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  receiverId: text('receiver_id').notNull(),
  content: text('content').notNull(),
  messageType: text('message_type').default('text'),
  sharedPostId: integer('shared_post_id'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type NewMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;
