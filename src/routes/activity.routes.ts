import { Router } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Gestión de actividades, notificaciones y progreso del usuario
 */

/**
 * @swagger
 * /v1/activities/recent:
 *   get:
 *     summary: Obtener actividades recientes del usuario
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de actividades a obtener
 *     responses:
 *       200:
 *         description: Lista de actividades recientes
 *       401:
 *         description: No autenticado
 */
router.get('/recent', authenticateToken, activityController.getRecentActivities.bind(activityController));

/**
 * @swagger
 * /v1/activities/mark-read:
 *   post:
 *     summary: Marcar actividades como leídas
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activityIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Actividades marcadas como leídas
 *       400:
 *         description: Parámetros inválidos
 */
router.post('/mark-read', authenticateToken, activityController.markActivitiesAsRead.bind(activityController));

/**
 * @swagger
 * /v1/notifications:
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de notificaciones a obtener
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/notifications', authenticateToken, activityController.getNotifications.bind(activityController));

/**
 * @swagger
 * /v1/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificación como leída
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 */
router.patch('/notifications/:id/read', authenticateToken, activityController.markNotificationAsRead.bind(activityController));

/**
 * @swagger
 * /v1/users/{userId}/follow:
 *   post:
 *     summary: Seguir a un usuario
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario seguido exitosamente
 */
router.post('/users/:userId/follow', authenticateToken, activityController.followUser.bind(activityController));

/**
 * @swagger
 * /v1/users/{userId}/follow:
 *   delete:
 *     summary: Dejar de seguir a un usuario
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dejaste de seguir al usuario
 */
router.delete('/users/:userId/follow', authenticateToken, activityController.unfollowUser.bind(activityController));

/**
 * @swagger
 * /v1/users/{userId}/followers/count:
 *   get:
 *     summary: Obtener conteo de seguidores de un usuario
 *     tags: [Activity]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conteo de seguidores
 */
router.get('/users/:userId/followers/count', activityController.getFollowersCount.bind(activityController));

/**
 * @swagger
 * /v1/users/{userId}/view:
 *   post:
 *     summary: Registrar vista de perfil
 *     tags: [Activity]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vista registrada
 */
router.post('/users/:userId/view', activityController.recordProfileView.bind(activityController));

/**
 * @swagger
 * /v1/users/{userId}/views/count:
 *   get:
 *     summary: Obtener conteo de vistas de perfil
 *     tags: [Activity]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Conteo de vistas
 */
router.get('/users/:userId/views/count', activityController.getProfileViewsCount.bind(activityController));

/**
 * @swagger
 * /v1/achievements:
 *   get:
 *     summary: Obtener todos los logros disponibles
 *     tags: [Activity]
 *     responses:
 *       200:
 *         description: Lista de todos los logros (con estado si está autenticado)
 */
router.get('/achievements', activityController.getAllAchievements.bind(activityController));

/**
 * @swagger
 * /v1/achievements/user:
 *   get:
 *     summary: Obtener logros del usuario
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de logros del usuario
 */
router.get('/achievements/user', authenticateToken, activityController.getUserAchievements.bind(activityController));

/**
 * @swagger
 * /v1/profile/progress:
 *   get:
 *     summary: Obtener progreso del perfil
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de progreso del perfil
 */
router.get('/profile/progress', authenticateToken, activityController.getProfileProgress.bind(activityController));

/**
 * @swagger
 * /v1/profile/completeness:
 *   get:
 *     summary: Obtener completitud del perfil
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Porcentaje de completitud del perfil
 */
router.get('/profile/completeness', authenticateToken, activityController.getProfileCompleteness.bind(activityController));

/**
 * @swagger
 * /v1/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas del dashboard (para RightSidebar)
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas completas del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recentActivities:
 *                   type: array
 *                 profileProgress:
 *                   type: object
 *                 stats:
 *                   type: object
 *                   properties:
 *                     followersCount:
 *                       type: integer
 *                     viewsThisWeek:
 *                       type: integer
 *                     unreadNotifications:
 *                       type: integer
 *                 latestAchievement:
 *                   type: object
 *                 suggestedUsers:
 *                   type: array
 */
router.get('/dashboard/stats', authenticateToken, activityController.getDashboardStats.bind(activityController));

/**
 * @swagger
 * /v1/recommendations/suggested:
 *   get:
 *     summary: Obtener usuarios sugeridos
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de usuarios sugeridos
 */
router.get('/recommendations/suggested', authenticateToken, activityController.getSuggestedUsers.bind(activityController));

/**
 * @swagger
 * /v1/recommendations/trending:
 *   get:
 *     summary: Obtener usuarios trending
 *     tags: [Activity]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de usuarios trending
 */
router.get('/recommendations/trending', activityController.getTrendingUsers.bind(activityController));

/**
 * @swagger
 * /v1/recommendations/similar:
 *   get:
 *     summary: Obtener usuarios similares
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de usuarios similares
 */
router.get('/recommendations/similar', authenticateToken, activityController.getSimilarUsers.bind(activityController));

export default router;
