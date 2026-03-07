// src/routes/stripe.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { 
  initiateStripeConnect,
  getStripeStatus,
  getStripeDashboardLink,
  disconnectStripe,
  updateStripeAccount
} from '../controllers/stripe.controller.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// POST /api/stripe/connect - Iniciar conexión con Stripe Connect
router.post('/connect', initiateStripeConnect);

// GET /api/stripe/status - Obtener estado de la conexión
router.get('/status', getStripeStatus);

// GET /api/stripe/dashboard-link - Obtener enlace al dashboard
router.get('/dashboard-link', getStripeDashboardLink);

// POST /api/stripe/disconnect - Desconectar cuenta
router.post('/disconnect', disconnectStripe);

// PUT /api/stripe/account - Actualizar información de cuenta
router.put('/account', updateStripeAccount);

export default router;
