import { Database } from '../db.js';
import { favorites, users } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class FavoriteStorage {
  constructor(private db: Database) {}

  async getFavorites(userId: string): Promise<(typeof favorites.$inferSelect & {
    user: typeof users.$inferSelect;
  })[]> {
    const userAlias = alias(users, 'user');

    const results = await this.db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        type: favorites.type,
        artistId: favorites.artistId,
        eventId: favorites.eventId,
        venueId: favorites.venueId,
        createdAt: favorites.createdAt,
        user: userAlias
      })
      .from(favorites)
      .leftJoin(userAlias, eq(favorites.userId, userAlias.id))
      .where(eq(favorites.userId, userId));

    return results.map((result: { id: number; userId: string; type: 'artist' | 'event' | 'venue'; artistId: number | null; eventId: number | null; venueId: number | null; createdAt: Date | null; user: typeof users.$inferSelect | null }) => ({
      ...result,
      user: result.user || {
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
      // Valores nulos por defecto si faltan
      artistId: result.artistId ?? null,
      eventId: result.eventId ?? null,
      venueId: result.venueId ?? null
    }));
  }

  async getUserFavorites(userId: string, targetType?: string): Promise<(typeof favorites.$inferSelect & {
    user: typeof users.$inferSelect;
  })[]> {
    const userAlias = alias(users, 'user');

    let conditions = [eq(favorites.userId, userId)];
    if (targetType) {
      conditions.push(eq(favorites.type, targetType as 'artist' | 'event' | 'venue'));
    }

    const results = await this.db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        type: favorites.type,
        artistId: favorites.artistId,
        eventId: favorites.eventId,
        venueId: favorites.venueId,
        createdAt: favorites.createdAt,
        user: userAlias
      })
      .from(favorites)
      .leftJoin(userAlias, eq(favorites.userId, userAlias.id))
      .where(and(...conditions));

    return results.map((result: { id: number; userId: string; type: 'artist' | 'event' | 'venue'; artistId: number | null; eventId: number | null; venueId: number | null; createdAt: Date | null; user: typeof users.$inferSelect | null }) => ({
      ...result,
      user: result.user || {
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
      artistId: result.artistId ?? null,
      eventId: result.eventId ?? null,
      venueId: result.venueId ?? null
    }));
  }

  async addFavorite(favorite: Omit<typeof favorites.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof favorites.$inferSelect> {
    const [result] = await this.db
      .insert(favorites)
      .values(favorite)
      .returning();
    return result;
  }

  async removeFavorite(userId: string, targetId: number, targetType: string): Promise<void> {
    let targetColumn;
    switch (targetType) {
      case 'artist':
        targetColumn = favorites.artistId;
        break;
      case 'event':
        targetColumn = favorites.eventId;
        break;
      case 'venue':
        targetColumn = favorites.venueId;
        break;
      default:
        throw new Error('Invalid target type');
    }

    await this.db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(targetColumn, targetId)
        )
      );
  }
}
