import { Database } from '../db.js';
import { eq, and } from 'drizzle-orm';
import { reviews, users } from '../schema.js';

export class ReviewStorage {
  constructor(private db: Database) {}

  async getReviews(targetType: 'artist' | 'event' | 'venue', targetId: number) {
    const results = await this.db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        type: reviews.type,
        score: reviews.score,
        reason: reviews.reason,
        artistId: reviews.artistId,
        eventId: reviews.eventId,
        venueId: reviews.venueId,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt
      })
      .from(reviews)
      .where(
        targetType === 'artist'
          ? eq(reviews.artistId, targetId)
          : targetType === 'event'
          ? eq(reviews.eventId, targetId)
          : eq(reviews.venueId, targetId)
      );

    return results;
  }

  async canUserReview(userId: string, targetType: 'artist' | 'event' | 'venue', targetId: number) {
    const existingReview = await this.db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.userId, userId),
        targetType === 'artist'
          ? eq(reviews.artistId, targetId)
          : targetType === 'event'
          ? eq(reviews.eventId, targetId)
          : eq(reviews.venueId, targetId)
      ));

    return existingReview.length === 0;
  }

  async createReview(review: {
    userId: string;
    type: 'artist' | 'event' | 'venue';
    score: string;
    reason: string | null;
    artistId?: number;
    eventId?: number;
    venueId?: number;
  }) {
    const [result] = await this.db
      .insert(reviews)
      .values({
        userId: review.userId,
        type: review.type,
        score: review.score,
        reason: review.reason,
        artistId: review.artistId || null,
        eventId: review.eventId || null,
        venueId: review.venueId || null,
        createdAt: new Date()
      })
      .returning();

    return result;
  }
}
