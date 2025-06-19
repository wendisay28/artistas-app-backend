import { Database } from '../db.js';
import { artists, users, categories } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class ArtistStorage {
  constructor(private db: Database) {}

  async getArtist(id: number): Promise<(typeof artists.$inferSelect & {
    user: typeof users.$inferSelect;
    category?: typeof categories.$inferSelect;
  }) | undefined> {
    const userAlias = alias(users, 'user');
    const categoryAlias = alias(categories, 'category');

    const [result] = await this.db
      .select({
        artist: artists,
        user: userAlias,
        category: categoryAlias
      })
      .from(artists)
      .leftJoin(userAlias, eq(artists.userId, userAlias.id))
      .leftJoin(categoryAlias, eq(artists.categoryId, categoryAlias.id))
      .where(eq(artists.id, id));

    if (!result) return undefined;

    return {
      ...result.artist,
      user: result.user ?? {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'artist' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      },
      category: result.category ?? undefined
    };
  }

  async getArtists(filters?: { categoryId?: number; userId?: string }): Promise<(typeof artists.$inferSelect & {
    user: typeof users.$inferSelect;
    category?: typeof categories.$inferSelect;
  })[]> {
    const userAlias = alias(users, 'user');
    const categoryAlias = alias(categories, 'category');

    const conditions = [];
    if (filters?.categoryId) {
      conditions.push(eq(artists.categoryId, filters.categoryId));
    }
    if (filters?.userId) {
      conditions.push(eq(artists.userId, filters.userId));
    }

    const results = await this.db
      .select({
        artist: artists,
        user: userAlias,
        category: categoryAlias
      })
      .from(artists)
      .leftJoin(userAlias, eq(artists.userId, userAlias.id))
      .leftJoin(categoryAlias, eq(artists.categoryId, categoryAlias.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return results.map(result => ({
      ...result.artist,
      user: result.user ?? {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'artist' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      },
      category: result.category ?? undefined
    }));
  }

  async createArtist(artist: Omit<typeof artists.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof artists.$inferSelect> {
    const [result] = await this.db.insert(artists).values(artist).returning();
    return result;
  }

  async updateArtist(id: number, artist: Partial<typeof artists.$inferInsert>): Promise<typeof artists.$inferSelect> {
    const [result] = await this.db
      .update(artists)
      .set(artist)
      .where(eq(artists.id, id))
      .returning();
    return result;
  }

  async deleteArtist(id: number): Promise<void> {
    await this.db.delete(artists).where(eq(artists.id, id));
  }
}
