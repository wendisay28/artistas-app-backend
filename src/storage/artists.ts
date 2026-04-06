// ─────────────────────────────────────────────────────────────────────────────
// storage/artists.ts — Acceso a datos de artistas (ahora en tabla users)
// Los campos de artista están directamente en users desde migración 0054.
// ─────────────────────────────────────────────────────────────────────────────
import { db } from '../db.js';
import { users, categories, disciplines, roles, specializations } from '../schema.js';
import { eq, and, or, ilike, sql, gte, lte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type UserType = typeof users.$inferSelect;
type CategoryType = typeof categories.$inferSelect;
type DisciplineType = typeof disciplines.$inferSelect;
type RoleType = typeof roles.$inferSelect;
type SpecializationType = typeof specializations.$inferSelect;

export type ArtistWithRelations = {
  artist: UserType;           // El usuario ES el artista — sin tabla separada
  user: UserType;             // Mismo objeto (alias para compatibilidad)
  category?: CategoryType | null;
  discipline?: DisciplineType | null;
  role?: RoleType | null;
  specialization?: SpecializationType | null;
};

export class ArtistStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  // ── getArtist por userId ───────────────────────────────────────────────────
  async getArtist(userId: string): Promise<ArtistWithRelations | undefined> {
    const [result] = await this.db
      .select({
        user: users,
        category: categories,
        discipline: disciplines,
        role: roles,
        specialization: specializations,
      })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.userType, 'artist')))
      .leftJoin(categories, eq(users.categoryId, categories.id))
      .leftJoin(disciplines, eq(users.disciplineId, disciplines.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(specializations, eq(users.specializationId, specializations.id));

    if (!result) return undefined;

    return {
      artist: result.user,
      user: result.user,
      category: result.category,
      discipline: result.discipline,
      role: result.role,
      specialization: result.specialization,
    };
  }

  // ── getArtists con filtros ─────────────────────────────────────────────────
  async getArtists(params?: {
    limit?: number;
    offset?: number;
    query?: string;
    category?: string;
    city?: string;
    priceMin?: number;
    priceMax?: number;
    availability?: boolean;
    userId?: string;
  }): Promise<ArtistWithRelations[]> {
    const conditions: any[] = [eq(users.userType, 'artist')];

    if (params?.city) {
      conditions.push(eq(users.baseCity, params.city));
    }

    if (params?.priceMin !== undefined) {
      conditions.push(sql`${users.hourlyRate} >= ${params.priceMin}`);
    }

    if (params?.priceMax !== undefined) {
      conditions.push(sql`${users.hourlyRate} <= ${params.priceMax}`);
    }

    if (params?.availability !== undefined) {
      conditions.push(eq(users.isAvailable, params.availability));
    }

    if (params?.userId) {
      conditions.push(eq(users.id, params.userId));
    }

    if (params?.query) {
      const term = `%${params.query}%`;
      conditions.push(
        or(
          ilike(users.displayName, term),
          sql`LOWER(${users.firstName} || ' ' || ${users.lastName}) LIKE LOWER(${term})`,
          ilike(users.artistName, term),
          ilike(users.stageName, term),
        )
      );
    }

    const baseQuery = this.db
      .select({
        user: users,
        category: categories,
        discipline: disciplines,
        role: roles,
        specialization: specializations,
      })
      .from(users)
      .leftJoin(categories, eq(users.categoryId, categories.id))
      .leftJoin(disciplines, eq(users.disciplineId, disciplines.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(specializations, eq(users.specializationId, specializations.id))
      .where(and(...conditions));

    const results = params?.limit
      ? await baseQuery.limit(params.limit).offset(params?.offset ?? 0)
      : await baseQuery;

    // Filtrar casos donde categoryId no coincide (leftJoin puede traer nulls del filtro de category por nombre)
    const filtered = params?.category
      ? results.filter(r => r.category?.name === params.category)
      : results;

    return filtered.map(r => ({
      artist: r.user,
      user: r.user,
      category: r.category,
      discipline: r.discipline,
      role: r.role,
      specialization: r.specialization,
    }));
  }

  // ── createArtist — en realidad actualiza un user existente a tipo artista ──
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
    workExperience?: unknown[] | null;
    education?: unknown[] | null;
  }) {
    const [updated] = await this.db
      .update(users)
      .set({
        userType: 'artist',
        artistName: data.artistName,
        categoryId: data.categoryId ?? null,
        bio: data.bio ?? null,
        description: data.description ?? null,
        subcategories: data.subcategories ?? [],
        tags: data.tags ?? [],
        availability: data.availability ?? {},
        isAvailable: typeof data.isAvailable === 'boolean' ? data.isAvailable : true,
        stageName: data.stageName ?? null,
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        socialMedia: data.socialMedia ?? {},
        workExperience: Array.isArray(data.workExperience) ? data.workExperience : [],
        education: Array.isArray(data.education) ? data.education : [],
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.userId))
      .returning();

    return updated;
  }

  // ── updateArtist — actualiza campos de artista en users ───────────────────
  async updateArtist(
    userId: string,
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
      education?: unknown[] | null;
      languages?: unknown[] | null;
      hourlyRate?: string | null;
      pricingType?: 'hourly' | 'deliverable' | 'depends' | null;
      licenses?: unknown[] | null;
      linkedAccounts?: Record<string, unknown> | null;
      workExperience?: unknown[] | null;
      experience?: number | null;
      artistType?: 'solo' | 'duo' | 'trio' | 'band' | 'collective' | null;
      travelAvailability?: boolean | null;
      travelDistance?: number | null;
      priceRange?: Record<string, unknown> | null;
      disciplineId?: number | null;
      roleId?: number | null;
      specializationId?: number | null;
      additionalTalents?: number[] | null;
      customStats?: Record<string, unknown> | null;
    }
  ) {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.userType, 'artist')))
      .returning();

    return updated;
  }

  // ── deleteArtist — degrada al usuario a tipo 'general' ────────────────────
  async deleteArtist(userId: string) {
    await this.db
      .update(users)
      .set({ userType: 'general', updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

export const artistStorage = new ArtistStorage(db);
