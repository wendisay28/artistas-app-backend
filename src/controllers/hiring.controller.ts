import { Request, Response } from 'express';
import { hiringStorage } from '../storage/hiring.js';
import { z } from 'zod';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq, and } from 'drizzle-orm';

// Esquemas de validación
const createHiringRequestSchema = z.object({
  details: z.string().min(20, 'Los detalles deben tener al menos 20 caracteres'),
  eventDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  artistId: z.number().optional(),
  venueId: z.number().optional(),
});

const updateHiringRequestSchema = z.object({
  details: z.string().min(20).optional(),
  eventDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'completed']).optional(),
});

const createHiringResponseSchema = z.object({
  proposal: z.string().min(20, 'La propuesta debe tener al menos 20 caracteres'),
  message: z.string().optional(),
});

/**
 * Obtener todas las ofertas de trabajo activas (público)
 * GET /api/v1/hiring
 * Query params: category, priceMin, priceMax, modality, limit, offset
 */
export const getAllHiringRequests = async (req: Request, res: Response) => {
  try {
    const {
      category,
      priceMin,
      priceMax,
      modality,
      limit = '50',
      offset = '0'
    } = req.query;

    let requests = await hiringStorage.getActiveHiringRequests();

    // Aplicar filtros
    if (category && typeof category === 'string') {
      requests = requests.filter(r =>
        r.details?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (priceMin && typeof priceMin === 'string') {
      const min = parseFloat(priceMin);
      requests = requests.filter(r => {
        const budget = parseFloat(r.budget || '0');
        return budget >= min;
      });
    }

    if (priceMax && typeof priceMax === 'string') {
      const max = parseFloat(priceMax);
      requests = requests.filter(r => {
        const budget = parseFloat(r.budget || '0');
        return budget <= max;
      });
    }

    if (modality && typeof modality === 'string') {
      const modalities = modality.split(',');
      requests = requests.filter(r =>
        modalities.some(m =>
          r.details?.toLowerCase().includes(m.toLowerCase())
        )
      );
    }

    // Paginación
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const total = requests.length;
    const paginatedRequests = requests.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: paginatedRequests,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });
  } catch (error) {
    console.error('Error getting hiring requests:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las ofertas' });
  }
};

/**
 * Obtener mis ofertas publicadas
 * GET /api/v1/hiring/my
 */
export const getMyHiringRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as any;

    const requests = await hiringStorage.getMyHiringRequests(userId, {
      limit,
      offset,
      status,
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error getting my hiring requests:', error);
    res.status(500).json({ success: false, error: 'Error al obtener tus ofertas' });
  }
};

/**
 * Obtener detalle de una oferta con sus respuestas
 * GET /api/v1/hiring/:id
 */
export const getHiringRequestById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const request = await hiringStorage.getHiringRequest(id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error getting hiring request:', error);
    res.status(500).json({ success: false, error: 'Error al obtener la oferta' });
  }
};

/**
 * Crear nueva oferta de trabajo pública
 * POST /api/v1/hiring
 */
export const createHiringRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const result = createHiringRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    const request = await hiringStorage.createHiringRequest({
      clientId: userId,
      details: data.details,
      eventDate: data.eventDate ? new Date(data.eventDate) : new Date(),
      artistId: data.artistId,
      venueId: data.venueId,
    });

    // Si se especificó budget, actualizarlo
    if (data.budget !== undefined) {
      await hiringStorage.updateHiringRequest(request.id, {
        budget: data.budget.toString(),
      });
    }

    res.status(201).json({
      success: true,
      data: request,
      message: 'Oferta de trabajo creada exitosamente',
    });
  } catch (error) {
    console.error('Error creating hiring request:', error);
    res.status(500).json({ success: false, error: 'Error al crear la oferta' });
  }
};

/**
 * Actualizar una oferta de trabajo
 * PUT /api/v1/hiring/:id
 */
export const updateHiringRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const result = updateHiringRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    // Verificar que la oferta existe y pertenece al usuario
    const existing = await hiringStorage.getHiringRequest(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    }

    if (existing.clientId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para modificar esta oferta' });
    }

    const data = result.data;
    const updated = await hiringStorage.updateHiringRequest(id, {
      details: data.details,
      eventDate: data.eventDate,
      budget: data.budget?.toString(),
      status: data.status,
    });

    res.json({
      success: true,
      data: updated,
      message: 'Oferta actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating hiring request:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la oferta' });
  }
};

/**
 * Eliminar una oferta de trabajo
 * DELETE /api/v1/hiring/:id
 */
export const deleteHiringRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    // Verificar que la oferta existe y pertenece al usuario
    const existing = await hiringStorage.getHiringRequest(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    }

    if (existing.clientId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar esta oferta' });
    }

    await hiringStorage.deleteHiringRequest(id);

    res.json({
      success: true,
      message: 'Oferta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting hiring request:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la oferta' });
  }
};

/**
 * Postularse a una oferta (artista)
 * POST /api/v1/hiring/:id/respond
 */
export const respondToHiringRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const result = createHiringResponseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    // Verificar que la oferta existe
    const request = await hiringStorage.getHiringRequest(requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Esta oferta ya no está disponible' });
    }

    // Verificar que el usuario tenga perfil de artista (artists merged into users)
    const [artistUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.userType, 'artist')))
      .limit(1);

    if (!artistUser) {
      return res.status(400).json({
        success: false,
        error: 'Debes tener un perfil de artista para responder a ofertas de trabajo'
      });
    }

    const response = await hiringStorage.createHiringResponse({
      requestId,
      artistId: userId, // artistId is now users.id (varchar)
      proposal: data.proposal,
      message: data.message,
      accepted: false, // Por defecto pending
    });

    res.status(201).json({
      success: true,
      data: response,
      message: 'Postulación enviada exitosamente',
    });
  } catch (error) {
    console.error('Error responding to hiring request:', error);
    res.status(500).json({ success: false, error: 'Error al enviar la postulación' });
  }
};

/**
 * Obtener postulaciones de una oferta
 * GET /api/v1/hiring/:id/responses
 */
export const getHiringResponses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    // Verificar que la oferta existe y pertenece al usuario
    const request = await hiringStorage.getHiringRequest(requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    }

    if (request.clientId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para ver estas postulaciones' });
    }

    const responses = await hiringStorage.getHiringResponsesByRequest(requestId);

    res.json({ success: true, data: responses });
  } catch (error) {
    console.error('Error getting hiring responses:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las postulaciones' });
  }
};

/**
 * Aceptar una postulación
 * POST /api/v1/hiring/responses/:id/accept
 */
export const acceptHiringResponse = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const responseId = parseInt(req.params.id);
    if (isNaN(responseId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    // El método acceptHiringResponse verifica permisos internamente
    const result = await hiringStorage.acceptHiringResponse(responseId);

    // Verificar que el usuario es el dueño de la oferta
    if (result.request.clientId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para aceptar esta postulación' });
    }

    res.json({
      success: true,
      data: result,
      message: 'Postulación aceptada y contrato creado exitosamente',
    });
  } catch (error) {
    console.error('Error accepting hiring response:', error);
    res.status(500).json({ success: false, error: 'Error al aceptar la postulación' });
  }
};

/**
 * Rechazar una postulación
 * POST /api/v1/hiring/responses/:id/reject
 */
export const rejectHiringResponse = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const responseId = parseInt(req.params.id);
    if (isNaN(responseId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const updated = await hiringStorage.updateHiringResponse(responseId, 'rejected');

    res.json({
      success: true,
      data: updated,
      message: 'Postulación rechazada',
    });
  } catch (error) {
    console.error('Error rejecting hiring response:', error);
    res.status(500).json({ success: false, error: 'Error al rechazar la postulación' });
  }
};
