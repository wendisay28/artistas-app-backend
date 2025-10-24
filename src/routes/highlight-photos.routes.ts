import { Router } from 'express';
import {
  getMyHighlightPhotos,
  getUserHighlightPhotos,
  upsertHighlightPhoto,
  updateHighlightPhotos,
  deleteHighlightPhoto,
  checkHighlightPhotosComplete,
} from '../controllers/highlight-photos.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/v1/highlight-photos/me
 * @desc Obtener las fotos destacadas del usuario autenticado
 * @access Private
 */
router.get('/me', authenticateToken, getMyHighlightPhotos);

/**
 * @route GET /api/v1/highlight-photos/me/check
 * @desc Verificar si el usuario tiene las 4 fotos destacadas completas
 * @access Private
 */
router.get('/me/check', authenticateToken, checkHighlightPhotosComplete);

/**
 * @route GET /api/v1/highlight-photos/user/:userId
 * @desc Obtener las fotos destacadas de un usuario específico (público)
 * @access Public
 */
router.get('/user/:userId', getUserHighlightPhotos);

/**
 * @route POST /api/v1/highlight-photos
 * @desc Crear o actualizar una foto destacada
 * @access Private
 */
router.post('/', authenticateToken, upsertHighlightPhoto);

/**
 * @route PUT /api/v1/highlight-photos/batch
 * @desc Actualizar múltiples fotos destacadas a la vez
 * @access Private
 */
router.put('/batch', authenticateToken, updateHighlightPhotos);

/**
 * @route DELETE /api/v1/highlight-photos/:position
 * @desc Eliminar una foto destacada
 * @access Private
 */
router.delete('/:position', authenticateToken, deleteHighlightPhoto);

export default router;
