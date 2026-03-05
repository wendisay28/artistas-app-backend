import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { services, users } from '../schema.js';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  readUserRateLimit,
  moderateUserRateLimit,
  uploadRateLimit
} from '../middleware/userRateLimit.middleware.js';

const servicesRoutes = Router();

/**
 * @swagger
 * /api/v1/services/me:
 *   get:
 *     summary: Obtener mis servicios
 *     description: Obtiene todos los servicios del usuario autenticado
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Servicios obtenidos exitosamente
 */
// GET /api/v1/services/me - Obtener servicios personales del usuario autenticado (excluye servicios de empresa)
servicesRoutes.get('/me', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const userServices = await db
    .select()
    .from(services)
    .where(and(
      eq(services.userId, userId),
      isNull(services.companyId)
    ))
    .orderBy(desc(services.createdAt));

  res.json({
    success: true,
    data: userServices,
  });
}));

/**
 * @swagger
 * /api/v1/services/user/{userId}:
 *   get:
 *     summary: Obtener servicios públicos de un usuario
 *     description: Obtiene todos los servicios activos de un usuario específico
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Servicios obtenidos exitosamente
 */
// GET /api/v1/services/user/:userId - Obtener servicios de otro usuario (todos, no solo activos)
servicesRoutes.get('/user/:userId', readUserRateLimit, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userServices = await db
    .select()
    .from(services)
    .where(and(
      eq(services.userId, userId),
      isNull(services.companyId)
    ))
    .orderBy(desc(services.createdAt));

  res.json({
    success: true,
    data: userServices,
  });
}));

// GET /api/v1/services/company/:companyId - Obtener servicios de una empresa
servicesRoutes.get('/company/:companyId', readUserRateLimit, asyncHandler(async (req, res) => {
  const companyId = parseInt(req.params.companyId, 10);

  if (isNaN(companyId)) {
    throw new AppError(400, 'ID de empresa no válido', true, 'INVALID_ID');
  }

  const companyServices = await db
    .select()
    .from(services)
    .where(and(
      eq(services.companyId, companyId),
      eq(services.isActive, true)
    ))
    .orderBy(desc(services.createdAt));

  res.json({
    success: true,
    data: companyServices,
  });
}));

/**
 * @swagger
 * /api/v1/services/{id}:
 *   get:
 *     summary: Obtener un servicio por ID
 *     description: Obtiene los detalles de un servicio específico
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Servicio obtenido exitosamente
 *       404:
 *         description: Servicio no encontrado
 */
// GET /api/v1/services/:id - Obtener un servicio por ID
servicesRoutes.get('/:id', readUserRateLimit, asyncHandler(async (req, res) => {
  const serviceId = parseInt(req.params.id);

  if (isNaN(serviceId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  const [service] = await db
    .select({
      id: services.id,
      userId: services.userId,
      name: services.name,
      description: services.description,
      price: services.price,
      duration: services.duration,
      category: services.category,
      images: services.images,
      isActive: services.isActive,
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
      user: {
        id: users.id,
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(services)
    .leftJoin(users, eq(services.userId, users.id))
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service) {
    throw new AppError(404, 'Servicio no encontrado', true, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: service,
  });
}));

/**
 * @swagger
 * /api/v1/services:
 *   post:
 *     summary: Crear un nuevo servicio
 *     description: Crea un nuevo servicio para el usuario autenticado
 *     tags: [Services]
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
 *               price:
 *                 type: number
 *               duration:
 *                 type: string
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 */
// POST /api/v1/services - Crear nuevo servicio
servicesRoutes.post('/', authMiddleware, uploadRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const {
    name, description, price, currency, duration, category, images,
    icon, deliveryTag, packageType, includedCount, deliveryDays, weeklyFrequency,
  } = req.body;

  if (!name) {
    throw new AppError(400, 'El nombre del servicio es requerido', true, 'MISSING_NAME');
  }

  const [newService] = await db
    .insert(services)
    .values({
      userId,
      name,
      description: description || null,
      price: price || null,
      currency: currency || 'COP',
      duration: duration || null,
      category: category || null,
      icon: icon || 'brush-outline',
      deliveryTag: deliveryTag || null,
      packageType: packageType || 'single',
      includedCount: includedCount || 1,
      deliveryDays: deliveryDays || 0,
      weeklyFrequency: weeklyFrequency || null,
      images: images || [],
      isActive: true,
    })
    .returning();

  logger.info(`Usuario ${userId} creó servicio`, { serviceId: newService.id }, 'Services');

  res.status(201).json({
    success: true,
    message: 'Servicio creado exitosamente',
    data: newService,
  });
}));

/**
 * @swagger
 * /api/v1/services/{id}:
 *   patch:
 *     summary: Actualizar un servicio
 *     description: Actualiza un servicio existente
 *     tags: [Services]
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
 *         description: Servicio actualizado exitosamente
 *       404:
 *         description: Servicio no encontrado
 */
// PATCH /api/v1/services/:id - Actualizar servicio
servicesRoutes.patch('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const serviceId = parseInt(req.params.id);

  if (isNaN(serviceId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que el servicio existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(services)
    .where(and(
      eq(services.id, serviceId),
      eq(services.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Servicio no encontrado', true, 'NOT_FOUND');
  }

  const {
    name, description, price, currency, duration, category, images, isActive,
    icon, deliveryTag, packageType, includedCount, deliveryDays, weeklyFrequency,
  } = req.body;

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (currency !== undefined) updateData.currency = currency;
  if (duration !== undefined) updateData.duration = duration;
  if (category !== undefined) updateData.category = category;
  if (icon !== undefined) updateData.icon = icon;
  if (deliveryTag !== undefined) updateData.deliveryTag = deliveryTag;
  if (packageType !== undefined) updateData.packageType = packageType;
  if (includedCount !== undefined) updateData.includedCount = includedCount;
  if (deliveryDays !== undefined) updateData.deliveryDays = deliveryDays;
  if (weeklyFrequency !== undefined) updateData.weeklyFrequency = weeklyFrequency;
  if (images !== undefined) updateData.images = images;
  if (isActive !== undefined) updateData.isActive = isActive;

  const [updated] = await db
    .update(services)
    .set(updateData)
    .where(eq(services.id, serviceId))
    .returning();

  logger.info(`Usuario ${userId} actualizó servicio ${serviceId}`, undefined, 'Services');

  res.json({
    success: true,
    message: 'Servicio actualizado exitosamente',
    data: updated,
  });
}));

/**
 * @swagger
 * /api/v1/services/{id}:
 *   delete:
 *     summary: Eliminar un servicio
 *     description: Elimina un servicio del usuario
 *     tags: [Services]
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
 *         description: Servicio eliminado exitosamente
 *       404:
 *         description: Servicio no encontrado
 */
// DELETE /api/v1/services/:id - Eliminar servicio
servicesRoutes.delete('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const serviceId = parseInt(req.params.id);

  if (isNaN(serviceId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar que el servicio existe y pertenece al usuario
  const [existing] = await db
    .select()
    .from(services)
    .where(and(
      eq(services.id, serviceId),
      eq(services.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Servicio no encontrado', true, 'NOT_FOUND');
  }

  await db.delete(services).where(eq(services.id, serviceId));

  logger.info(`Usuario ${userId} eliminó servicio ${serviceId}`, undefined, 'Services');

  res.json({
    success: true,
    message: 'Servicio eliminado exitosamente',
  });
}));

export default servicesRoutes;
