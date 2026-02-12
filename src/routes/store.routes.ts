import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { artworks, users } from '../schema.js';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  readUserRateLimit,
  moderateUserRateLimit,
  uploadRateLimit
} from '../middleware/userRateLimit.middleware.js';

const storeRoutes = Router();

/**
 * @swagger
 * /api/v1/store/me:
 *   get:
 *     summary: Obtener mis productos
 *     description: Obtiene todos los productos/artworks del usuario autenticado
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Productos obtenidos exitosamente
 */
// GET /api/v1/store/me - Obtener productos personales del usuario autenticado (excluye productos de empresa)
storeRoutes.get('/me', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const userProducts = await db
    .select()
    .from(artworks)
    .where(and(
      eq(artworks.userId, userId),
      isNull(artworks.companyId)
    ))
    .orderBy(desc(artworks.createdAt));

  res.json({
    success: true,
    data: userProducts,
  });
}));

/**
 * @swagger
 * /api/v1/store/user/{userId}:
 *   get:
 *     summary: Obtener productos de un usuario
 *     description: Obtiene todos los productos disponibles de un usuario específico
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Productos obtenidos exitosamente
 */
// GET /api/v1/store/user/:userId - Obtener productos de otro usuario (solo disponibles)
storeRoutes.get('/user/:userId', readUserRateLimit, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userProducts = await db
    .select()
    .from(artworks)
    .where(and(
      eq(artworks.userId, userId),
      eq(artworks.available, true),
      eq(artworks.showInExplorer, true)
    ))
    .orderBy(desc(artworks.createdAt));

  res.json({
    success: true,
    data: userProducts,
  });
}));

// GET /api/v1/store/company/:companyId - Obtener productos de una empresa
storeRoutes.get('/company/:companyId', readUserRateLimit, asyncHandler(async (req, res) => {
  const companyId = parseInt(req.params.companyId, 10);

  if (isNaN(companyId)) {
    throw new AppError(400, 'ID de empresa no válido', true, 'INVALID_ID');
  }

  const companyProducts = await db
    .select()
    .from(artworks)
    .where(eq(artworks.companyId, companyId))
    .orderBy(desc(artworks.createdAt));

  res.json({
    success: true,
    data: companyProducts,
  });
}));

/**
 * @swagger
 * /api/v1/store/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     description: Obtiene los detalles de un producto específico
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *       404:
 *         description: Producto no encontrado
 */
// GET /api/v1/store/:id - Obtener un producto por ID
storeRoutes.get('/:id', readUserRateLimit, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  const [product] = await db
    .select({
      id: artworks.id,
      userId: artworks.userId,
      name: artworks.name,
      description: artworks.description,
      category: artworks.category,
      images: artworks.images,
      price: artworks.price,
      dimensions: artworks.dimensions,
      materials: artworks.materials,
      year: artworks.year,
      available: artworks.available,
      stock: artworks.stock,
      city: artworks.city,
      tags: artworks.tags,
      showInExplorer: artworks.showInExplorer,
      views: artworks.views,
      likes: artworks.likes,
      createdAt: artworks.createdAt,
      updatedAt: artworks.updatedAt,
      user: {
        id: users.id,
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
      }
    })
    .from(artworks)
    .leftJoin(users, eq(artworks.userId, users.id))
    .where(eq(artworks.id, productId))
    .limit(1);

  if (!product) {
    throw new AppError(404, 'Producto no encontrado', true, 'NOT_FOUND');
  }

  // Incrementar contador de vistas
  await db
    .update(artworks)
    .set({ views: sql`${artworks.views} + 1` })
    .where(eq(artworks.id, productId));

  res.json({
    success: true,
    data: product,
  });
}));

/**
 * @swagger
 * /api/v1/store:
 *   post:
 *     summary: Crear un nuevo producto
 *     description: Crea un nuevo producto/artwork para el usuario autenticado
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [pintura, escultura, libro, fotografía, digital, otro]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               price:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *               year:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
// POST /api/v1/store - Crear nuevo producto
storeRoutes.post('/', authMiddleware, uploadRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const {
    name,
    description,
    category,
    images,
    price,
    dimensions,
    materials,
    year,
    available,
    stock,
    tags,
    showInExplorer
  } = req.body;

  if (!name) {
    throw new AppError(400, 'El nombre del producto es requerido', true, 'MISSING_NAME');
  }

  // Obtener ciudad del usuario
  const [user] = await db
    .select({ city: users.city })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [newProduct] = await db
    .insert(artworks)
    .values({
      userId,
      name,
      description: description || null,
      category: category || 'otro',
      images: images || [],
      price: price || null,
      dimensions: dimensions || null,
      materials: materials || [],
      year: year || null,
      available: available !== undefined ? available : true,
      stock: stock !== undefined ? stock : 1,
      city: user?.city || null,
      tags: tags || [],
      showInExplorer: showInExplorer !== undefined ? showInExplorer : true,
      views: 0,
      likes: 0,
    })
    .returning();

  logger.info(`Usuario ${userId} creó producto`, { productId: newProduct.id }, 'Store');

  res.status(201).json({
    success: true,
    message: 'Producto creado exitosamente',
    data: newProduct,
  });
}));

/**
 * @swagger
 * /api/v1/store/{id}:
 *   patch:
 *     summary: Actualizar un producto
 *     description: Actualiza un producto existente
 *     tags: [Store]
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
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
// PATCH /api/v1/store/:id - Actualizar producto
storeRoutes.patch('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que el producto existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(artworks)
    .where(and(
      eq(artworks.id, productId),
      eq(artworks.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Producto no encontrado', true, 'NOT_FOUND');
  }

  const {
    name,
    description,
    category,
    images,
    price,
    dimensions,
    materials,
    year,
    available,
    stock,
    tags,
    showInExplorer
  } = req.body;

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (images !== undefined) updateData.images = images;
  if (price !== undefined) updateData.price = price;
  if (dimensions !== undefined) updateData.dimensions = dimensions;
  if (materials !== undefined) updateData.materials = materials;
  if (year !== undefined) updateData.year = year;
  if (available !== undefined) updateData.available = available;
  if (stock !== undefined) updateData.stock = stock;
  if (tags !== undefined) updateData.tags = tags;
  if (showInExplorer !== undefined) updateData.showInExplorer = showInExplorer;

  const [updated] = await db
    .update(artworks)
    .set(updateData)
    .where(eq(artworks.id, productId))
    .returning();

  logger.info(`Usuario ${userId} actualizó producto ${productId}`, undefined, 'Store');

  res.json({
    success: true,
    message: 'Producto actualizado exitosamente',
    data: updated,
  });
}));

/**
 * @swagger
 * /api/v1/store/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     description: Elimina un producto del usuario
 *     tags: [Store]
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
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
// DELETE /api/v1/store/:id - Eliminar producto
storeRoutes.delete('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que el producto existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(artworks)
    .where(and(
      eq(artworks.id, productId),
      eq(artworks.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Producto no encontrado', true, 'NOT_FOUND');
  }

  await db.delete(artworks).where(eq(artworks.id, productId));

  logger.info(`Usuario ${userId} eliminó producto ${productId}`, undefined, 'Store');

  res.json({
    success: true,
    message: 'Producto eliminado exitosamente',
  });
}));

/**
 * @swagger
 * /api/v1/store/{id}/like:
 *   post:
 *     summary: Dar like a un producto
 *     description: Incrementa el contador de likes de un producto
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Like registrado exitosamente
 */
// POST /api/v1/store/:id/like - Dar like a un producto
storeRoutes.post('/:id/like', moderateUserRateLimit, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  const [product] = await db
    .select()
    .from(artworks)
    .where(eq(artworks.id, productId))
    .limit(1);

  if (!product) {
    throw new AppError(404, 'Producto no encontrado', true, 'NOT_FOUND');
  }

  await db
    .update(artworks)
    .set({ likes: sql`${artworks.likes} + 1` })
    .where(eq(artworks.id, productId));

  res.json({
    success: true,
    message: 'Like registrado exitosamente',
  });
}));

export default storeRoutes;
