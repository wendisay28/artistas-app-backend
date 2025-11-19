import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { posts, postMedia, type NewPost, type NewPostMedia, type Post } from '../models/post.model.js';
import { users } from '../schema.js';

export class PostService {
  /**
   * Crea un nuevo post
   */
  static async createPost(postData: Omit<NewPost, 'createdAt' | 'updatedAt'>, mediaFiles?: Array<Omit<NewPostMedia, 'id' | 'postId' | 'createdAt'>>) {
    const newPostId = await db.transaction(async (tx: any) => {
      // Insertar el post
      const [newPost] = await tx.insert(posts)
        .values({
          ...postData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Si hay archivos multimedia, insertarlos
      if (mediaFiles && mediaFiles.length > 0) {
        const postMediaData = mediaFiles.map(media => ({
          ...media,
          postId: newPost.id,
          createdAt: new Date(),
        }));

        await tx.insert(postMedia).values(postMediaData);
      }

      return newPost.id;
    });

    // Obtener el post completo con sus relaciones fuera de la transacción
    return await this.getPostById(newPostId);
  }

  /**
   * Obtiene un post por su ID con sus relaciones
   */
  static async getPostById(id: number) {
    console.log('🔍 Getting post by ID:', id);

    const result = await db
      .select({
        ...getPostFields(),
        authorId: users.id,
        authorName: sql<string>`${users.firstName} || ' ' || COALESCE(${users.lastName}, '')`,
        authorAvatar: users.profileImageUrl,
        media: sql<Array<{ id: number; url: string; type: string; thumbnailUrl: string | null }>>`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pm.id,
                  'url', pm.url,
                  'type', pm.type,
                  'thumbnailUrl', pm.thumbnail_url
                ) ORDER BY pm."order" ASC, pm.id ASC
              )
              FROM post_media pm
              WHERE pm.post_id = posts.id
            ),
            '[]'::json
          )
        `,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));

    console.log('📦 Query result:', { count: result.length, firstPost: result[0] });

    if (result.length === 0) {
      return null;
    }

    // Transformar el resultado para incluir el objeto author
    const rawPost = result[0];
    const post = {
      ...rawPost,
      author: {
        id: rawPost.authorId,
        name: rawPost.authorName,
        avatar: rawPost.authorAvatar,
      }
    };

    // Eliminar los campos temporales
    delete (post as any).authorId;
    delete (post as any).authorName;
    delete (post as any).authorAvatar;

    console.log('✅ Transformed post:', post);
    return post;
  }

  /**
   * Obtiene todos los posts con paginación y filtrado opcional
   */
  static async getAllPosts(limit = 10, offset = 0, type?: 'post' | 'nota' | 'blog') {
    const query = db
      .select({
        ...getPostFields(),
        authorId: users.id,
        authorName: sql<string>`${users.firstName} || ' ' || COALESCE(${users.lastName}, '')`,
        authorAvatar: users.profileImageUrl,
        media: sql<Array<{ id: number; url: string; type: string; thumbnailUrl: string | null }>>`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pm.id,
                  'url', pm.url,
                  'type', pm.type,
                  'thumbnailUrl', pm.thumbnail_url
                ) ORDER BY pm."order" ASC, pm.id ASC
              )
              FROM post_media pm
              WHERE pm.post_id = posts.id
            ),
            '[]'::json
          )
        `,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Aplicar filtro de tipo si se especifica
    if (type) {
      query.where(eq(posts.type, type));
    }

    // Obtener el total de posts (para paginación)
    const totalQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts);

    if (type) {
      totalQuery.where(eq(posts.type, type));
    }

    const [rawPostsResult, totalResult] = await Promise.all([
      query,
      totalQuery
    ]);

    const total = totalResult[0]?.count || 0;

    // Transformar los resultados para incluir el objeto author
    const postsResult = rawPostsResult.map(rawPost => {
      const { authorId, authorName, authorAvatar, ...rest } = rawPost as any;
      return {
        ...rest,
        author: {
          id: authorId,
          name: authorName,
          avatar: authorAvatar,
        }
      };
    });

    return {
      posts: postsResult,
      total,
      limit,
      offset
    };
  }

  /**
   * Obtiene los posts de un usuario específico
   */
  static async getPostsByUser(userId: string, limit = 10, offset = 0) {
    const rawResult = await db
      .select({
        ...getPostFields(),
        authorId: users.id,
        authorName: sql<string>`${users.firstName} || ' ' || COALESCE(${users.lastName}, '')`,
        authorAvatar: users.profileImageUrl,
        media: sql<Array<{ id: number; url: string; type: string; thumbnailUrl: string | null }>>`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pm.id,
                  'url', pm.url,
                  'type', pm.type,
                  'thumbnailUrl', pm.thumbnail_url
                ) ORDER BY pm."order" ASC, pm.id ASC
              )
              FROM post_media pm
              WHERE pm.post_id = posts.id
            ),
            '[]'::json
          )
        `,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Transformar los resultados para incluir el objeto author
    return rawResult.map(rawPost => {
      const { authorId, authorName, authorAvatar, ...rest } = rawPost as any;
      return {
        ...rest,
        author: {
          id: authorId,
          name: authorName,
          avatar: authorAvatar,
        }
      };
    });
  }

  /**
   * Actualiza un post existente
   */
  static async updatePost(id: number, userId: string, updateData: Partial<Omit<Post, 'id' | 'authorId' | 'createdAt'>>) {
    const [updatedPost] = await db
      .update(posts)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(posts.id, id), eq(posts.authorId, userId)))
      .returning();

    return updatedPost || null;
  }

  /**
   * Elimina un post
   */
  static async deletePost(id: number, userId: string) {
    const [deletedPost] = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.authorId, userId)))
      .returning({ id: posts.id });

    return deletedPost || null;
  }

  /**
   * Agrega archivos multimedia a un post existente
   */
  static async addMediaToPost(postId: number, userId: string, mediaFiles: Array<Omit<NewPostMedia, 'id' | 'postId' | 'createdAt'>>) {
    // Verificar que el post existe y pertenece al usuario
    const post = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
      .limit(1);

    if (!post.length) {
      throw new Error('Post no encontrado o no autorizado');
    }

    const postMediaData = mediaFiles.map(media => ({
      ...media,
      postId,
      createdAt: new Date(),
    }));

    return await db.insert(postMedia).values(postMediaData).returning();
  }
}

// Helper para seleccionar los campos del post
export function getPostFields() {
  return {
    id: posts.id,
    content: posts.content,
    type: posts.type,
    isPinned: posts.isPinned,
    isPublic: posts.isPublic,
    likeCount: posts.likeCount,
    commentCount: posts.commentCount,
    shareCount: posts.shareCount,
    viewCount: posts.viewCount,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
  };
}
