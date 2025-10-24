import { Router, Request, Response } from 'express';
import { userContractsStorage } from '../storage/userContracts.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// ============ CONTRATACIONES ============

/**
 * GET /api/v1/contracts
 * Obtener historial de contrataciones del usuario
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { limit, offset, status } = req.query;

    const contracts = await userContractsStorage.getUserContracts(userId, {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
      status: status as string,
    });

    res.json(contracts);
  } catch (error) {
    console.error('Error getting contracts:', error);
    res.status(500).json({ error: 'Error al obtener las contrataciones' });
  }
});

/**
 * GET /api/v1/contracts/stats
 * Obtener estadísticas de contrataciones
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const stats = await userContractsStorage.getContractStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting contract stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/**
 * GET /api/v1/contracts/:id
 * Obtener una contratación por ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const contract = await userContractsStorage.getContractById(parseInt(id));

    if (!contract) {
      return res.status(404).json({ error: 'Contratación no encontrada' });
    }

    // Verificar que la contratación pertenece al usuario
    if (contract.userId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json(contract);
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: 'Error al obtener la contratación' });
  }
});

/**
 * POST /api/v1/contracts
 * Crear nueva contratación
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      artistId,
      serviceId,
      serviceType,
      serviceName,
      description,
      amount,
      serviceDate,
      metadata,
    } = req.body;

    if (!artistId || !serviceType || !serviceName) {
      return res.status(400).json({
        error: 'artistId, serviceType y serviceName son requeridos',
      });
    }

    const contract = await userContractsStorage.createContract({
      userId,
      artistId,
      serviceId,
      serviceType,
      serviceName,
      description,
      amount: amount?.toString(),
      serviceDate: serviceDate ? new Date(serviceDate) : null,
      metadata: metadata || {},
    });

    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Error al crear la contratación' });
  }
});

/**
 * PUT /api/v1/contracts/:id/status
 * Actualizar estado de contratación
 */
router.put('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const { status, completionDate } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status es requerido' });
    }

    // Verificar que la contratación pertenece al usuario
    const contract = await userContractsStorage.getContractById(parseInt(id));
    if (!contract || contract.userId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const additionalData: any = {};
    if (completionDate) {
      additionalData.completionDate = new Date(completionDate);
    }

    const updated = await userContractsStorage.updateContractStatus(
      parseInt(id),
      status,
      additionalData
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating contract status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

/**
 * POST /api/v1/contracts/:id/review
 * Agregar reseña a contratación
 */
router.post('/:id/review', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const { rating, review } = req.body;

    if (!rating || !review) {
      return res.status(400).json({ error: 'rating y review son requeridos' });
    }

    // Verificar que la contratación pertenece al usuario
    const contract = await userContractsStorage.getContractById(parseInt(id));
    if (!contract || contract.userId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updated = await userContractsStorage.addReview(
      parseInt(id),
      parseInt(rating),
      review
    );

    res.json(updated);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Error al agregar la reseña' });
  }
});

// ============ COTIZACIONES ============

/**
 * GET /api/v1/contracts/quotations
 * Obtener cotizaciones del usuario
 */
router.get('/quotations/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { limit, offset, status } = req.query;

    const quotations = await userContractsStorage.getUserQuotations(userId, {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
      status: status as string,
    });

    res.json(quotations);
  } catch (error) {
    console.error('Error getting quotations:', error);
    res.status(500).json({ error: 'Error al obtener las cotizaciones' });
  }
});

/**
 * POST /api/v1/contracts/quotations
 * Crear solicitud de cotización
 */
router.post('/quotations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      artistId,
      serviceType,
      title,
      description,
      budgetMin,
      budgetMax,
      preferredDate,
      location,
      metadata,
    } = req.body;

    if (!artistId || !serviceType || !title || !description) {
      return res.status(400).json({
        error: 'artistId, serviceType, title y description son requeridos',
      });
    }

    const quotation = await userContractsStorage.createQuotation({
      userId,
      artistId,
      serviceType,
      title,
      description,
      budgetMin: budgetMin?.toString(),
      budgetMax: budgetMax?.toString(),
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      location,
      metadata: metadata || {},
    });

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Error al crear la cotización' });
  }
});

/**
 * PUT /api/v1/contracts/quotations/:id/accept
 * Aceptar cotización (convertir en contrato)
 */
router.put('/quotations/:id/accept', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    // Verificar que la cotización pertenece al usuario
    const quotation = await userContractsStorage.getQuotationById(parseInt(id));
    if (!quotation || quotation.userId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const result = await userContractsStorage.acceptQuotation(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error('Error accepting quotation:', error);
    res.status(500).json({ error: 'Error al aceptar la cotización' });
  }
});

/**
 * PUT /api/v1/contracts/quotations/:id/reject
 * Rechazar cotización
 */
router.put('/quotations/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    // Verificar que la cotización pertenece al usuario
    const quotation = await userContractsStorage.getQuotationById(parseInt(id));
    if (!quotation || quotation.userId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updated = await userContractsStorage.updateQuotationStatus(
      parseInt(id),
      'rejected'
    );

    res.json(updated);
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    res.status(500).json({ error: 'Error al rechazar la cotización' });
  }
});

export default router;
