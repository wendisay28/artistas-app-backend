import { Request, Response } from 'express';
import { db } from '../db.js';
import { recommendations, users, events, venues, blogPosts } from '../schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { recommendationsService } from '../services/recommendations.service.js';
import { z } from 'zod';

// Schema de validación para crear recomendación
const createRecommendationSchema = z.object({
  type: z.enum(['artist', 'event', 'venue', 'post']),
  artistId: z.number().optional(),
  eventId: z.number().optional(),
  venueId: z.number().optional(),
  postId: z.number().optional(),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  content: z.string().min(10, 'La recomendación debe tener al menos 10 caracteres'),
  score: z.number().min(1).max(5).default(5),
});

/**
 * GET /api/v1/recommendations/suggestions
 * Obtener sugerencias de usuarios personalizadas
 */
export const getSuggestedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const suggestions = await recommendationsService.getSuggestedUsers(userId, limit);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error('Error getting suggested users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener sugerencias de usuarios',
    });
  }
};

/**
 * GET /api/v1/recommendations/trending
 * Obtener usuarios trending (populares en crecimiento)
 */
export const getTrendingUsers = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const trending = await recommendationsService.getTrendingUsers(limit);

    res.json({
      success: true,
      data: trending,
    });
  } catch (error: any) {
    console.error('Error getting trending users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios trending',
    });
  }
};

/**
 * GET /api/v1/recommendations/similar
 * Obtener usuarios similares basados en intereses
 */
export const getSimilarUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const similar = await recommendationsService.getSimilarUsers(userId, limit);

    res.json({
      success: true,
      data: similar,
    });
  } catch (error: any) {
    console.error('Error getting similar users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios similares',
    });
  }
};

/**
 * POST /api/v1/recommendations
 * Crear una nueva recomendación
 */
export const createRecommendation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const result = createRecommendationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    // Validar que se proporcione el ID correcto según el tipo
    if (data.type === 'artist' && !data.artistId) {
      return res.status(400).json({ error: 'Se requiere artistId para recomendaciones de artistas' });
    }
    if (data.type === 'event' && !data.eventId) {
      return res.status(400).json({ error: 'Se requiere eventId para recomendaciones de eventos' });
    }
    if (data.type === 'venue' && !data.venueId) {
      return res.status(400).json({ error: 'Se requiere venueId para recomendaciones de lugares' });
    }
    if (data.type === 'post' && !data.postId) {
      return res.status(400).json({ error: 'Se requiere postId para recomendaciones de publicaciones' });
    }

    // Crear la recomendación
    const [recommendation] = await db
      .insert(recommendations)
      .values({
        userId,
        type: data.type,
        artistId: data.artistId,
        eventId: data.eventId,
        venueId: data.venueId,
        postId: data.postId,
        title: data.title,
        content: data.content,
        score: data.score.toString(),
        isApproved: true,
        isActive: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: recommendation,
      message: 'Recomendación creada exitosamente',
    });
  } catch (error: any) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la recomendación',
    });
  }
};

/**
 * GET /api/v1/recommendations
 * Obtener recomendaciones (filtradas por tipo, usuario, etc.)
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { type, userId: filterUserId, limit = 20, offset = 0 } = req.query;

    let query = db
      .select({
        id: recommendations.id,
        userId: recommendations.userId,
        type: recommendations.type,
        artistId: recommendations.artistId,
        eventId: recommendations.eventId,
        venueId: recommendations.venueId,
        postId: recommendations.postId,
        title: recommendations.title,
        content: recommendations.content,
        score: recommendations.score,
        likeCount: recommendations.likeCount,
        replyCount: recommendations.replyCount,
        createdAt: recommendations.createdAt,
        updatedAt: recommendations.updatedAt,
        // Datos del autor
        authorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        authorUsername: users.username,
        authorImage: users.profileImageUrl,
      })
      .from(recommendations)
      .innerJoin(users, eq(users.id, recommendations.userId))
      .where(
        and(
          eq(recommendations.isActive, true),
          eq(recommendations.isApproved, true)
        )
      )
      .$dynamic();

    if (type) {
      query = query.where(eq(recommendations.type, type as any));
    }

    if (filterUserId) {
      query = query.where(eq(recommendations.userId, filterUserId as string));
    }

    const results = await query
      .orderBy(desc(recommendations.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener recomendaciones',
    });
  }
};

/**
 * GET /api/v1/recommendations/:id
 * Obtener una recomendación específica
 */
export const getRecommendationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [recommendation] = await db
      .select({
        id: recommendations.id,
        userId: recommendations.userId,
        type: recommendations.type,
        artistId: recommendations.artistId,
        eventId: recommendations.eventId,
        venueId: recommendations.venueId,
        postId: recommendations.postId,
        title: recommendations.title,
        content: recommendations.content,
        score: recommendations.score,
        likeCount: recommendations.likeCount,
        replyCount: recommendations.replyCount,
        createdAt: recommendations.createdAt,
        updatedAt: recommendations.updatedAt,
        // Datos del autor
        authorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        authorUsername: users.username,
        authorImage: users.profileImageUrl,
      })
      .from(recommendations)
      .innerJoin(users, eq(users.id, recommendations.userId))
      .where(eq(recommendations.id, parseInt(id)));

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recomendación no encontrada',
      });
    }

    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error: any) {
    console.error('Error getting recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la recomendación',
    });
  }
};

/**
 * GET /api/v1/recommendations/my
 * Obtener mis recomendaciones
 */
export const getMyRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const myRecommendations = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      success: true,
      data: myRecommendations,
    });
  } catch (error: any) {
    console.error('Error getting my recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tus recomendaciones',
    });
  }
};

/**
 * DELETE /api/v1/recommendations/:id
 * Eliminar una recomendación (solo el autor)
 */
export const deleteRecommendation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    // Verificar que la recomendación pertenece al usuario
    const [recommendation] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, parseInt(id)));

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recomendación no encontrada',
      });
    }

    if (recommendation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar esta recomendación',
      });
    }

    // Eliminar o desactivar
    await db
      .update(recommendations)
      .set({ isActive: false })
      .where(eq(recommendations.id, parseInt(id)));

    res.json({
      success: true,
      message: 'Recomendación eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la recomendación',
    });
  }
};
