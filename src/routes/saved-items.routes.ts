import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { savedItems, blogPosts } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  readUserRateLimit,
  moderateUserRateLimit
} from '../middleware/userRateLimit.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/saved-items:
 *   get:
 *     summary: Obtener elementos guardados
 *     description: Obtiene todos los elementos (posts) guardados por el usuario autenticado
 *     tags: [Saved Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de elementos guardados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SavedItem'
 *                 count:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const items = await db
    .select({
      id: savedItems.id,
      postId: savedItems.postId,
      savedAt: savedItems.savedAt,
      notes: savedItems.notes,
      post: {
        id: blogPosts.id,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        category: blogPosts.category,
      }
    })
    .from(savedItems)
    .leftJoin(blogPosts, eq(savedItems.postId, blogPosts.id))
    .where(eq(savedItems.userId, userId))
    .orderBy(savedItems.savedAt);

  logger.info(`Usuario ${userId} obtuvo ${items.length} elementos guardados`, undefined, 'SavedItems');

  res.json({
    success: true,
    data: items,
    count: items.length,
  });
}));

/**
 * @swagger
 * /api/saved-items:
 *   post:
 *     summary: Guardar un post
 *     description: Guarda un post en los favoritos del usuario
 *     tags: [Saved Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: integer
 *                 example: 42
 *               notes:
 *                 type: string
 *                 example: "Mis notas sobre este post"
 *     responses:
 *       201:
 *         description: Post guardado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: El post ya está guardado
 */
router.post('/', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { postId, notes } = req.body;

  if (!postId) {
    throw new AppError(400, 'postId es requerido', true, 'MISSING_POST_ID');
  }

  // Verificar que el post existe
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, postId))
    .limit(1);

  if (!post) {
    throw new AppError(404, 'Post no encontrado', true, 'POST_NOT_FOUND');
  }

  // Verificar si ya está guardado
  const [existing] = await db
    .select()
    .from(savedItems)
    .where(and(
      eq(savedItems.userId, userId),
      eq(savedItems.postId, postId)
    ))
    .limit(1);

  if (existing) {
    throw new AppError(409, 'El elemento ya está guardado', true, 'ALREADY_SAVED');
  }

  // Guardar el elemento
  const [newItem] = await db
    .insert(savedItems)
    .values({
      userId,
      postId,
      notes: notes || null,
    })
    .returning();

  logger.info(`Usuario ${userId} guardó post ${postId}`, undefined, 'SavedItems');

  res.status(201).json({
    success: true,
    message: 'Elemento guardado exitosamente',
    data: newItem,
  });
}));

/**
 * @swagger
 * /api/saved-items/{id}:
 *   patch:
 *     summary: Actualizar notas de un elemento guardado
 *     description: Actualiza las notas de un post guardado
 *     tags: [Saved Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del elemento guardado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Notas actualizadas"
 *     responses:
 *       200:
 *         description: Notas actualizadas exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Actualizar notas de un elemento guardado
router.patch('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);
  const { notes } = req.body;

  if (isNaN(itemId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que el elemento existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(savedItems)
    .where(and(
      eq(savedItems.id, itemId),
      eq(savedItems.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Elemento no encontrado', true, 'NOT_FOUND');
  }

  // Actualizar notas
  const [updated] = await db
    .update(savedItems)
    .set({ notes: notes || null })
    .where(eq(savedItems.id, itemId))
    .returning();

  logger.info(`Usuario ${userId} actualizó notas del elemento ${itemId}`, undefined, 'SavedItems');

  res.json({
    success: true,
    message: 'Notas actualizadas exitosamente',
    data: updated,
  });
}));

/**
 * @swagger
 * /api/saved-items/{id}:
 *   delete:
 *     summary: Eliminar un elemento guardado
 *     description: Elimina un post de los favoritos del usuario
 *     tags: [Saved Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del elemento guardado
 *     responses:
 *       200:
 *         description: Elemento eliminado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Eliminar un elemento guardado
router.delete('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que el elemento existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(savedItems)
    .where(and(
      eq(savedItems.id, itemId),
      eq(savedItems.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Elemento no encontrado', true, 'NOT_FOUND');
  }

  // Eliminar
  await db
    .delete(savedItems)
    .where(eq(savedItems.id, itemId));

  logger.info(`Usuario ${userId} eliminó elemento ${itemId}`, undefined, 'SavedItems');

  res.json({
    success: true,
    message: 'Elemento eliminado exitosamente',
  });
}));

export default router;
