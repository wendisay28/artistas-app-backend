import { Router } from 'express';
import { getProfileReviews, getMyReviews } from '../controllers/profile.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
// IMPORTANTE: /me/reviews debe ir ANTES de /:id/reviews para que "me" no sea capturado como :id
router.get('/me/reviews', authMiddleware, getMyReviews);
// Obtener reseñas de un perfil por id
router.get('/:id/reviews', authMiddleware, getProfileReviews);
export default router;
