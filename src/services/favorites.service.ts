import { db } from '../db.js';
import { favorites, events, companies, users } from '../schema.js';
import { and, desc, eq, sql } from 'drizzle-orm';

export const favoritesService = {
  addFavorite: async (userId: string, entityType: string, entityId: number) => {
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.entityType, entityType),
          eq(favorites.entityId, entityId)
        )
      )
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const [favorite] = await db
      .insert(favorites)
      .values({ userId, entityType, entityId })
      .returning();
    return favorite;
  },

  removeFavorite: async (userId: string, entityType: string, entityId: number) => {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.entityType, entityType),
          eq(favorites.entityId, entityId)
        )
      );
  },

  getFavorites: async (userId: string) => {
    // Obtener favoritos básicos
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    // Eliminar duplicados: mantener solo el más reciente por entityType + entityId
    const seen = new Map<string, typeof userFavorites[0]>();
    for (const fav of userFavorites) {
      const key = `${fav.entityType}_${fav.entityId}`;
      if (!seen.has(key)) {
        seen.set(key, fav);
      }
    }

    const uniqueFavorites = Array.from(seen.values());

    // Enriquecer con datos de la entidad
    const enrichedFavorites = await Promise.all(
      uniqueFavorites.map(async (fav) => {
        let entityData = null;
        
        try {
          const baseType = fav.entityType.replace('_saved', '');
          
          if (baseType === 'artist') {
            // Artists are now users with userType='artist' — entityId is users.id (varchar stored as string)
            const [artist] = await db
              .select({
                id: users.id,
                name: sql`COALESCE(NULLIF(${users.displayName}, ''), NULLIF(${users.firstName} || ' ' || ${users.lastName}, ' '), NULLIF(${users.artistName}, ''), NULLIF(${users.stageName}, ''), 'Artista')`.as('name'),
                stageName: users.stageName,
                image: users.profileImageUrl,
                description: sql`COALESCE(NULLIF(${users.description}, ''), NULLIF(${users.bio}, ''))`.as('description'),
                category: users.disciplineId,
                profession: users.roleId,
                baseCity: sql`COALESCE(NULLIF(${users.baseCity}, ''), NULLIF(${users.city}, ''))`.as('baseCity'),
                rating: users.rating,
              })
              .from(users)
              .where(and(eq(users.id, String(fav.entityId)), eq(users.userType, 'artist')))
              .limit(1);
            entityData = artist;
          } 
          else if (baseType === 'event') {
            const [event] = await db
              .select({
                id: events.id,
                name: events.title,
                image: events.featuredImage,
                description: events.description,
                location: events.city,
                date: events.startDate,
                city: events.city,
                venueName: events.venueName,
              })
              .from(events)
              .where(eq(events.id, fav.entityId))
              .limit(1);
            entityData = event;
          }
          else if (baseType === 'venue' || baseType === 'gallery') {
            const [venue] = await db
              .select({
                id: companies.id,
                name: sql`COALESCE(${companies.companyName}, ${users.displayName})`.as('name'),
                image: sql`COALESCE(${companies.coverPhotoUrl}, ${companies.logoUrl}, ${users.profileImageUrl})`.as('image'),
                description: sql`COALESCE(${companies.description}, ${users.bio})`.as('description'),
                address: companies.address,
                city: sql`COALESCE(${companies.city}, ${users.city})`.as('city'),
                companyType: companies.companyType,
              })
              .from(companies)
              .leftJoin(users, eq(companies.userId, users.id))
              .where(eq(companies.id, fav.entityId))
              .limit(1);
            entityData = venue;
          }
        } catch (error) {
          console.error(`Error fetching entity data for ${fav.entityType}:${fav.entityId}`, error);
        }

        return {
          ...fav,
          entityData,
        };
      })
    );

    return enrichedFavorites;
  },

  // Limpiar duplicados de la base de datos
  cleanupDuplicates: async (userId: string) => {
    // Obtener todos los favoritos del usuario
    const allFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    // Agrupar por entityType + entityId y encontrar duplicados
    const groups = new Map<string, number[]>();
    for (const fav of allFavorites) {
      const key = `${fav.entityType}_${fav.entityId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(fav.id);
    }

    // Eliminar duplicados (mantener el primero, que es el más reciente)
    let deletedCount = 0;
    for (const [, ids] of groups) {
      if (ids.length > 1) {
        // Eliminar todos excepto el primero (más reciente)
        const idsToDelete = ids.slice(1);
        for (const id of idsToDelete) {
          await db.delete(favorites).where(eq(favorites.id, id));
          deletedCount++;
        }
      }
    }

    return { deletedCount };
  },
};
