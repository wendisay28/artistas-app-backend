import { Router } from 'express';
import { createOffer } from '../controllers/offer.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { offerCreationRateLimit } from '../middleware/userRateLimit.middleware.js';

const router = Router();

// Crear una nueva oferta con rate limiting por usuario
router.post('/', authMiddleware, offerCreationRateLimit, createOffer);

export default router;
