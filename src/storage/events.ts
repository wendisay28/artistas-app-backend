import { Database } from '../db.js';
import { events, users, categories } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class EventStorage {
  constructor(private db: Database) {}

  async getEvent(id: number): Promise<(typeof events.$inferSelect & { 
    organizer: typeof users.$inferSelect;
    category?: typeof categories.$inferSelect 
  }) | undefined> {
    const organizerAlias = alias(users, 'organizer');
    const categoryAlias = alias(categories, 'category');

    const query = this.db
      .select({
        event: events,
        organizer: organizerAlias,
        category: categoryAlias
      })
      .from(events)
      .leftJoin(organizerAlias, eq(events.organizerId, organizerAlias.id))
      .leftJoin(categoryAlias, eq(events.categoryId, categoryAlias.id))
      .where(eq(events.id, id));

    const [result] = await query;

    if (!result) return undefined;

    return {
      ...result.event,
      organizer: result.organizer || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      category: result.category || undefined
    };
  }

  async getEvents(filters: { 
    categoryId?: number; 
    organizerId?: string; 
  }): Promise<(typeof events.$inferSelect & {
    organizer: typeof users.$inferSelect;
    category?: typeof categories.$inferSelect
  })[]> {
    const organizerAlias = alias(users, 'organizer');
    const categoryAlias = alias(categories, 'category');

    const baseQuery = this.db
      .select({
        event: events,
        organizer: organizerAlias,
        category: categoryAlias
      })
      .from(events)
      .leftJoin(organizerAlias, eq(events.organizerId, organizerAlias.id))
      .leftJoin(categoryAlias, eq(events.categoryId, categoryAlias.id));

    const conditions = [];
    if (filters.categoryId) {
      conditions.push(eq(events.categoryId, filters.categoryId));
    }
    if (filters.organizerId) {
      conditions.push(eq(events.organizerId, filters.organizerId));
    }

    const query = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const results = await query;

    return results.map((result: { event: typeof events.$inferSelect; organizer: typeof users.$inferSelect | null; category: typeof categories.$inferSelect | null }) => ({
      ...result.event,
      organizer: result.organizer || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      category: result.category || undefined
    }));
  }

  async createEvent(event: Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof events.$inferSelect> {
    const [result] = await this.db
      .insert(events)
      .values({
        ...event,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return result;
  }

  async updateEvent(id: number, event: Partial<typeof events.$inferInsert>): Promise<typeof events.$inferSelect> {
    const [result] = await this.db
      .update(events)
      .set({
        ...event,
        updatedAt: new Date()
      })
      .where(eq(events.id, id))
      .returning();
    return result;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.db
      .delete(events)
      .where(eq(events.id, id));
  }
}
