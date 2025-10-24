import { db } from '../db';
import { userActivities, notifications, follows, profileViews, achievements, userAchievements, users } from '../schema';
import { eq, desc, and, sql, count, inArray } from 'drizzle-orm';

export class ActivityService {
  /**
   * Registrar una actividad del usuario
   */
  async createActivity(data: {
    userId: string;
    actorId?: string;
    type: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
  }) {
    try {
      const [activity] = await db
        .insert(userActivities)
        .values({
          userId: data.userId,
          actorId: data.actorId || null,
          type: data.type,
          entityType: data.entityType || null,
          entityId: data.entityId || null,
          metadata: data.metadata || {},
          isRead: false,
        })
        .returning();

      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Obtener actividades recientes del usuario
   */
  async getRecentActivities(userId: string, limit: number = 10) {
    try {
      const activities = await db
        .select({
          id: userActivities.id,
          type: userActivities.type,
          entityType: userActivities.entityType,
          entityId: userActivities.entityId,
          metadata: userActivities.metadata,
          isRead: userActivities.isRead,
          createdAt: userActivities.createdAt,
          actor: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(userActivities)
        .leftJoin(users, eq(userActivities.actorId, users.id))
        .where(eq(userActivities.userId, userId))
        .orderBy(desc(userActivities.createdAt))
        .limit(limit);

      return activities;
    } catch (error) {
      console.error('Error getting recent activities:', error);
      throw error;
    }
  }

  /**
   * Marcar actividades como leídas
   */
  async markActivitiesAsRead(userId: string, activityIds: number[]) {
    try {
      await db
        .update(userActivities)
        .set({ isRead: true })
        .where(
          and(
            eq(userActivities.userId, userId),
            inArray(userActivities.id, activityIds)
          )
        );

      return { success: true };
    } catch (error) {
      console.error('Error marking activities as read:', error);
      throw error;
    }
  }

  /**
   * Crear notificación
   */
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    priority?: 'low' | 'medium' | 'high';
    metadata?: any;
  }) {
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          priority: data.priority || 'medium',
          metadata: data.metadata || {},
          isRead: false,
        })
        .returning();

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications(userId: string, limit: number = 20) {
    try {
      const notifs = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return notifs;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(userId: string, notificationId: number) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Seguir a un usuario
   */
  async followUser(followerId: string, followingId: string) {
    try {
      // Verificar que no se esté siguiendo a sí mismo
      if (followerId === followingId) {
        throw new Error('No puedes seguirte a ti mismo');
      }

      // Insertar el follow
      const [follow] = await db
        .insert(follows)
        .values({
          followerId,
          followingId,
        })
        .returning();

      // Crear actividad
      await this.createActivity({
        userId: followingId,
        actorId: followerId,
        type: 'follow',
        entityType: 'user',
        entityId: followerId,
      });

      // Crear notificación
      const follower = await db.select().from(users).where(eq(users.id, followerId)).limit(1);
      if (follower.length > 0) {
        await this.createNotification({
          userId: followingId,
          type: 'follow',
          title: 'Nuevo seguidor',
          message: `${follower[0].firstName || 'Alguien'} ha comenzado a seguirte`,
          link: `/user/profile?id=${followerId}`,
          priority: 'medium',
        });
      }

      // Verificar logros de seguidores
      await this.checkFollowerAchievements(followingId);

      return follow;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Ya sigues a este usuario');
      }
      console.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Dejar de seguir a un usuario
   */
  async unfollowUser(followerId: string, followingId: string) {
    try {
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );

      // Crear actividad
      await this.createActivity({
        userId: followingId,
        actorId: followerId,
        type: 'unfollow',
        entityType: 'user',
        entityId: followerId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de seguidores
   */
  async getFollowersCount(userId: string) {
    try {
      const result = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followingId, userId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting followers count:', error);
      return 0;
    }
  }

  /**
   * Registrar vista de perfil
   */
  async recordProfileView(profileId: string, viewerId?: string, viewerIp?: string) {
    try {
      await db.insert(profileViews).values({
        profileId,
        viewerId: viewerId || null,
        viewerIp: viewerIp || null,
      });

      // Crear actividad si hay un viewer identificado
      if (viewerId && viewerId !== profileId) {
        await this.createActivity({
          userId: profileId,
          actorId: viewerId,
          type: 'profile_view',
          entityType: 'user',
          entityId: viewerId,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording profile view:', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de vistas de perfil
   */
  async getProfileViewsCount(profileId: string, days: number = 30) {
    try {
      const result = await db
        .select({ count: count() })
        .from(profileViews)
        .where(
          and(
            eq(profileViews.profileId, profileId),
            sql`${profileViews.createdAt} >= NOW() - INTERVAL '${days} days'`
          )
        );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting profile views count:', error);
      return 0;
    }
  }

  /**
   * Desbloquear logro para un usuario
   */
  async unlockAchievement(userId: string, achievementCode: string) {
    try {
      // Buscar el logro
      const achievement = await db
        .select()
        .from(achievements)
        .where(eq(achievements.code, achievementCode))
        .limit(1);

      if (achievement.length === 0) {
        throw new Error('Logro no encontrado');
      }

      const achievementId = achievement[0].id;

      // Verificar si ya lo tiene
      const existing = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { alreadyUnlocked: true, achievement: achievement[0] };
      }

      // Desbloquear
      const [unlocked] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          notified: false,
        })
        .returning();

      // Crear actividad
      await this.createActivity({
        userId,
        type: 'achievement',
        entityType: 'achievement',
        entityId: achievementId.toString(),
        metadata: {
          achievementCode,
          achievementName: achievement[0].name,
          points: achievement[0].points,
        },
      });

      // Crear notificación
      await this.createNotification({
        userId,
        type: 'system',
        title: '¡Logro Desbloqueado!',
        message: `Has desbloqueado: ${achievement[0].name} ${achievement[0].icon || '🏆'}`,
        link: '/user/profile?tab=achievements',
        priority: 'high',
        metadata: {
          achievementCode,
          points: achievement[0].points,
        },
      });

      return { unlocked, achievement: achievement[0] };
    } catch (error: any) {
      if (error.code === '23505') {
        return { alreadyUnlocked: true };
      }
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  /**
   * Obtener logros desbloqueados del usuario
   */
  async getUserAchievements(userId: string) {
    try {
      const userAchs = await db
        .select({
          id: userAchievements.id,
          unlockedAt: userAchievements.unlocked_at,
          achievement: {
            id: achievements.id,
            code: achievements.code,
            name: achievements.name,
            description: achievements.description,
            icon: achievements.icon,
            category: achievements.category,
            points: achievements.points,
          },
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.unlockedAt));

      return userAchs;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los logros disponibles (con estado si hay usuario)
   */
  async getAllAchievements(userId?: string) {
    try {
      if (!userId) {
        // Sin usuario, devolver solo logros
        return await db.select().from(achievements).orderBy(achievements.category, achievements.points);
      }

      // Con usuario, incluir estado de desbloqueo
      const allAchievements = await db
        .select()
        .from(achievements)
        .orderBy(achievements.category, achievements.points);

      const userAchs = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

      const unlockedIds = new Set(userAchs.map(ua => ua.achievementId));

      return allAchievements.map(ach => ({
        ...ach,
        isUnlocked: unlockedIds.has(ach.id),
        unlockedAt: userAchs.find(ua => ua.achievementId === ach.id)?.unlockedAt || null,
      }));
    } catch (error) {
      console.error('Error getting all achievements:', error);
      throw error;
    }
  }

  /**
   * Verificar y desbloquear logros de seguidores
   */
  private async checkFollowerAchievements(userId: string) {
    try {
      const followersCount = await this.getFollowersCount(userId);

      const achievementMap: Record<number, string> = {
        1: 'first_follower',
        10: '10_followers',
        50: '50_followers',
        100: '100_followers',
      };

      const achievementCode = achievementMap[followersCount];
      if (achievementCode) {
        await this.unlockAchievement(userId, achievementCode);
      }
    } catch (error) {
      console.error('Error checking follower achievements:', error);
    }
  }
}

export const activityService = new ActivityService();
