import { categories } from '../schema.js';
import { Database } from '../db.js';

export class CategoryStorage {
  constructor(private db: Database) {}

  async getCategories(): Promise<typeof categories.$inferSelect[]> {
    return await this.db.select().from(categories);
  }

  async createCategory(category: Omit<typeof categories.$inferInsert, 'id'>): Promise<typeof categories.$inferSelect> {
    const [result] = await this.db.insert(categories).values(category).returning();
    return result;
  }
}
