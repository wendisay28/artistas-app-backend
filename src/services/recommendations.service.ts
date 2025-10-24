import { db } from '../db.js';
import { users, artists, follows } from '../schema.js';
import { eq, and, sql, not, inArray } from 'drizzle-orm';

export class RecommendationsService {
  /**
   * Obtener usuarios sugeridos para un usuario
   * Algoritmo:
   * 1. Usuarios de la misma ciudad
   * 2. Artistas de la misma categoría (si el usuario es artista)
   * 3. Usuarios que siguen a personas que tú sigues (amigos en común)
   * 4. Usuarios verificados y populares
   */
  async getSuggestedUsers(userId: string, limit: number = 10) {
    try {
      // Obtener información del usuario actual
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!currentUser) {
        throw new Error('Usuario no encontrado');
      }

      // Obtener IDs de usuarios que ya sigue
      const following = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));

      const followingIds = following.map(f => f.followingId);
      const excludeIds = [userId, ...followingIds];

      // Si el usuario es artista, obtener su categoría
      let currentArtistCategory: number | null = null;
      if (currentUser.userType === 'artist') {
        const [artistProfile] = await db
          .select()
          .from(artists)
          .where(eq(artists.userId, userId))
          .limit(1);

        currentArtistCategory = artistProfile?.categoryId || null;
      }

      // ESTRATEGIA 1: Usuarios de la misma ciudad
      const sameCityUsers = currentUser.city
        ? await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              username: users.username,
              profileImageUrl: users.profileImageUrl,
              userType: users.userType,
              city: users.city,
              isVerified: users.isVerified,
              followersCount: sql<number>`(SELECT COUNT(*) FROM follows WHERE following_id = ${users.id})`,
              mutualFollowers: sql<number>`0`, // Se calculará después
              score: sql<number>`3`, // Score base para misma ciudad
            })
            .from(users)
            .where(
              and(
                eq(users.city, currentUser.city),
                not(inArray(users.id, excludeIds))
              )
            )
            .limit(5)
        : [];

      // ESTRATEGIA 2: Artistas de la misma categoría
      const sameCategoryArtists =
        currentArtistCategory && currentUser.userType === 'artist'
          ? await db
              .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                username: users.username,
                profileImageUrl: users.profileImageUrl,
                userType: users.userType,
                city: users.city,
                isVerified: users.isVerified,
                followersCount: sql<number>`(SELECT COUNT(*) FROM follows WHERE following_id = ${users.id})`,
                mutualFollowers: sql<number>`0`,
                score: sql<number>`4`, // Score más alto para misma categoría
              })
              .from(users)
              .innerJoin(artists, eq(artists.userId, users.id))
              .where(
                and(
                  eq(artists.categoryId, currentArtistCategory),
                  not(inArray(users.id, excludeIds))
                )
              )
              .limit(5)
          : [];

      // ESTRATEGIA 3: Usuarios populares y verificados
      const popularUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          userType: users.userType,
          city: users.city,
          isVerified: users.isVerified,
          followersCount: sql<number>`(SELECT COUNT(*) FROM follows WHERE following_id = ${users.id})`,
          mutualFollowers: sql<number>`0`,
          score: sql<number>`CASE WHEN ${users.isVerified} THEN 2 ELSE 1 END`,
        })
        .from(users)
        .where(not(inArray(users.id, excludeIds)))
        .orderBy(sql`(SELECT COUNT(*) FROM follows WHERE following_id = ${users.id}) DESC`)
        .limit(5);

      // ESTRATEGIA 4: Calcular amigos en común para los usuarios recopilados
      const allSuggestions = [
        ...sameCityUsers,
        ...sameCategoryArtists,
        ...popularUsers,
      ];

      // Eliminar duplicados y calcular amigos en común
      const uniqueSuggestions = new Map();

      for (const suggestion of allSuggestions) {
        if (!uniqueSuggestions.has(suggestion.id)) {
          // Calcular seguidores mutuos
          const mutualFollowersResult = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(follows)
            .where(
              and(
                eq(follows.followerId, suggestion.id),
                inArray(
                  follows.followingId,
                  followingIds.length > 0 ? followingIds : ['']
                )
              )
            );

          const mutualFollowers =
            mutualFollowersResult[0]?.count || 0;

          uniqueSuggestions.set(suggestion.id, {
            ...suggestion,
            mutualFollowers,
            score: Number(suggestion.score) + mutualFollowers,
          });
        } else {
          // Si ya existe, aumentar el score
          const existing = uniqueSuggestions.get(suggestion.id);
          existing.score += Number(suggestion.score);
        }
      }

      // Convertir a array y ordenar por score
      const sortedSuggestions = Array.from(uniqueSuggestions.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, ...user }) => user); // Remover score del resultado final

      return sortedSuggestions;
    } catch (error: any) {
      console.error('Error getting suggested users:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios trending (populares en crecimiento)
   */
  async getTrendingUsers(limit: number = 10) {
    try {
      // Usuarios que han ganado más seguidores en los últimos 7 días
      const trendingUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          userType: users.userType,
          city: users.city,
          isVerified: users.isVerified,
          recentFollowers: sql<number>`(
            SELECT COUNT(*)
            FROM follows
            WHERE following_id = ${users.id}
            AND created_at > NOW() - INTERVAL '7 days'
          )`,
          totalFollowers: sql<number>`(
            SELECT COUNT(*)
            FROM follows
            WHERE following_id = ${users.id}
          )`,
        })
        .from(users)
        .orderBy(sql`(
          SELECT COUNT(*)
          FROM follows
          WHERE following_id = ${users.id}
          AND created_at > NOW() - INTERVAL '7 days'
        ) DESC`)
        .limit(limit);

      return trendingUsers;
    } catch (error: any) {
      console.error('Error getting trending users:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios similares basados en intereses/tags
   */
  async getSimilarUsers(userId: string, limit: number = 10) {
    try {
      // Si el usuario es artista, buscar artistas con tags similares
      const [currentArtist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, userId))
        .limit(1);

      if (!currentArtist || !currentArtist.tags || currentArtist.tags.length === 0) {
        return [];
      }

      // Obtener usuarios que ya sigue
      const following = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));

      const followingIds = following.map(f => f.followingId);
      const excludeIds = [userId, ...followingIds];

      // Buscar artistas con tags en común
      const similarArtists = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          userType: users.userType,
          city: users.city,
          isVerified: users.isVerified,
          tags: artists.tags,
          commonTags: sql<number>`(
            SELECT COUNT(*)
            FROM unnest(${artists.tags}) AS tag
            WHERE tag = ANY(${currentArtist.tags})
          )`,
        })
        .from(artists)
        .innerJoin(users, eq(users.id, artists.userId))
        .where(
          and(
            not(inArray(users.id, excludeIds)),
            sql`${artists.tags} && ${currentArtist.tags}` // Operador de intersección de arrays
          )
        )
        .orderBy(sql`(
          SELECT COUNT(*)
          FROM unnest(${artists.tags}) AS tag
          WHERE tag = ANY(${currentArtist.tags})
        ) DESC`)
        .limit(limit);

      return similarArtists.map(({ tags, commonTags, ...user }) => user);
    } catch (error: any) {
      console.error('Error getting similar users:', error);
      throw error;
    }
  }
}

export const recommendationsService = new RecommendationsService();
