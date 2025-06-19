import { Database } from '../db.js';
import { venues, users } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class VenueStorage {
  constructor(private db: Database) {}

  async getVenue(id: number): Promise<(typeof venues.$inferSelect & {
    owner: typeof users.$inferSelect
  }) | undefined> {
    const ownerAlias = alias(users, 'owner');
    
    const results = await this.db
      .select()
      .from(venues)
      .leftJoin(ownerAlias, eq(venues.ownerId, ownerAlias.id))
      .where(eq(venues.id, id));

    const result = results[0];
    if (!result) return undefined;

    return {
      ...result.venues,
      owner: result.owner || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general',
        bio: null,
        city: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  async getVenues(filters: { ownerId?: string }): Promise<(typeof venues.$inferSelect & {
    owner: typeof users.$inferSelect
  })[]> {
    const ownerAlias = alias(users, 'owner');
    
    let conditions = [];
    if (filters.ownerId) {
      conditions.push(eq(venues.ownerId, filters.ownerId));
    }

    const results = await this.db
      .select()
      .from(venues)
      .leftJoin(ownerAlias, eq(venues.ownerId, ownerAlias.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return results.map((result: { venues: typeof venues.$inferSelect; owner: typeof users.$inferSelect | null }) => ({
      ...result.venues,
      owner: result.owner || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general',
        bio: null,
        city: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }));
  }

  async createVenue(data: typeof venues.$inferInsert): Promise<typeof venues.$inferSelect> {
    const [result] = await this.db.insert(venues).values(data).returning();
    return result;
  }

  async updateVenue(id: number, data: Partial<typeof venues.$inferInsert>): Promise<typeof venues.$inferSelect> {
    const [result] = await this.db
      .update(venues)
      .set(data)
      .where(eq(venues.id, id))
      .returning();
    return result;
  }

  async deleteVenue(id: number): Promise<void> {
    await this.db.delete(venues).where(eq(venues.id, id));
  }
}