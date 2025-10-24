import { Request, Response } from 'express';
import { activityService } from '../services/activity.service';
import { profileProgressService } from '../services/profile-progress.service';
import { recommendationsService } from '../services/recommendations.service';

export class ActivityController {
  /**
   * Obtener actividades recientes del usuario
   */
  async getRecentActivities(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await activityService.getRecentActivities(userId, limit);

      res.json(activities);
    } catch (error: any) {
      console.error('Error getting recent activities:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Marcar actividades como leídas
   */
  async markActivitiesAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { activityIds } = req.body;
      if (!Array.isArray(activityIds)) {
        return res.status(400).json({ error: 'activityIds debe ser un array' });
      }

      await activityService.markActivitiesAsRead(userId, activityIds);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking activities as read:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await activityService.getNotifications(userId, limit);

      res.json(notifications);
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const notificationId = parseInt(req.params.id);
      await activityService.markNotificationAsRead(userId, notificationId);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Seguir a un usuario
   */
  async followUser(req: Request, res: Response) {
    try {
      const followerId = req.user?.uid;
      if (!followerId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const followingId = req.params.userId;
      const result = await activityService.followUser(followerId, followingId);

      res.json(result);
    } catch (error: any) {
      console.error('Error following user:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Dejar de seguir a un usuario
   */
  async unfollowUser(req: Request, res: Response) {
    try {
      const followerId = req.user?.uid;
      if (!followerId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const followingId = req.params.userId;
      await activityService.unfollowUser(followerId, followingId);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener conteo de seguidores
   */
  async getFollowersCount(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.uid;
      if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
      }

      const count = await activityService.getFollowersCount(userId);

      res.json({ count });
    } catch (error: any) {
      console.error('Error getting followers count:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Registrar vista de perfil
   */
  async recordProfileView(req: Request, res: Response) {
    try {
      const profileId = req.params.userId;
      const viewerId = req.user?.uid;
      const viewerIp = req.ip;

      await activityService.recordProfileView(profileId, viewerId, viewerIp);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error recording profile view:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener conteo de vistas de perfil
   */
  async getProfileViewsCount(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.uid;
      if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const count = await activityService.getProfileViewsCount(userId, days);

      res.json({ count, days });
    } catch (error: any) {
      console.error('Error getting profile views count:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener logros del usuario
   */
  async getUserAchievements(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.uid;
      if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
      }

      const achievements = await activityService.getUserAchievements(userId);

      res.json(achievements);
    } catch (error: any) {
      console.error('Error getting user achievements:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener todos los logros disponibles
   */
  async getAllAchievements(req: Request, res: Response) {
    try {
      const userId = req.user?.uid; // Opcional
      const achievements = await activityService.getAllAchievements(userId);

      res.json(achievements);
    } catch (error: any) {
      console.error('Error getting all achievements:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener progreso del perfil
   */
  async getProfileProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const progress = await profileProgressService.getProgressStats(userId);

      res.json(progress);
    } catch (error: any) {
      console.error('Error getting profile progress:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener completitud del perfil
   */
  async getProfileCompleteness(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const completeness = await profileProgressService.calculateProfileCompleteness(userId);

      res.json(completeness);
    } catch (error: any) {
      console.error('Error getting profile completeness:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener estadísticas del dashboard (para RightSidebar)
   */
  async getDashboardStats(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      // Obtener todas las estadísticas en paralelo
      const [
        activities,
        progress,
        followersCount,
        viewsCount,
        achievements,
        notifications,
        suggestedUsers
      ] = await Promise.all([
        activityService.getRecentActivities(userId, 5),
        profileProgressService.getProgressStats(userId),
        activityService.getFollowersCount(userId),
        activityService.getProfileViewsCount(userId, 7),
        activityService.getUserAchievements(userId),
        activityService.getNotifications(userId, 5),
        recommendationsService.getSuggestedUsers(userId, 3)
      ]);

      // Obtener último logro desbloqueado
      const latestAchievement = achievements.length > 0 ? achievements[0] : null;

      // Contar notificaciones no leídas
      const unreadNotifications = notifications.filter(n => !n.isRead).length;

      res.json({
        recentActivities: activities,
        profileProgress: progress,
        stats: {
          followersCount,
          viewsThisWeek: viewsCount,
          unreadNotifications
        },
        latestAchievement,
        suggestedUsers,
      });
    } catch (error: any) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener usuarios sugeridos
   */
  async getSuggestedUsers(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const users = await recommendationsService.getSuggestedUsers(userId, limit);

      res.json(users);
    } catch (error: any) {
      console.error('Error getting suggested users:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener usuarios trending
   */
  async getTrendingUsers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const users = await recommendationsService.getTrendingUsers(limit);

      res.json(users);
    } catch (error: any) {
      console.error('Error getting trending users:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener usuarios similares
   */
  async getSimilarUsers(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const users = await recommendationsService.getSimilarUsers(userId, limit);

      res.json(users);
    } catch (error: any) {
      console.error('Error getting similar users:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const activityController = new ActivityController();
