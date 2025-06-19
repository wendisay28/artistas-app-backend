import { Database } from '../db.js';
import { eq } from 'drizzle-orm';
import { hiringRequests, hiringResponses } from '../schema.js';

type HiringRequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export class HiringStorage {
  constructor(private db: Database) {}

  async getActiveHiringRequests() {
    const results = await this.db
      .select()
      .from(hiringRequests)
      .where(eq(hiringRequests.status, 'open'));

    return results;
  }

  async getHiringRequest(id: number) {
    const [result] = await this.db
      .select()
      .from(hiringRequests)
      .where(eq(hiringRequests.id, id));

    if (!result) return undefined;

    const responses = await this.db
      .select()
      .from(hiringResponses)
      .where(eq(hiringResponses.requestId, id));

    return {
      ...result,
      responses
    };
  }

  async createHiringRequest(request: {
    clientId: string;
    artistId?: number;
    venueId?: number;
    eventDate: Date;
    details: string;
  }) {
    const [result] = await this.db
      .insert(hiringRequests)
      .values({
        clientId: request.clientId,
        artistId: request.artistId,
        venueId: request.venueId,
        eventDate: request.eventDate.toLocaleDateString('en-CA'),
        details: request.details,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return result;
  }

  async createHiringResponse(response: {
    requestId: number;
    artistId: number;
    proposal: string;
    accepted: boolean;
    message?: string;
  }) {
    const status: HiringRequestStatus = response.accepted ? 'in_progress' : 'cancelled';

    const [result] = await this.db
      .insert(hiringResponses)
      .values({
        requestId: response.requestId,
        artistId: response.artistId,
        proposal: response.proposal,
        message: response.message,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    await this.db
      .update(hiringRequests)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(hiringRequests.id, response.requestId));

    return result;
  }
}
