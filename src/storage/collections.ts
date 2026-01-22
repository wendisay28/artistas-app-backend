import { db } from '../db.js';
import { collections, collectionItems, inspirations, posts, blogPosts, users } from '../schema.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

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
    // Primero obtener todos los collection items con sus tipos
    const items = await db
      .select({
        id: collectionItems.id,
        postId: collectionItems.postId,
        postType: collectionItems.postType,
        notes: collectionItems.notes,
        addedAt: collectionItems.addedAt,
      })
      .from(collectionItems)
      .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collections.userId, userId)
        )
      )
      .orderBy(desc(collectionItems.addedAt));

    if (items.length === 0) {
      return [];
    }

    // Separar los IDs por tipo
    const regularPostIds = items.filter(item => item.postType === 'post').map(item => item.postId);
    const blogPostIds = items.filter(item => item.postType === 'blog').map(item => item.postId);

    // Obtener los posts regulares
    let regularPosts: any[] = [];
    if (regularPostIds.length > 0) {
      regularPosts = await db
        .select({
          post: posts,
          author: users,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(inArray(posts.id, regularPostIds));
    }

    // Obtener los blog posts
    let blogPostsData: any[] = [];
    if (blogPostIds.length > 0) {
      blogPostsData = await db
        .select({
          post: blogPosts,
          author: users,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(inArray(blogPosts.id, blogPostIds));
    }

    // Combinar los resultados manteniendo el orden original
    const result = items.map(item => {
      let postData;

      if (item.postType === 'post') {
        const found = regularPosts.find(p => p.post.id === item.postId);
        if (found) {
          postData = {
            ...found.post,
            type: 'post',
            author: found.author,
            userId: found.post.userId,
          };
        }
      } else if (item.postType === 'blog') {
        const found = blogPostsData.find(p => p.post.id === item.postId);
        if (found) {
          postData = {
            ...found.post,
            type: 'blog',
            author: found.author,
            userId: found.post.authorId,
          };
        }
      }

      if (!postData) {
        return null;
      }

      return {
        id: item.id,
        postId: item.postId,
        postType: item.postType,
        notes: item.notes,
        addedAt: item.addedAt,
        post: postData,
      };
    }).filter(item => item !== null);

    return result;
  },

  /**
   * Agregar un post a una colección
   */
  async addPostToCollection(data: {
    collectionId: number;
    postId: number;
    userId: string;
    postType?: string; // 'post' or 'blog'
    notes?: string;
  }) {
    // Verificar que la colección pertenezca al usuario
    const collection = await this.getCollectionById(data.collectionId, data.userId);
    if (!collection) {
      throw new Error('Collection not found or does not belong to user');
    }

    try {
      // Insertar el item
      const result = await db
        .insert(collectionItems)
        .values({
          collectionId: data.collectionId,
          postId: data.postId,
          postType: data.postType || 'post',
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
    } catch (error: any) {
      // Check if it's a foreign key constraint error
      if (error.code === '23503' && error.constraint_name === 'collection_items_post_id_fkey') {
        throw new Error('POST_NOT_FOUND');
      }
      throw error;
    }
  },

  /**
   * Quitar un post de una colección
   */
  async removePostFromCollection(collectionId: number, postId: number, userId: string, postType: string = 'post') {
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
          eq(collectionItems.postId, postId),
          eq(collectionItems.postType, postType)
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
  async isPostInCollections(userId: string, postId: number, postType: string = 'post') {
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
          eq(collectionItems.postType, postType),
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
    // Primero obtener todas las inspiraciones con sus tipos
    const items = await db
      .select({
        id: inspirations.id,
        postId: inspirations.postId,
        postType: inspirations.postType,
        inspirationNote: inspirations.inspirationNote,
        tags: inspirations.tags,
        inspirationType: inspirations.inspirationType,
        createdAt: inspirations.createdAt,
        updatedAt: inspirations.updatedAt,
      })
      .from(inspirations)
      .where(eq(inspirations.userId, userId))
      .orderBy(desc(inspirations.createdAt));

    if (items.length === 0) {
      return [];
    }

    // Separar los IDs por tipo
    const regularPostIds = items.filter(item => item.postType === 'post').map(item => item.postId);
    const blogPostIds = items.filter(item => item.postType === 'blog').map(item => item.postId);

    // Obtener los posts regulares
    let regularPosts: any[] = [];
    if (regularPostIds.length > 0) {
      regularPosts = await db
        .select({
          post: posts,
          author: users,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(inArray(posts.id, regularPostIds));
    }

    // Obtener los blog posts
    let blogPostsData: any[] = [];
    if (blogPostIds.length > 0) {
      blogPostsData = await db
        .select({
          post: blogPosts,
          author: users,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(inArray(blogPosts.id, blogPostIds));
    }

    // Combinar los resultados manteniendo el orden original
    const result = items.map(item => {
      let postData;

      if (item.postType === 'post') {
        const found = regularPosts.find(p => p.post.id === item.postId);
        if (found) {
          postData = {
            ...found.post,
            type: 'post',
            author: found.author,
            userId: found.post.userId,
          };
        }
      } else if (item.postType === 'blog') {
        const found = blogPostsData.find(p => p.post.id === item.postId);
        if (found) {
          postData = {
            ...found.post,
            type: 'blog',
            author: found.author,
            userId: found.post.authorId,
          };
        }
      }

      if (!postData) {
        return null;
      }

      return {
        id: item.id,
        postId: item.postId,
        postType: item.postType,
        inspirationNote: item.inspirationNote,
        tags: item.tags,
        inspirationType: item.inspirationType,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        post: postData,
      };
    }).filter(item => item !== null);

    return result;
  },

  /**
   * Agregar un post como inspiración
   */
  async addInspiration(data: {
    userId: string;
    postId: number;
    postType?: string; // 'post' or 'blog'
    inspirationNote?: string;
    tags?: string[];
    inspirationType?: string;
  }) {
    const result = await db
      .insert(inspirations)
      .values({
        userId: data.userId,
        postId: data.postId,
        postType: data.postType || 'post',
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
  async removeInspiration(userId: string, postId: number, postType: string = 'post') {
    await db
      .delete(inspirations)
      .where(
        and(
          eq(inspirations.userId, userId),
          eq(inspirations.postId, postId),
          eq(inspirations.postType, postType)
        )
      );
  },

  /**
   * Verificar si un post está marcado como inspiración
   */
  async isPostInspiration(userId: string, postId: number, postType: string = 'post') {
    const result = await db
      .select()
      .from(inspirations)
      .where(
        and(
          eq(inspirations.userId, userId),
          eq(inspirations.postId, postId),
          eq(inspirations.postType, postType)
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
