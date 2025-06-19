import { Database } from '../db.js';
import { messages, users } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class MessageStorage {
  constructor(private db: Database) {}

  async getMessage(id: number): Promise<(typeof messages.$inferSelect & {
    sender: typeof users.$inferSelect;
    receiver: typeof users.$inferSelect;
  }) | undefined> {
    const senderAlias = alias(users, 'sender');
    const receiverAlias = alias(users, 'receiver');
    
    const [result] = await this.db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: senderAlias,
        receiver: receiverAlias
      })
      .from(messages)
      .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
      .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id))
      .where(eq(messages.id, id));

    if (!result) return undefined;

    return {
      ...result,
      sender: result.sender || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      },
      receiver: result.receiver || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      }
    };
  }

  async getMessages(filters: {
    senderId?: string;
    receiverId?: string;
  }): Promise<(typeof messages.$inferSelect & {
    sender: typeof users.$inferSelect;
    receiver: typeof users.$inferSelect;
  })[]> {
    const senderAlias = alias(users, 'sender');
    const receiverAlias = alias(users, 'receiver');
    
    let query = this.db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: senderAlias,
        receiver: receiverAlias
      })
      .from(messages)
      .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
      .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id));

    const conditions = [];
    if (filters.senderId) {
      conditions.push(eq(messages.senderId, filters.senderId));
    }
    if (filters.receiverId) {
      conditions.push(eq(messages.receiverId, filters.receiverId));
    }
    
    const finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;

    const results = await finalQuery;

    return results.map((result: { id: number; content: string; senderId: string; receiverId: string; isRead: boolean | null; createdAt: Date | null; sender: typeof users.$inferSelect | null; receiver: typeof users.$inferSelect | null }) => ({
      ...result,
      sender: result.sender || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      },
      receiver: result.receiver || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      }
    }));
  }

  async getUserMessages(userId: string): Promise<(typeof messages.$inferSelect & {
    sender: typeof users.$inferSelect;
    receiver: typeof users.$inferSelect;
  })[]> {
    return this.getMessages({
      senderId: userId,
      receiverId: userId
    });
  }

  async getConversation(userId1: string, userId2: string): Promise<(typeof messages.$inferSelect & {
    sender: typeof users.$inferSelect;
    receiver: typeof users.$inferSelect;
  })[]> {
    const senderAlias = alias(users, 'sender');
    const receiverAlias = alias(users, 'receiver');
    
    const results = await this.db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: senderAlias,
        receiver: receiverAlias
      })
      .from(messages)
      .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
      .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id))
      .where(
        and(
          eq(messages.senderId, userId1),
          eq(messages.receiverId, userId2)
        )
      );

    return results.map((result: { id: number; content: string; senderId: string; receiverId: string; isRead: boolean | null; createdAt: Date | null; sender: typeof users.$inferSelect | null; receiver: typeof users.$inferSelect | null }) => ({
      ...result,
      sender: result.sender || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      },
      receiver: result.receiver || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      }
    }));
  }

  async sendMessage(message: Omit<typeof messages.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof messages.$inferSelect> {
    const [result] = await this.db
      .insert(messages)
      .values({
        ...message,
        isRead: false
      })
      .returning();
    return result;
  }
}
