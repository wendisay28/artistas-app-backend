import { db } from '../db.js';
import { artists, users, categories, disciplines, roles, specializations } from '../schema.js';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Definir tipos para los resultados de las consultas
type UserType = typeof users.$inferSelect;
type ArtistType = typeof artists.$inferSelect;
type CategoryType = typeof categories.$inferSelect;
type DisciplineType = typeof disciplines.$inferSelect;
type RoleType = typeof roles.$inferSelect;
type SpecializationType = typeof specializations.$inferSelect;

type ArtistWithRelations = {
  artist: ArtistType;
  user: UserType;
  category?: CategoryType | null;
  discipline?: DisciplineType | null;
  role?: RoleType | null;
  specialization?: SpecializationType | null;
};

export class ArtistStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  async getArtist(id: number): Promise<ArtistWithRelations | undefined> {
    const userAlias = alias(users, 'user');
    const categoryAlias = alias(categories, 'category');

    const [result] = await this.db
      .select({
        artist: artists,
        user: userAlias,
        category: categoryAlias
      })
      .from(artists)
      .where(eq(artists.id, id))
      .leftJoin(userAlias, eq(artists.userId, userAlias.id))
      .leftJoin(categoryAlias, eq(artists.categoryId, categoryAlias.id));

    if (!result || !result.user) return undefined;

    return {
      artist: result.artist,
      user: result.user,
      category: result.category || undefined
    };
  }

  async getArtists(filters?: { categoryId?: number; userId?: string }): Promise<ArtistWithRelations[]> {
    const userAlias = alias(users, 'user');
    const categoryAlias = alias(categories, 'category');
    const disciplineAlias = alias(disciplines, 'discipline');
    const roleAlias = alias(roles, 'role');
    const specializationAlias = alias(specializations, 'specialization');

    // Construir la consulta base con los joins
    const query = this.db
      .select({
        artist: artists,
        user: userAlias,
        category: categoryAlias,
        discipline: disciplineAlias,
        role: roleAlias,
        specialization: specializationAlias
      })
      .from(artists)
      .leftJoin(userAlias, eq(artists.userId, userAlias.id))
      .leftJoin(categoryAlias, eq(artists.categoryId, categoryAlias.id))
      .leftJoin(disciplineAlias, eq(artists.disciplineId, disciplineAlias.id))
      .leftJoin(roleAlias, eq(artists.roleId, roleAlias.id))
      .leftJoin(specializationAlias, eq(artists.specializationId, specializationAlias.id));

    // Aplicar condiciones de filtrado
    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(artists.categoryId, filters.categoryId));
    }
    
    if (filters?.userId) {
      conditions.push(eq(artists.userId, filters.userId));
    }

    // Aplicar condiciones si existen
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    // Ejecutar la consulta con las condiciones
    const results = whereClause 
      ? await query.where(whereClause)
      : await query;
    
    // Filtrar resultados nulos y mapear a la estructura esperada
    return results
      .filter((result): result is { artist: ArtistType; user: UserType; category: CategoryType | null; discipline: any; role: any; specialization: any } => {
        return result.user !== null;
      })
      .map(result => ({
        artist: result.artist,
        user: result.user,
        category: result.category || undefined,
        discipline: result.discipline || undefined,
        role: result.role || undefined,
        specialization: result.specialization || undefined
      }));
  }

  async createArtist(data: {
    userId: string;
    artistName: string;
    categoryId?: number | null;
    bio?: string | null;
    description?: string | null;
    subcategories?: string[];
    tags?: string[];
    availability?: Record<string, unknown> | null;
    isAvailable?: boolean;
    stageName?: string | null;
    gallery?: unknown[];
    socialMedia?: Record<string, unknown>;
  }) {
    const [artist] = await this.db
      .insert(artists)
      .values({
        userId: data.userId,
        artistName: data.artistName,
        categoryId: data.categoryId,
        bio: data.bio,
        description: data.description ?? null,
        subcategories: data.subcategories ?? [],
        tags: data.tags ?? [],
        availability: data.availability ?? {},
        isAvailable: typeof data.isAvailable === 'boolean' ? data.isAvailable : true,
        stageName: data.stageName ?? null,
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        socialMedia: data.socialMedia || {},
        isVerified: false,
        rating: '0',
        totalReviews: 0,
        fanCount: 0,
        metadata: {}
      })
      .returning();

    return artist;
  }

  async updateArtist(
    id: number,
    data: {
      categoryId?: number | null;
      bio?: string | null;
      description?: string | null;
      subcategories?: string[];
      tags?: string[];
      availability?: Record<string, unknown> | null;
      socialMedia?: Record<string, unknown>;
      isAvailable?: boolean;
      artistName?: string;
      stageName?: string | null;
      gallery?: unknown[];
      yearsOfExperience?: number | null;
      baseCity?: string | null;
      // Nuevos campos de perfil profesional
      education?: unknown[] | null;
      languages?: unknown[] | null;
      hourlyRate?: number | null;
      pricingType?: 'hourly' | 'deliverable' | 'depends' | null;
      licenses?: unknown[] | null;
      linkedAccounts?: Record<string, unknown> | null;
    }
  ) {
    const [artist] = await this.db
      .update(artists)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(artists.id, id))
      .returning();

    return artist;
  }

  async deleteArtist(id: number) {
    await this.db.delete(artists).where(eq(artists.id, id));
  }
}

export const artistStorage = new ArtistStorage(db);
