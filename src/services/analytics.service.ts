import { db } from '../db';
import { profileViews, follows, userActivities } from '../schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export class AnalyticsService {
  /**
   * Obtener vistas de perfil por día (últimos N días)
   */
  async getProfileViewsByDay(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db
        .select({
          date: sql<string>`DATE(${profileViews.createdAt})`,
          views: sql<number>`COUNT(*)`,
        })
        .from(profileViews)
        .where(
          and(
            eq(profileViews.profileId, userId),
            gte(profileViews.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE(${profileViews.createdAt})`)
        .orderBy(sql`DATE(${profileViews.createdAt}) ASC`);

      // Rellenar días sin datos
      const dateMap = new Map(result.map(r => [r.date, r.views]));
      const filledData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        filledData.push({
          date: dateStr,
          views: dateMap.get(dateStr) || 0,
        });
      }

      return filledData;
    } catch (error) {
      console.error('Error getting profile views by day:', error);
      throw error;
    }
  }

  /**
   * Obtener crecimiento de seguidores por día (últimos N días)
   */
  async getFollowersGrowthByDay(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db
        .select({
          date: sql<string>`DATE(${follows.createdAt})`,
          newFollowers: sql<number>`COUNT(*)`,
        })
        .from(follows)
        .where(
          and(
            eq(follows.followingId, userId),
            gte(follows.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE(${follows.createdAt})`)
        .orderBy(sql`DATE(${follows.createdAt}) ASC`);

      // Rellenar días sin datos y acumular
      const dateMap = new Map(result.map(r => [r.date, r.newFollowers]));
      const filledData = [];
      let accumulated = 0;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const newFollowers = dateMap.get(dateStr) || 0;
        accumulated += newFollowers;

        filledData.push({
          date: dateStr,
          newFollowers,
          totalFollowers: accumulated,
        });
      }

      return filledData;
    } catch (error) {
      console.error('Error getting followers growth by day:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de engagement (últimos N días)
   */
  async getEngagementStats(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db
        .select({
          type: userActivities.type,
          count: sql<number>`COUNT(*)`,
        })
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            gte(userActivities.createdAt, startDate)
          )
        )
        .groupBy(userActivities.type);

      const stats: Record<string, number> = {};
      result.forEach(r => {
        stats[r.type] = r.count;
      });

      return {
        likes: stats.like || 0,
        comments: stats.comment || 0,
        follows: stats.follow || 0,
        profileViews: stats.profile_view || 0,
        recommendations: stats.recommendation || 0,
        total: Object.values(stats).reduce((sum, val) => sum + val, 0),
      };
    } catch (error) {
      console.error('Error getting engagement stats:', error);
      throw error;
    }
  }

  /**
   * Obtener distribución de actividad por tipo
   */
  async getActivityDistribution(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db
        .select({
          type: userActivities.type,
          count: sql<number>`COUNT(*)`,
        })
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            gte(userActivities.createdAt, startDate)
          )
        )
        .groupBy(userActivities.type)
        .orderBy(sql`COUNT(*) DESC`);

      return result.map(r => ({
        name: this.getActivityTypeName(r.type),
        value: r.count,
        type: r.type,
      }));
    } catch (error) {
      console.error('Error getting activity distribution:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de analytics
   */
  async getAnalyticsSummary(userId: string, days: number = 30) {
    try {
      const [profileViews, followersGrowth, engagement, distribution] = await Promise.all([
        this.getProfileViewsByDay(userId, days),
        this.getFollowersGrowthByDay(userId, days),
        this.getEngagementStats(userId, days),
        this.getActivityDistribution(userId, days),
      ]);

      // Calcular totales
      const totalViews = profileViews.reduce((sum, d) => sum + d.views, 0);
      const totalNewFollowers = followersGrowth.reduce((sum, d) => sum + d.newFollowers, 0);

      // Calcular promedios
      const avgViewsPerDay = Math.round(totalViews / days);
      const avgNewFollowersPerDay = Math.round(totalNewFollowers / days);

      // Comparar con período anterior (simplificado)
      const previousPeriodViews = profileViews.slice(0, Math.floor(days / 2)).reduce((sum, d) => sum + d.views, 0);
      const currentPeriodViews = profileViews.slice(Math.floor(days / 2)).reduce((sum, d) => sum + d.views, 0);
      const viewsGrowthPercent = previousPeriodViews > 0
        ? Math.round(((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100)
        : 0;

      return {
        profileViews,
        followersGrowth,
        engagement,
        distribution,
        summary: {
          totalViews,
          totalNewFollowers,
          avgViewsPerDay,
          avgNewFollowersPerDay,
          viewsGrowthPercent,
          totalEngagement: engagement.total,
        },
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      throw error;
    }
  }

  private getActivityTypeName(type: string): string {
    const names: Record<string, string> = {
      follow: 'Seguidores',
      profile_view: 'Vistas',
      like: 'Me gusta',
      comment: 'Comentarios',
      review: 'Reseñas',
      recommendation: 'Recomendaciones',
      achievement: 'Logros',
    };

    return names[type] || type;
  }
}

export const analyticsService = new AnalyticsService();
