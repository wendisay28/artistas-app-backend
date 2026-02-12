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
  static async getAllPosts(
    limit = 10,
    offset = 0,
    type?: 'post' | 'nota' | 'blog',
    userId?: string,
    followingOnly?: boolean,
    category?: string
  ) {
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

    // Build where conditions
    const conditions = [];

    // Aplicar filtro de tipo si se especifica
    if (type) {
      conditions.push(eq(posts.type, type));
    }

    // Filter by following if requested
    if (followingOnly && userId) {
      conditions.push(sql`${posts.authorId} IN (
        SELECT following_id FROM follows WHERE follower_id = ${userId}
      )`);
    }

    // Filter by category if specified
    if (category) {
      conditions.push(sql`${users.id} IN (
        SELECT user_id FROM artists
        WHERE category_id = (SELECT id FROM categories WHERE LOWER(name) = LOWER(${category}))
      )`);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Obtener el total de posts (para paginación)
    const totalQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id));

    // Apply same filters to count query
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
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

  /**
   * Da like a un post
   */
  static async likePost(postId: number, userId: string) {
    await db.execute(sql`
      INSERT INTO post_likes (post_id, user_id, created_at)
      VALUES (${postId}, ${userId}, NOW())
      ON CONFLICT (post_id, user_id) DO NOTHING
    `);

    // Incrementar el contador de likes
    await db
      .update(posts)
      .set({ likeCount: sql`${posts.likeCount} + 1` })
      .where(eq(posts.id, postId));
  }

  /**
   * Quita el like de un post
   */
  static async unlikePost(postId: number, userId: string) {
    await db.execute(sql`
      DELETE FROM post_likes
      WHERE post_id = ${postId} AND user_id = ${userId}
    `);

    // Decrementar el contador de likes
    await db
      .update(posts)
      .set({ likeCount: sql`GREATEST(0, ${posts.likeCount} - 1)` })
      .where(eq(posts.id, postId));
  }

  /**
   * Comparte un post
   */
  static async sharePost(postId: number, userId: string, content?: string) {
    // Crear un nuevo post que es una compartida del original
    const sharedPost = await this.createPost({
      content: content || '',
      type: 'post',
      isPublic: true,
      authorId: userId,
      // Guardar el ID del post original en metadata
      metadata: { sharedPostId: postId }
    });

    // Incrementar el contador de compartidas del post original
    await db
      .update(posts)
      .set({ shareCount: sql`${posts.shareCount} + 1` })
      .where(eq(posts.id, postId));

    return sharedPost;
  }

  /**
   * Obtiene los comentarios de un post
   */
  static async getComments(postId: number) {
    console.log('🔵 Getting comments for post:', postId);

    const result = await db.execute(sql`
      SELECT
        c.id,
        c.content,
        c.parent_id as "parentId",
        c.created_at as "createdAt",
        c.like_count as likes,
        u.id as "authorId",
        u.first_name || ' ' || COALESCE(u.last_name, '') as "authorName",
        u.username,
        u.profile_image_url as "authorAvatar",
        u.is_verified as verified
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
    `);

    console.log('🟢 Comments query result full:', JSON.stringify(result, null, 2));
    console.log('🟡 Result type:', typeof result);
    console.log('🟡 Result keys:', Object.keys(result));
    console.log('🟡 Result.rows:', (result as any).rows);
    console.log('🟡 Result as array:', Array.isArray(result) ? result : 'not an array');

    // Manejar diferentes formatos posibles
    const comments = (result as any).rows || (Array.isArray(result) ? result : []);
    console.log('📤 Returning comments:', comments.length, comments);

    return comments;
  }

  /**
   * Crea un comentario en un post
   */
  static async createComment(
    postId: number,
    userId: string,
    content: string,
    parentId?: number,
    images?: string[],
    mentions?: string[],
    taggedArtists?: number[],
    taggedEvents?: number[],
    poll?: { question: string; options: string[] }
  ) {
    console.log('🔵 Creating comment:', { postId, userId, content, parentId, images, mentions, taggedArtists, taggedEvents, poll });

    const result = await db.execute(sql`
      INSERT INTO comments (
        post_id,
        user_id,
        content,
        parent_id,
        images,
        mentions,
        tagged_artists,
        tagged_events,
        poll,
        created_at,
        like_count
      )
      VALUES (
        ${postId},
        ${userId},
        ${content},
        ${parentId || null},
        ${images ? sql`ARRAY[${sql.join(images.map(img => sql`${img}`), sql`, `)}]::text[]` : sql`'{}'::text[]`},
        ${mentions ? sql`ARRAY[${sql.join(mentions.map(m => sql`${m}`), sql`, `)}]::text[]` : sql`'{}'::text[]`},
        ${taggedArtists ? sql`ARRAY[${sql.join(taggedArtists.map(a => sql`${a}`), sql`, `)}]::integer[]` : sql`'{}'::integer[]`},
        ${taggedEvents ? sql`ARRAY[${sql.join(taggedEvents.map(e => sql`${e}`), sql`, `)}]::integer[]` : sql`'{}'::integer[]`},
        ${poll ? sql`${JSON.stringify(poll)}::jsonb` : null},
        NOW(),
        0
      )
      RETURNING
        id,
        content,
        parent_id as "parentId",
        images,
        mentions,
        tagged_artists as "taggedArtists",
        tagged_events as "taggedEvents",
        poll,
        created_at as "createdAt",
        like_count as likes,
        user_id
    `);

    console.log('🟢 Insert result:', { result, rows: (result as any).rows, rowCount: (result as any).rowCount });

    // Incrementar el contador de comentarios del post
    await db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));

    // Manejar diferentes formatos de resultado
    const comment = (result as any).rows?.[0] || result[0];

    console.log('🟡 Comment from result:', comment);

    if (!comment) {
      console.error('❌ No comment returned from INSERT. Result:', JSON.stringify(result, null, 2));
      throw new Error('Failed to create comment');
    }

    // Obtener información del autor
    const authorResult = await db.execute(sql`
      SELECT
        u.id as "authorId",
        u.first_name || ' ' || COALESCE(u.last_name, '') as "authorName",
        u.username,
        u.profile_image_url as "authorAvatar",
        u.is_verified as verified
      FROM users u
      WHERE u.id = ${userId}
    `);

    const author = (authorResult as any).rows?.[0] || authorResult[0];

    console.log('🟢 Returning comment with author:', { comment, author });

    return {
      ...comment,
      authorId: author?.authorId || userId,
      authorName: author?.authorName || 'Unknown User',
      username: author?.username,
      authorAvatar: author?.authorAvatar,
      verified: author?.verified || false,
    };
  }

  /**
   * Da like a un comentario
   */
  static async likeComment(commentId: number, userId: string) {
    await db.execute(sql`
      INSERT INTO comment_likes (comment_id, user_id, created_at)
      VALUES (${commentId}, ${userId}, NOW())
      ON CONFLICT (comment_id, user_id) DO NOTHING
    `);

    await db.execute(sql`
      UPDATE comments
      SET like_count = like_count + 1
      WHERE id = ${commentId}
    `);
  }

  /**
   * Quita el like de un comentario
   */
  static async unlikeComment(commentId: number, userId: string) {
    await db.execute(sql`
      DELETE FROM comment_likes
      WHERE comment_id = ${commentId} AND user_id = ${userId}
    `);

    await db.execute(sql`
      UPDATE comments
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = ${commentId}
    `);
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
    saveCount: sql<number>`(
      SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_items')
      THEN (SELECT COUNT(*)::int FROM collection_items ci WHERE ci.post_id = ${posts.id} AND ci.post_type = 'post')
      ELSE 0 END
    )`,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
  };
}
