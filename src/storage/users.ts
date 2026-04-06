import type { Database } from '../types/db.js';
import { users } from '../schema.js';
import { eq, or, ilike, sql } from 'drizzle-orm';

export class UserStorage {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user;
  }

  async getUsers(filters: {
    userType?: 'general' | 'artist' | 'company'
  }): Promise<typeof users.$inferSelect[]> {
    const query = this.db.select().from(users);
    
    if (filters.userType) {
      return await query.where(eq(users.userType, filters.userType));
    }
    
    return await query;
  }

  // Note: upsertUser está implementado en DatabaseStorage (src/storage/index.ts)
  // Este módulo solo proporciona getUser, getUsers y searchUsers

  async searchUsers(query: string, limit: number = 5): Promise<typeof users.$inferSelect[]> {
    // Buscar por nombre, apellido, username o displayName
    const results = await this.db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.username, `%${query}%`),
          ilike(users.displayName, `%${query}%`),
          sql`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${'%' + query + '%'}`
        )
      )
      .limit(limit);

    return results;
  }
}
