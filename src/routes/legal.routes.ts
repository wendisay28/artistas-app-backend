import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { 
  getLegalAcceptanceStatus, 
  updateLegalAcceptance, 
  acceptAllTerms,
  updateDeliveryMode,
  activateArtistProfile 
} from '../controllers/legal.controller.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// GET /api/legal/status - Obtener estado actual de aceptación legal
router.get('/status', getLegalAcceptanceStatus);

// PUT /api/legal/acceptance - Actualizar aceptación legal individual
router.put('/acceptance', updateLegalAcceptance);

// POST /api/legal/accept-all - Aceptar todos los términos de una vez
router.post('/accept-all', acceptAllTerms);

// PUT /api/legal/delivery-mode - Actualizar modo de entrega
router.put('/delivery-mode', updateDeliveryMode);

// POST /api/legal/activate-profile - Activar perfil para hacerlo público
router.post('/activate-profile', activateArtistProfile);

export default router;
