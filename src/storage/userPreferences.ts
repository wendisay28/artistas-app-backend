import { db } from '../db.js';
import { userPreferences } from '../schema.js';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type UserPreferences = typeof userPreferences.$inferSelect;
type NewUserPreferences = typeof userPreferences.$inferInsert;

export class UserPreferencesStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  /**
   * Obtener preferencias de un usuario
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [preferences] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    return preferences || null;
  }

  /**
   * Crear preferencias iniciales para un usuario
   */
  async createPreferences(userId: string): Promise<UserPreferences> {
    const [preferences] = await this.db
      .insert(userPreferences)
      .values({
        userId,
        favoriteCategories: [],
        interests: [],
        priceRange: null,
        preferredLocations: [],
        notificationPreferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!preferences) {
      throw new Error('Failed to create preferences');
    }

    return preferences;
  }

  /**
   * Obtener o crear preferencias
   */
  async getOrCreatePreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      preferences = await this.createPreferences(userId);
    }

    return preferences;
  }

  /**
   * Actualizar categorías favoritas
   */
  async updateFavoriteCategories(
    userId: string,
    categories: string[]
  ): Promise<UserPreferences> {
    const [updated] = await this.db
      .update(userPreferences)
      .set({
        favoriteCategories: categories,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update favorite categories');
    }

    return updated;
  }

  /**
   * Actualizar intereses
   */
  async updateInterests(
    userId: string,
    interests: string[]
  ): Promise<UserPreferences> {
    const [updated] = await this.db
      .update(userPreferences)
      .set({
        interests,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update interests');
    }

    return updated;
  }

  /**
   * Actualizar rango de precios
   */
  async updatePriceRange(
    userId: string,
    priceRange: { min: number; max: number }
  ): Promise<UserPreferences> {
    const [updated] = await this.db
      .update(userPreferences)
      .set({
        priceRange,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update price range');
    }

    return updated;
  }

  /**
   * Actualizar ubicaciones preferidas
   */
  async updatePreferredLocations(
    userId: string,
    locations: string[]
  ): Promise<UserPreferences> {
    const [updated] = await this.db
      .update(userPreferences)
      .set({
        preferredLocations: locations,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update preferred locations');
    }

    return updated;
  }

  /**
   * Actualizar preferencias de notificaciones
   */
  async updateNotificationPreferences(
    userId: string,
    notificationPreferences: Record<string, any>
  ): Promise<UserPreferences> {
    const [updated] = await this.db
      .update(userPreferences)
      .set({
        notificationPreferences,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update notification preferences');
    }

    return updated;
  }

  /**
   * Actualizar todas las preferencias
   */
  async updatePreferences(
    userId: string,
    data: Partial<{
      favoriteCategories: string[];
      interests: string[];
      priceRange: { min: number; max: number };
      preferredLocations: string[];
      notificationPreferences: Record<string, any>;
    }>
  ): Promise<UserPreferences> {
    const [updated] = await this.db
      .update(userPreferences)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update preferences');
    }

    return updated;
  }

  /**
   * Agregar categoría a favoritas
   */
  async addFavoriteCategory(userId: string, category: string): Promise<UserPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    const categories = preferences.favoriteCategories || [];
    
    if (!categories.includes(category)) {
      categories.push(category);
      return await this.updateFavoriteCategories(userId, categories);
    }

    return preferences;
  }

  /**
   * Remover categoría de favoritas
   */
  async removeFavoriteCategory(userId: string, category: string): Promise<UserPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    const categories = (preferences.favoriteCategories || []).filter(c => c !== category);
    
    return await this.updateFavoriteCategories(userId, categories);
  }
}

export const userPreferencesStorage = new UserPreferencesStorage(db);
