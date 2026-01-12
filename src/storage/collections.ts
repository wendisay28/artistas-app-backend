import { db } from '../db.js';
import { collections, collectionItems, inspirations, posts } from '../schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export const collectionsStorage = {
  // ============================================================================
  // Collections - Pinterest-style collections
  // ============================================================================

  /**
   * Obtener todas las colecciones de un usuario
   */
  async getUserCollections(userId: string) {
    return await db
      .select()
      .from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.updatedAt));
  },

  /**
   * Obtener una colección por ID
   */
  async getCollectionById(id: number, userId: string) {
    const collection = await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.id, id),
          eq(collections.userId, userId)
        )
      )
      .limit(1);

    return collection[0] || null;
  },

  /**
   * Crear una nueva colección
   */
  async createCollection(data: {
    userId: string;
    name: string;
    description?: string;
    isPublic?: boolean;
    coverImageUrl?: string;
  }) {
    const result = await db
      .insert(collections)
      .values({
        userId: data.userId,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic ?? false,
        coverImageUrl: data.coverImageUrl,
        itemCount: 0,
        viewCount: 0,
      })
      .returning();

    return result[0];
  },

  /**
   * Actualizar una colección
   */
  async updateCollection(
    id: number,
    userId: string,
    data: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      coverImageUrl?: string;
    }
  ) {
    const result = await db
      .update(collections)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(collections.id, id),
          eq(collections.userId, userId)
        )
      )
      .returning();

    return result[0] || null;
  },

  /**
   * Eliminar una colección
   */
  async deleteCollection(id: number, userId: string) {
    await db
      .delete(collections)
      .where(
        and(
          eq(collections.id, id),
          eq(collections.userId, userId)
        )
      );
  },

  /**
   * Obtener posts de una colección
   */
  async getCollectionPosts(collectionId: number, userId: string) {
    const items = await db
      .select({
        id: collectionItems.id,
        postId: collectionItems.postId,
        notes: collectionItems.notes,
        addedAt: collectionItems.addedAt,
        post: posts,
      })
      .from(collectionItems)
      .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
      .innerJoin(posts, eq(collectionItems.postId, posts.id))
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collections.userId, userId)
        )
      )
      .orderBy(desc(collectionItems.addedAt));

    return items;
  },

  /**
   * Agregar un post a una colección
   */
  async addPostToCollection(data: {
    collectionId: number;
    postId: number;
    userId: string;
    notes?: string;
  }) {
    // Verificar que la colección pertenezca al usuario
    const collection = await this.getCollectionById(data.collectionId, data.userId);
    if (!collection) {
      throw new Error('Collection not found or does not belong to user');
    }

    // Insertar el item
    const result = await db
      .insert(collectionItems)
      .values({
        collectionId: data.collectionId,
        postId: data.postId,
        notes: data.notes,
      })
      .onConflictDoNothing()
      .returning();

    // Actualizar contador
    if (result.length > 0) {
      await db
        .update(collections)
        .set({
          itemCount: sql`${collections.itemCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(collections.id, data.collectionId));
    }

    return result[0] || null;
  },

  /**
   * Quitar un post de una colección
   */
  async removePostFromCollection(collectionId: number, postId: number, userId: string) {
    // Verificar que la colección pertenezca al usuario
    const collection = await this.getCollectionById(collectionId, userId);
    if (!collection) {
      throw new Error('Collection not found or does not belong to user');
    }

    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.postId, postId)
        )
      );

    // Actualizar contador
    await db
      .update(collections)
      .set({
        itemCount: sql`GREATEST(0, ${collections.itemCount} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, collectionId));
  },

  /**
   * Verificar si un post está en alguna colección del usuario
   */
  async isPostInCollections(userId: string, postId: number) {
    const userCollections = await this.getUserCollections(userId);
    const collectionIds = userCollections.map(c => c.id);

    if (collectionIds.length === 0) return [];

    const items = await db
      .select({
        collectionId: collectionItems.collectionId,
        collectionName: collections.name,
      })
      .from(collectionItems)
      .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
      .where(
        and(
          eq(collectionItems.postId, postId),
          eq(collections.userId, userId)
        )
      );

    return items;
  },

  // ============================================================================
  // Inspirations - Artist inspiration system
  // ============================================================================

  /**
   * Obtener inspiraciones de un usuario
   */
  async getUserInspirations(userId: string, filters?: {
    inspirationType?: string;
    tags?: string[];
  }) {
    let query = db
      .select({
        id: inspirations.id,
        postId: inspirations.postId,
        inspirationNote: inspirations.inspirationNote,
        tags: inspirations.tags,
        inspirationType: inspirations.inspirationType,
        createdAt: inspirations.createdAt,
        post: posts,
      })
      .from(inspirations)
      .innerJoin(posts, eq(inspirations.postId, posts.id))
      .where(eq(inspirations.userId, userId))
      .orderBy(desc(inspirations.createdAt));

    return await query;
  },

  /**
   * Agregar un post como inspiración
   */
  async addInspiration(data: {
    userId: string;
    postId: number;
    inspirationNote?: string;
    tags?: string[];
    inspirationType?: string;
  }) {
    const result = await db
      .insert(inspirations)
      .values({
        userId: data.userId,
        postId: data.postId,
        inspirationNote: data.inspirationNote || null,
        tags: data.tags || [],
        inspirationType: data.inspirationType || null,
      })
      .onConflictDoNothing()
      .returning();

    return result[0] || null;
  },

  /**
   * Actualizar una inspiración
   */
  async updateInspiration(
    id: number,
    userId: string,
    data: {
      inspirationNote?: string;
      tags?: string[];
      inspirationType?: string;
    }
  ) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.inspirationNote !== undefined) {
      updateData.inspirationNote = data.inspirationNote || null;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }
    if (data.inspirationType !== undefined) {
      updateData.inspirationType = data.inspirationType || null;
    }

    const result = await db
      .update(inspirations)
      .set(updateData)
      .where(
        and(
          eq(inspirations.id, id),
          eq(inspirations.userId, userId)
        )
      )
      .returning();

    return result[0] || null;
  },

  /**
   * Quitar una inspiración
   */
  async removeInspiration(userId: string, postId: number) {
    await db
      .delete(inspirations)
      .where(
        and(
          eq(inspirations.userId, userId),
          eq(inspirations.postId, postId)
        )
      );
  },

  /**
   * Verificar si un post está marcado como inspiración
   */
  async isPostInspiration(userId: string, postId: number) {
    const result = await db
      .select()
      .from(inspirations)
      .where(
        and(
          eq(inspirations.userId, userId),
          eq(inspirations.postId, postId)
        )
      )
      .limit(1);

    return result[0] || null;
  },

  /**
   * Obtener estadísticas de inspiración para un post
   */
  async getPostInspirationCount(postId: number) {
    const result = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(inspirations)
      .where(eq(inspirations.postId, postId));

    return result[0]?.count || 0;
  },
};
