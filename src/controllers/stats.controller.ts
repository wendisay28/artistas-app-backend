import { Request, Response } from 'express';
import { db } from '../db.js';
import { sql, eq, and, gte } from 'drizzle-orm';
import { users, userActivities, userContracts, events } from '../schema.js';

export const statsController = {
  async getUserStats(req: any, res: Response) {
    if (!req.user?.id) {
      console.error('Usuario no autenticado');
      return res.status(401).json({ 
        success: false,
        message: 'No autenticado' 
      });
    }
    
    const userId = req.user.id;
    console.log(`Obteniendo estadísticas para el usuario: ${userId}`);
    
    try {

      // Obtener datos básicos del usuario
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          userType: users.userType,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        console.error(`Usuario no encontrado: ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Obtener estadísticas de contratos (con manejo de error si la tabla no existe)
      let totalContracts = 0;
      try {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(userContracts)
          .where(eq(userContracts.userId, userId));
        totalContracts = Number(count) || 0;
      } catch (error: any) {
        console.warn('Tabla user_contracts no existe aún:', error.message);
        totalContracts = 0;
      }

      // Obtener estadísticas de eventos (solo si es organizador)
      let totalEvents = 0;
      try {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(events)
          .where(eq(events.organizerId, userId));
        totalEvents = Number(count) || 0;
      } catch (error: any) {
        console.warn('Error al obtener eventos:', error.message);
        totalEvents = 0;
      }

      const isArtist = user.userType === 'artist';

      // Obtener actividades recientes con información del actor (con manejo de error si la tabla no existe)
      let recentActivities: any[] = [];
      try {
        recentActivities = await db
          .select({
            id: userActivities.id,
            type: userActivities.type,
            userId: userActivities.userId,
            actorId: userActivities.actorId,
            metadata: userActivities.metadata,
            createdAt: userActivities.createdAt,
            // Información del actor (si existe)
            actor: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl
            }
          })
          .from(userActivities)
          .leftJoin(users, eq(userActivities.actorId, users.id))
          .where(eq(userActivities.userId, userId))
          .orderBy(sql`${userActivities.createdAt} DESC`)
          .limit(5);
      } catch (error: any) {
        console.warn('Tabla user_activities no existe aún:', error.message);
        recentActivities = [];
      }

      // Obtener estadísticas de calificaciones (si es artista)
      let ratingStats = { averageRating: 0, totalRatings: 0 };
      if (isArtist) {
        try {
          const [stats] = await db
            .select({
              averageRating: sql<number>`COALESCE(${users.rating}, 0)::numeric(10,2)`,
              totalRatings: sql<number>`COALESCE(${users.totalReviews}, 0)`,
            })
            .from(users)
            .where(eq(users.id, userId));

          if (stats) {
            ratingStats = {
              averageRating: parseFloat(stats.averageRating?.toString() || '0'),
              totalRatings: parseInt(stats.totalRatings?.toString() || '0', 10)
            };
          }
        } catch (error: any) {
          console.warn('Error al obtener ratings de artista:', error.message);
          ratingStats = { averageRating: 0, totalRatings: 0 };
        }
      }

      // Formatear actividades recientes
      const formattedActivities = (recentActivities || []).map(activity => {
        const activityType = activity.type || '';
        let description = '';
        
        // Generar descripción basada en el tipo de actividad
        switch(activityType) {
          case 'follow':
            description = 'Te siguió';
            break;
          case 'like':
            description = 'Le gustó tu publicación';
            break;
          case 'comment':
            description = 'Comentó en tu publicación';
            break;
          case 'contract':
            description = 'Nuevo contrato';
            break;
          default:
            description = 'Nueva actividad';
        }
        
        // Asegurar que el actor tenga los campos requeridos
        let actor = null;
        if (activity.actor) {
          actor = {
            id: activity.actor.id || 'unknown',
            firstName: activity.actor.firstName || 'Usuario',
            lastName: activity.actor.lastName || '',
            profileImageUrl: activity.actor.profileImageUrl || ''
          };
        }
        
        return {
          id: String(activity.id || '0'),
          type: activityType,
          description: description,
          createdAt: activity.createdAt ? new Date(activity.createdAt).toISOString() : new Date().toISOString(),
          metadata: activity.metadata || null,
          actor: actor
        };
      });

      // Construir la respuesta
      const responseData = {
        success: true,
        data: {
          totalContracts: Number(totalContracts) || 0,
          totalEvents: Number(totalEvents) || 0,
          memberSince: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
          recentActivities: formattedActivities,
          ratingStats: {
            averageRating: Number(ratingStats.averageRating) || 0,
            totalRatings: Number(ratingStats.totalRatings) || 0
          }
        }
      };

      console.log('Estadísticas generadas correctamente para el usuario:', userId);
      return res.json(responseData);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del perfil',
      });
    }
  },
};

export default statsController;
