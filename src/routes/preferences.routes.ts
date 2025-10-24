import { Router, Request, Response } from 'express';
import { userPreferencesStorage } from '../storage/userPreferences.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/v1/preferences
 * Obtener preferencias del usuario
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const preferences = await userPreferencesStorage.getOrCreatePreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Error al obtener las preferencias' });
  }
});

/**
 * PUT /api/v1/preferences
 * Actualizar preferencias del usuario
 */
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { favoriteCategories, interests, priceRange, preferredLocations, notificationPreferences } = req.body;

    // Asegurar que las preferencias existan
    await userPreferencesStorage.getOrCreatePreferences(userId);

    const updateData: any = {};
    if (favoriteCategories !== undefined) updateData.favoriteCategories = favoriteCategories;
    if (interests !== undefined) updateData.interests = interests;
    if (priceRange !== undefined) updateData.priceRange = priceRange;
    if (preferredLocations !== undefined) updateData.preferredLocations = preferredLocations;
    if (notificationPreferences !== undefined) updateData.notificationPreferences = notificationPreferences;

    const preferences = await userPreferencesStorage.updatePreferences(userId, updateData);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Error al actualizar las preferencias' });
  }
});

/**
 * POST /api/v1/preferences/categories/add
 * Agregar categoría a favoritas
 */
router.post('/categories/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'category es requerido' });
    }

    const preferences = await userPreferencesStorage.addFavoriteCategory(userId, category);
    res.json(preferences);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Error al agregar la categoría' });
  }
});

/**
 * POST /api/v1/preferences/categories/remove
 * Remover categoría de favoritas
 */
router.post('/categories/remove', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'category es requerido' });
    }

    const preferences = await userPreferencesStorage.removeFavoriteCategory(userId, category);
    res.json(preferences);
  } catch (error) {
    console.error('Error removing category:', error);
    res.status(500).json({ error: 'Error al remover la categoría' });
  }
});

export default router;
