import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authMiddleware as authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Análisis y métricas del perfil de usuario
 */

/**
 * @swagger
 * /v1/analytics/profile-views:
 *   get:
 *     summary: Obtener vistas de perfil por día
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Vistas de perfil por día
 */
router.get('/profile-views', authenticateToken, analyticsController.getProfileViewsByDay.bind(analyticsController));

/**
 * @swagger
 * /v1/analytics/followers-growth:
 *   get:
 *     summary: Obtener crecimiento de seguidores por día
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Crecimiento de seguidores por día
 */
router.get('/followers-growth', authenticateToken, analyticsController.getFollowersGrowthByDay.bind(analyticsController));

/**
 * @swagger
 * /v1/analytics/engagement:
 *   get:
 *     summary: Obtener estadísticas de engagement
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Estadísticas de engagement
 */
router.get('/engagement', authenticateToken, analyticsController.getEngagementStats.bind(analyticsController));

/**
 * @swagger
 * /v1/analytics/activity-distribution:
 *   get:
 *     summary: Obtener distribución de actividad por tipo
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Distribución de actividad
 */
router.get('/activity-distribution', authenticateToken, analyticsController.getActivityDistribution.bind(analyticsController));

/**
 * @swagger
 * /v1/analytics/summary:
 *   get:
 *     summary: Obtener resumen completo de analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Resumen completo de analytics
 */
router.get('/summary', authenticateToken, analyticsController.getAnalyticsSummary.bind(analyticsController));

export default router;
