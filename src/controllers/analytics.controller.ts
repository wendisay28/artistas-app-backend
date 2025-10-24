import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export class AnalyticsController {
  /**
   * Obtener vistas de perfil por día
   */
  async getProfileViewsByDay(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getProfileViewsByDay(userId, days);

      res.json(data);
    } catch (error: any) {
      console.error('Error getting profile views by day:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener crecimiento de seguidores por día
   */
  async getFollowersGrowthByDay(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getFollowersGrowthByDay(userId, days);

      res.json(data);
    } catch (error: any) {
      console.error('Error getting followers growth:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener estadísticas de engagement
   */
  async getEngagementStats(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getEngagementStats(userId, days);

      res.json(data);
    } catch (error: any) {
      console.error('Error getting engagement stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener distribución de actividad
   */
  async getActivityDistribution(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getActivityDistribution(userId, days);

      res.json(data);
    } catch (error: any) {
      console.error('Error getting activity distribution:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener resumen completo de analytics
   */
  async getAnalyticsSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getAnalyticsSummary(userId, days);

      res.json(data);
    } catch (error: any) {
      console.error('Error getting analytics summary:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
