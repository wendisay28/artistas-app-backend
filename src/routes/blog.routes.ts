import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { blogPosts, users } from '../schema.js';
import { eq, and, desc, or, like, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  readUserRateLimit,
  moderateUserRateLimit,
  uploadRateLimit
} from '../middleware/userRateLimit.middleware.js';

const blogRoutes = Router();

/**
 * @swagger
 * /api/v1/blog:
 *   get:
 *     summary: Obtener todas las publicaciones del blog
 *     description: Obtiene todas las publicaciones públicas del blog con paginación
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Publicaciones obtenidas exitosamente
 */
// GET /api/v1/blog - Obtener todas las publicaciones (públicas)
blogRoutes.get('/', readUserRateLimit, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const category = req.query.category as string;
  const search = req.query.search as string;

  let query = db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      subtitle: blogPosts.subtitle,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      category: blogPosts.category,
      subcategories: blogPosts.subcategories,
      tags: blogPosts.tags,
      featuredImage: blogPosts.featuredImage,
      gallery: blogPosts.gallery,
      videoUrl: blogPosts.videoUrl,
      readingTime: blogPosts.readingTime,
      viewCount: blogPosts.viewCount,
      likeCount: blogPosts.likeCount,
      commentCount: blogPosts.commentCount,
      shareCount: blogPosts.shareCount,
      saveCount: blogPosts.saveCount,
      visibility: blogPosts.visibility,
      allowComments: blogPosts.allowComments,
      isFeatured: blogPosts.isFeatured,
      isVerified: blogPosts.isVerified,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      author: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(eq(blogPosts.visibility, 'public'));

  // Filtros
  const conditions = [eq(blogPosts.visibility, 'public')];

  if (category) {
    conditions.push(eq(blogPosts.category, category));
  }

  if (search) {
    conditions.push(
      or(
        like(blogPosts.title, `%${search}%`),
        like(blogPosts.content, `%${search}%`),
        sql`${blogPosts.tags}::text ILIKE ${`%${search}%`}`
      )!
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const posts = await query
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset);

  // Contar total para paginación
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(blogPosts)
    .where(eq(blogPosts.visibility, 'public'));

  res.json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}));

/**
 * @swagger
 * /api/v1/blog/me:
 *   get:
 *     summary: Obtener mis publicaciones
 *     description: Obtiene todas las publicaciones del usuario autenticado
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Publicaciones obtenidas exitosamente
 */
// GET /api/v1/blog/me - Obtener publicaciones del usuario autenticado
blogRoutes.get('/me', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.authorId, userId))
    .orderBy(desc(blogPosts.createdAt));

  res.json({
    success: true,
    data: posts,
  });
}));

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   get:
 *     summary: Obtener una publicación por ID
 *     description: Obtiene una publicación específica del blog
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Publicación obtenida exitosamente
 *       404:
 *         description: Publicación no encontrada
 */
// GET /api/v1/blog/:id - Obtener una publicación por ID
blogRoutes.get('/:id', readUserRateLimit, asyncHandler(async (req, res) => {
  const postId = parseInt(req.params.id);

  if (isNaN(postId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  const [post] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      subtitle: blogPosts.subtitle,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      category: blogPosts.category,
      subcategories: blogPosts.subcategories,
      tags: blogPosts.tags,
      featuredImage: blogPosts.featuredImage,
      gallery: blogPosts.gallery,
      videoUrl: blogPosts.videoUrl,
      readingTime: blogPosts.readingTime,
      viewCount: blogPosts.viewCount,
      likeCount: blogPosts.likeCount,
      commentCount: blogPosts.commentCount,
      shareCount: blogPosts.shareCount,
      saveCount: blogPosts.saveCount,
      visibility: blogPosts.visibility,
      allowComments: blogPosts.allowComments,
      isFeatured: blogPosts.isFeatured,
      isVerified: blogPosts.isVerified,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      author: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(eq(blogPosts.id, postId))
    .limit(1);

  if (!post) {
    throw new AppError(404, 'Publicación no encontrada', true, 'NOT_FOUND');
  }

  // Incrementar contador de vistas
  await db
    .update(blogPosts)
    .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
    .where(eq(blogPosts.id, postId));

  res.json({
    success: true,
    data: post,
  });
}));

/**
 * @swagger
 * /api/v1/blog:
 *   post:
 *     summary: Crear una nueva publicación
 *     description: Crea una nueva publicación en el blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               featuredImage:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, private, draft, archived]
 *     responses:
 *       201:
 *         description: Publicación creada exitosamente
 */
// POST /api/v1/blog - Crear nueva publicación
blogRoutes.post('/', authMiddleware, uploadRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const {
    title,
    subtitle,
    content,
    category,
    subcategories,
    tags,
    featuredImage,
    gallery,
    videoUrl,
    visibility,
    allowComments,
    isFeatured,
    scheduledAt,
  } = req.body;

  if (!title || !content) {
    throw new AppError(400, 'Título y contenido son requeridos', true, 'MISSING_FIELDS');
  }

  // Generar slug único
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();

  // Verificar si el slug ya existe y agregar sufijo si es necesario
  const existingSlugs = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(like(blogPosts.slug, `${slug}%`));

  if (existingSlugs.length > 0) {
    slug = `${slug}-${existingSlugs.length + 1}`;
  }

  // Calcular tiempo de lectura estimado (palabras / 200 palabras por minuto)
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Generar excerpt si no se proporciona
  const excerpt = content.substring(0, 200).trim() + '...';

  const [newPost] = await db
    .insert(blogPosts)
    .values({
      authorId: userId,
      title,
      slug,
      subtitle: subtitle || null,
      content,
      excerpt,
      readingTime,
      category: category || null,
      subcategories: subcategories || [],
      tags: tags || [],
      featuredImage: featuredImage || null,
      gallery: gallery || [],
      videoUrl: videoUrl || null,
      visibility: visibility || 'draft',
      allowComments: allowComments !== undefined ? allowComments : true,
      isFeatured: isFeatured || false,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: visibility === 'public' ? new Date() : null,
    })
    .returning();

  logger.info(`Usuario ${userId} creó publicación de blog`, { postId: newPost.id }, 'Blog');

  res.status(201).json({
    success: true,
    message: 'Publicación creada exitosamente',
    data: newPost,
  });
}));

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   patch:
 *     summary: Actualizar una publicación
 *     description: Actualiza una publicación existente del blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Publicación actualizada exitosamente
 *       404:
 *         description: Publicación no encontrada
 */
// PATCH /api/v1/blog/:id - Actualizar publicación
blogRoutes.patch('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const postId = parseInt(req.params.id);

  if (isNaN(postId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que la publicación existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(blogPosts)
    .where(and(
      eq(blogPosts.id, postId),
      eq(blogPosts.authorId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Publicación no encontrada', true, 'NOT_FOUND');
  }

  const {
    title,
    subtitle,
    content,
    category,
    subcategories,
    tags,
    featuredImage,
    gallery,
    videoUrl,
    visibility,
    allowComments,
    isFeatured,
  } = req.body;

  // Calcular nuevo tiempo de lectura si se actualizó el contenido
  let readingTime = existing.readingTime;
  if (content && content !== existing.content) {
    const wordCount = content.split(/\s+/).length;
    readingTime = Math.ceil(wordCount / 200);
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = title;
  if (subtitle !== undefined) updateData.subtitle = subtitle;
  if (content !== undefined) {
    updateData.content = content;
    updateData.excerpt = content.substring(0, 200).trim() + '...';
  }
  if (readingTime !== undefined) updateData.readingTime = readingTime;
  if (category !== undefined) updateData.category = category;
  if (subcategories !== undefined) updateData.subcategories = subcategories;
  if (tags !== undefined) updateData.tags = tags;
  if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
  if (gallery !== undefined) updateData.gallery = gallery;
  if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
  if (allowComments !== undefined) updateData.allowComments = allowComments;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

  // Si se cambia a público y no tenía publishedAt, establecerlo ahora
  if (visibility === 'public' && !existing.publishedAt) {
    updateData.publishedAt = new Date();
  }
  if (visibility !== undefined) updateData.visibility = visibility;

  const [updated] = await db
    .update(blogPosts)
    .set(updateData)
    .where(eq(blogPosts.id, postId))
    .returning();

  logger.info(`Usuario ${userId} actualizó publicación ${postId}`, undefined, 'Blog');

  res.json({
    success: true,
    message: 'Publicación actualizada exitosamente',
    data: updated,
  });
}));

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   delete:
 *     summary: Eliminar una publicación
 *     description: Elimina una publicación del blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Publicación eliminada exitosamente
 *       404:
 *         description: Publicación no encontrada
 */
// DELETE /api/v1/blog/:id - Eliminar publicación
blogRoutes.delete('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const postId = parseInt(req.params.id);

  if (isNaN(postId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que la publicación existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(blogPosts)
    .where(and(
      eq(blogPosts.id, postId),
      eq(blogPosts.authorId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Publicación no encontrada', true, 'NOT_FOUND');
  }

  await db.delete(blogPosts).where(eq(blogPosts.id, postId));

  logger.info(`Usuario ${userId} eliminó publicación ${postId}`, undefined, 'Blog');

  res.json({
    success: true,
    message: 'Publicación eliminada exitosamente',
  });
}));

export default blogRoutes;
