import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { gallery, featuredItems } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { readUserRateLimit, moderateUserRateLimit, uploadRateLimit } from '../middleware/userRateLimit.middleware.js';
const portfolioRoutes = Router();
/**
 * @swagger
 * /api/v1/portfolio:
 *   get:
 *     summary: Obtener portfolio completo
 *     description: Obtiene todas las fotos y videos del portfolio del usuario autenticado
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     photos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GalleryItem'
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeaturedItem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET /api/v1/portfolio - Obtener todo el portfolio del usuario
portfolioRoutes.get('/', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [photos, videos] = await Promise.all([
        // Gallery items (fotos)
        db.select()
            .from(gallery)
            .where(eq(gallery.userId, userId))
            .orderBy(gallery.createdAt),
        // Featured items (videos, enlaces)
        db.select()
            .from(featuredItems)
            .where(eq(featuredItems.userId, userId))
            .orderBy(featuredItems.createdAt),
    ]);
    res.json({
        success: true,
        data: {
            photos,
            videos,
        },
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/photos:
 *   post:
 *     summary: Agregar foto al portfolio
 *     description: Agrega una nueva foto a la galería del usuario
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 example: "https://storage.supabase.co/image.jpg"
 *               title:
 *                 type: string
 *                 example: "Mi obra de arte"
 *               description:
 *                 type: string
 *                 example: "Descripción de la imagen"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["arte", "portfolio"]
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Foto agregada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/GalleryItem'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST /api/v1/portfolio/photos - Agregar foto a galería
portfolioRoutes.post('/photos', authMiddleware, uploadRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { imageUrl, title, description, tags, isPublic } = req.body;
    if (!imageUrl) {
        throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
    }
    const [newPhoto] = await db
        .insert(gallery)
        .values({
        userId,
        imageUrl,
        title: title || null,
        description: description || null,
        tags: tags || [],
        isPublic: isPublic !== undefined ? isPublic : true,
        metadata: {},
    })
        .returning();
    logger.info(`Usuario ${userId} agregó foto al portfolio`, { photoId: newPhoto.id }, 'Portfolio');
    res.status(201).json({
        success: true,
        message: 'Foto agregada exitosamente',
        data: newPhoto,
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/photos/{id}:
 *   patch:
 *     summary: Actualizar foto del portfolio
 *     description: Actualiza los datos de una foto existente en la galería
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la foto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Foto actualizada exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PATCH /api/v1/portfolio/photos/:id - Actualizar foto
portfolioRoutes.patch('/photos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const photoId = parseInt(req.params.id);
    const { title, description, tags, isPublic } = req.body;
    if (isNaN(photoId)) {
        throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
    }
    // Verificar propiedad
    const [existing] = await db
        .select()
        .from(gallery)
        .where(and(eq(gallery.id, photoId), eq(gallery.userId, userId)))
        .limit(1);
    if (!existing) {
        throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');
    }
    const [updated] = await db
        .update(gallery)
        .set({
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        tags: tags !== undefined ? tags : existing.tags,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        updatedAt: new Date(),
    })
        .where(eq(gallery.id, photoId))
        .returning();
    logger.info(`Usuario ${userId} actualizó foto ${photoId}`, undefined, 'Portfolio');
    res.json({
        success: true,
        message: 'Foto actualizada exitosamente',
        data: updated,
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/photos/{id}:
 *   delete:
 *     summary: Eliminar foto del portfolio
 *     description: Elimina una foto de la galería del usuario
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la foto
 *     responses:
 *       200:
 *         description: Foto eliminada exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/v1/portfolio/photos/:id - Eliminar foto
portfolioRoutes.delete('/photos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
        throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
    }
    // Verificar propiedad
    const [existing] = await db
        .select()
        .from(gallery)
        .where(and(eq(gallery.id, photoId), eq(gallery.userId, userId)))
        .limit(1);
    if (!existing) {
        throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');
    }
    await db.delete(gallery).where(eq(gallery.id, photoId));
    logger.info(`Usuario ${userId} eliminó foto ${photoId}`, undefined, 'Portfolio');
    res.json({
        success: true,
        message: 'Foto eliminada exitosamente',
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/videos:
 *   post:
 *     summary: Agregar video/enlace al portfolio
 *     description: Agrega un nuevo video o enlace destacado al portfolio
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - title
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=abc123"
 *               title:
 *                 type: string
 *                 example: "Mi video destacado"
 *               description:
 *                 type: string
 *                 example: "Descripción del video"
 *               type:
 *                 type: string
 *                 enum: [youtube, spotify, vimeo, soundcloud, other]
 *                 example: "youtube"
 *               thumbnailUrl:
 *                 type: string
 *                 example: "https://example.com/thumb.jpg"
 *     responses:
 *       201:
 *         description: Video/enlace agregado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FeaturedItem'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST /api/v1/portfolio/videos - Agregar video/enlace destacado
portfolioRoutes.post('/videos', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { url, title, description, type, thumbnailUrl } = req.body;
    if (!url) {
        throw new AppError(400, 'url es requerido', true, 'MISSING_URL');
    }
    if (!title) {
        throw new AppError(400, 'title es requerido', true, 'MISSING_TITLE');
    }
    // Validar tipo si se proporciona
    const validTypes = ['youtube', 'spotify', 'vimeo', 'soundcloud', 'other'];
    const itemType = type && validTypes.includes(type) ? type : 'other';
    const [newVideo] = await db
        .insert(featuredItems)
        .values({
        userId,
        url,
        title,
        description: description || null,
        type: itemType,
        thumbnailUrl: thumbnailUrl || null,
    })
        .returning();
    logger.info(`Usuario ${userId} agregó video/enlace al portfolio`, { itemId: newVideo.id }, 'Portfolio');
    res.status(201).json({
        success: true,
        message: 'Video/enlace agregado exitosamente',
        data: newVideo,
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/videos/{id}:
 *   patch:
 *     summary: Actualizar video/enlace del portfolio
 *     description: Actualiza los datos de un video o enlace existente
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del video/enlace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video/enlace actualizado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PATCH /api/v1/portfolio/videos/:id - Actualizar video/enlace
portfolioRoutes.patch('/videos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const itemId = parseInt(req.params.id);
    const { title, description, thumbnailUrl } = req.body;
    if (isNaN(itemId)) {
        throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
    }
    // Verificar propiedad
    const [existing] = await db
        .select()
        .from(featuredItems)
        .where(and(eq(featuredItems.id, itemId), eq(featuredItems.userId, userId)))
        .limit(1);
    if (!existing) {
        throw new AppError(404, 'Video/enlace no encontrado', true, 'NOT_FOUND');
    }
    const [updated] = await db
        .update(featuredItems)
        .set({
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
        updatedAt: new Date(),
    })
        .where(eq(featuredItems.id, itemId))
        .returning();
    logger.info(`Usuario ${userId} actualizó video/enlace ${itemId}`, undefined, 'Portfolio');
    res.json({
        success: true,
        message: 'Video/enlace actualizado exitosamente',
        data: updated,
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/videos/{id}:
 *   delete:
 *     summary: Eliminar video/enlace del portfolio
 *     description: Elimina un video o enlace del portfolio del usuario
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del video/enlace
 *     responses:
 *       200:
 *         description: Video/enlace eliminado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/v1/portfolio/videos/:id - Eliminar video/enlace
portfolioRoutes.delete('/videos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
        throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
    }
    // Verificar propiedad
    const [existing] = await db
        .select()
        .from(featuredItems)
        .where(and(eq(featuredItems.id, itemId), eq(featuredItems.userId, userId)))
        .limit(1);
    if (!existing) {
        throw new AppError(404, 'Video/enlace no encontrado', true, 'NOT_FOUND');
    }
    await db.delete(featuredItems).where(eq(featuredItems.id, itemId));
    logger.info(`Usuario ${userId} eliminó video/enlace ${itemId}`, undefined, 'Portfolio');
    res.json({
        success: true,
        message: 'Video/enlace eliminado exitosamente',
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/featured:
 *   get:
 *     summary: Obtener trabajos destacados
 *     description: Obtiene las fotos marcadas como destacadas del portfolio del usuario (máximo 4)
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trabajos destacados obtenidos exitosamente
 */
// GET /api/v1/portfolio/featured - Obtener trabajos destacados del usuario autenticado
portfolioRoutes.get('/featured', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const featured = await db.select()
        .from(gallery)
        .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true)))
        .orderBy(gallery.orderPosition)
        .limit(4);
    res.json({
        success: true,
        data: featured,
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/user/{userId}:
 *   get:
 *     summary: Obtener portfolio público de un usuario
 *     description: Obtiene el portfolio público de cualquier usuario (solo fotos públicas)
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Portfolio obtenido exitosamente
 */
// GET /api/v1/portfolio/user/:userId - Obtener portfolio público de otro usuario
portfolioRoutes.get('/user/:userId', readUserRateLimit, asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const [photos, videos] = await Promise.all([
        db.select()
            .from(gallery)
            .where(and(eq(gallery.userId, userId), eq(gallery.isPublic, true)))
            .orderBy(gallery.createdAt),
        db.select()
            .from(featuredItems)
            .where(eq(featuredItems.userId, userId))
            .orderBy(featuredItems.createdAt),
    ]);
    res.json({
        success: true,
        data: {
            photos,
            videos,
        },
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/user/{userId}/featured:
 *   get:
 *     summary: Obtener trabajos destacados de un usuario
 *     description: Obtiene las fotos destacadas públicas de cualquier usuario (máximo 4)
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trabajos destacados obtenidos exitosamente
 */
// GET /api/v1/portfolio/user/:userId/featured - Obtener trabajos destacados de otro usuario
portfolioRoutes.get('/user/:userId/featured', readUserRateLimit, asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const featured = await db.select()
        .from(gallery)
        .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true), eq(gallery.isPublic, true)))
        .orderBy(gallery.orderPosition)
        .limit(4);
    res.json({
        success: true,
        data: featured,
    });
}));
/**
 * @swagger
 * /api/v1/portfolio/photos/{id}/featured:
 *   patch:
 *     summary: Marcar/desmarcar foto como destacada
 *     description: Actualiza el estado de destacado de una foto. Solo se permiten hasta 4 fotos destacadas.
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFeatured:
 *                 type: boolean
 *               orderPosition:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
// PATCH /api/v1/portfolio/photos/:id/featured - Marcar/desmarcar como destacado
portfolioRoutes.patch('/photos/:id/featured', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const photoId = parseInt(req.params.id);
    const { isFeatured, orderPosition } = req.body;
    if (isNaN(photoId)) {
        throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
    }
    // Verificar propiedad
    const [existing] = await db
        .select()
        .from(gallery)
        .where(and(eq(gallery.id, photoId), eq(gallery.userId, userId)))
        .limit(1);
    if (!existing) {
        throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');
    }
    // Si se está marcando como destacado, verificar límite de 4
    if (isFeatured === true) {
        const currentFeatured = await db.select()
            .from(gallery)
            .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true)));
        if (currentFeatured.length >= 4 && !existing.isFeatured) {
            throw new AppError(400, 'Solo puedes tener 4 trabajos destacados', true, 'MAX_FEATURED_REACHED');
        }
    }
    const [updated] = await db
        .update(gallery)
        .set({
        isFeatured: isFeatured !== undefined ? isFeatured : existing.isFeatured,
        orderPosition: orderPosition !== undefined ? orderPosition : existing.orderPosition,
        updatedAt: new Date(),
    })
        .where(eq(gallery.id, photoId))
        .returning();
    logger.info(`Usuario ${userId} actualizó estado destacado de foto ${photoId}`, { isFeatured }, 'Portfolio');
    res.json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: updated,
    });
}));
// Mantener endpoints legacy para compatibilidad con frontend existente
// Estos se pueden deprecar eventualmente
// POST /api/v1/portfolio/services - Deprecado, usar /photos
portfolioRoutes.post('/services', authMiddleware, asyncHandler(async (req, res) => {
    logger.warn('Endpoint /services deprecado, usar /photos', undefined, 'Portfolio');
    const userId = req.user.id;
    const { imageUrl, description, tags } = req.body;
    if (!imageUrl) {
        throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
    }
    const [newPhoto] = await db
        .insert(gallery)
        .values({
        userId,
        imageUrl,
        title: req.body.title || 'Servicio',
        description: description || null,
        tags: tags || [],
        isPublic: true,
        metadata: {},
    })
        .returning();
    res.status(201).json({
        success: true,
        message: 'Foto agregada exitosamente',
        data: newPhoto,
    });
}));
// POST /api/v1/portfolio/products - Deprecado, usar /photos con tags
portfolioRoutes.post('/products', authMiddleware, asyncHandler(async (req, res) => {
    logger.warn('Endpoint /products deprecado, usar /photos', undefined, 'Portfolio');
    const userId = req.user.id;
    const { imageUrl, description, tags, name } = req.body;
    if (!imageUrl) {
        throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
    }
    const [newPhoto] = await db
        .insert(gallery)
        .values({
        userId,
        imageUrl,
        title: name || req.body.title || 'Producto',
        description: description || null,
        tags: [...(tags || []), 'producto'],
        isPublic: true,
        metadata: {},
    })
        .returning();
    res.status(201).json({
        success: true,
        message: 'Foto agregada exitosamente',
        data: newPhoto,
    });
}));
// GET /api/v1/portfolio/me - Alias para obtener portfolio del usuario autenticado
portfolioRoutes.get('/me', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [photos, videos] = await Promise.all([
        // Gallery items (fotos)
        db.select()
            .from(gallery)
            .where(eq(gallery.userId, userId))
            .orderBy(gallery.createdAt),
        // Featured items (videos, enlaces)
        db.select()
            .from(featuredItems)
            .where(eq(featuredItems.userId, userId))
            .orderBy(featuredItems.createdAt),
    ]);
    res.json({
        success: true,
        data: {
            photos,
            videos,
        },
    });
}));
export default portfolioRoutes;
