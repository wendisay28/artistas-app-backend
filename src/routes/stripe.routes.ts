// src/routes/stripe.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  initiateStripeConnect,
  getStripeStatus,
  getStripeDashboardLink,
  disconnectStripe,
  updateStripeAccount,
  uploadDocument,
  uploadMiddleware,
  getComprobantes,
  createComprobante,
  updateComprobanteStatus,
} from '../controllers/stripe.controller.js';

const router = Router();

router.use(authMiddleware);

// Stripe Connect
router.post('/connect',        initiateStripeConnect);
router.get('/status',          getStripeStatus);
router.get('/dashboard-link',  getStripeDashboardLink);
router.post('/disconnect',     disconnectStripe);
router.put('/account',         updateStripeAccount);

// Documentos de verificación
router.post('/upload-document', uploadMiddleware, uploadDocument);

// Comprobantes
router.get('/comprobantes',          getComprobantes);
router.post('/comprobantes',         createComprobante);
router.patch('/comprobantes/:id',    updateComprobanteStatus);

export default router;
