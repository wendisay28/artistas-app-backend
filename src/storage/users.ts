import { Database } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

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

  async upsertUser(user: { id: string } & Partial<{ email: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; userType: 'general' | 'artist' | 'company'; bio: string | null; city: string | null; isVerified: boolean }>): Promise<typeof users.$inferSelect> {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    if (existingUser) {
      const [updatedUser] = await this.db
        .update(users)
        .set({
          ...user,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();
      return updatedUser;
    }

    const [newUser] = await this.db
      .insert(users)
      .values({
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: user.profileImageUrl || null,
        userType: user.userType || 'general',
        bio: user.bio || null,
        city: user.city || null,
        isVerified: user.isVerified || false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newUser;
  }
}
