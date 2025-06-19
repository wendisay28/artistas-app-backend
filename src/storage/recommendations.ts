import { Database } from '../db.js';
import { recommendations, users } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class RecommendationStorage {
  constructor(private db: Database) {}

  async getRecommendations(filters: { categoryId?: number; city?: string; isActive?: boolean; search?: string }): Promise<(typeof recommendations.$inferSelect & {
    user: typeof users.$inferSelect;
  })[]> {
    const userAlias = alias(users, 'user');

    const conditions = [];
    if (filters.categoryId) {
      conditions.push(eq(recommendations.artistId, filters.categoryId));
    }
    if (filters.city) {
      // La tabla recommendations no tiene campo city, así que lo ignoramos
    }
    if (filters.isActive !== undefined) {
      // La tabla recommendations no tiene campo isActive, así que lo ignoramos
    }

    const query = this.db
      .select({
        id: recommendations.id,
        userId: recommendations.userId,
        type: recommendations.type,
        artistId: recommendations.artistId,
        eventId: recommendations.eventId,
        venueId: recommendations.venueId,
        score: recommendations.score,
        reason: recommendations.reason,
        createdAt: recommendations.createdAt,
        user: {
          id: userAlias.id,
          email: userAlias.email,
          firstName: userAlias.firstName,
          lastName: userAlias.lastName,
          profileImageUrl: userAlias.profileImageUrl,
          userType: userAlias.userType,
          bio: userAlias.bio,
          city: userAlias.city,
          isVerified: userAlias.isVerified,
          createdAt: userAlias.createdAt,
          updatedAt: userAlias.updatedAt
        }
      })
      .from(recommendations)
      .leftJoin(userAlias, eq(recommendations.userId, userAlias.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const results = await query;

    return results.map((result: { id: number; userId: string; type: 'artist' | 'event' | 'venue'; artistId: number | null; eventId: number | null; venueId: number | null; score: string; reason: string | null; createdAt: Date | null; user: typeof users.$inferSelect | null }) => ({
      ...result,
      user: result.user || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general',
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      }
    }));
  }

  async createRecommendation(recommendation: Omit<typeof recommendations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof recommendations.$inferSelect> {
    const [result] = await this.db.insert(recommendations).values(recommendation).returning();
    return result;
  }
}
