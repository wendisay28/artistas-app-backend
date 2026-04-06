import { Request, Response } from 'express';
import { db } from '../db.js';
import { users, companies, reviews, categories, disciplines, roles, specializations, gallery, featuredItems } from '../schema.js';
import { eq, and, or, desc, sql } from 'drizzle-orm';

// Obtener todos los perfiles con filtros
export const getProfiles = async (req: Request, res: Response) => {
  try {
    const { category, city, minRating, limit = '10', offset = '0' } = req.query;

    const limitNum = Math.min(Number(limit) || 10, 100);
    const offsetNum = Math.max(Number(offset) || 0, 0);

    const conditions: any[] = [
      eq(users.userType, 'artist'),
      eq(users.isVerified, true)
    ];

    if (city) conditions.push(eq(users.city, city as string));
    if (minRating) conditions.push(sql`${users.rating} >= ${Number(minRating)}`);
    if (category) {
      const categoryConditions: any[] = [eq(users.categoryId, Number(category))];
      if (users.subcategories) {
        categoryConditions.push(sql`${users.subcategories} @> ARRAY[${category}]::text[]`);
      }
      const orCondition = or(...categoryConditions);
      if (orCondition) conditions.push(orCondition);
    }

    const profiles = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        profileImageUrl: users.profileImageUrl,
        coverImageUrl: users.coverImageUrl,
        userType: users.userType,
        bio: users.bio,
        city: users.city,
        rating: users.rating,
        totalReviews: users.totalReviews,
        isFeatured: users.isFeatured,
        isAvailable: users.isAvailable,
        createdAt: users.createdAt,
        artistName: users.artistName,
        stageName: users.stageName,
        categoryId: users.categoryId,
        yearsOfExperience: users.yearsOfExperience,
        viewCount: users.viewCount,
        disciplineId: users.disciplineId,
        roleId: users.roleId,
        specializationId: users.specializationId,
        tags: users.tags,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.isFeatured), desc(users.rating))
      .limit(limitNum)
      .offset(offsetNum);

    const enrichedProfiles = profiles.map((profile) => {
      const profileData: any = { ...profile };

      if (profile.userType === 'artist') {
        profileData.artist = {
          artistName: profile.artistName,
          stageName: profile.stageName,
          categoryId: profile.categoryId,
          yearsOfExperience: profile.yearsOfExperience,
          viewCount: profile.viewCount,
          disciplineId: profile.disciplineId,
          roleId: profile.roleId,
          specializationId: profile.specializationId,
          tags: profile.tags,
        };

        profileData.stats = {
          totalReviews: Number(profile.totalReviews) || 0,
          averageRating: Number(profile.rating) || 0,
          yearsExperience: profile.yearsOfExperience || 0,
          totalEvents: profile.viewCount ? Math.floor(Number(profile.viewCount) / 2) : 0
        };
      }

      return profileData;
    });

    res.json(enrichedProfiles);
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    res.status(500).json({ message: 'Error al obtener los perfiles' });
  }
};

// Obtener un perfil por ID
export const getProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const profileData: any = { ...profile };

    if (profile.userType === 'artist') {
      profileData.artist = {
        artistName: profile.artistName,
        stageName: profile.stageName,
        categoryId: profile.categoryId,
        disciplineId: profile.disciplineId,
        roleId: profile.roleId,
        specializationId: profile.specializationId,
        description: profile.description,
        bio: profile.bio,
        tags: profile.tags ?? [],
        yearsOfExperience: profile.yearsOfExperience ?? null,
        workExperience: profile.workExperience ?? [],
        education: profile.education ?? [],
        viewCount: profile.viewCount,
      };

      profileData.stats = {
        totalReviews: Number(profile.totalReviews) || 0,
        averageRating: Number(profile.rating) || 0,
        yearsExperience: profile.yearsOfExperience || 0,
        totalEvents: profile.viewCount ? Math.floor(Number(profile.viewCount) / 2) : 0
      };
    }

    res.json(profileData);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

// Obtener reseñas de un perfil
export const getProfileReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '10', offset = '0' } = req.query;

    const limitNum = Math.min(Number(limit) || 10, 100);
    const offsetNum = Math.max(Number(offset) || 0, 0);

    const [profile] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    // TODO: reviews.artistId was FK to artists.id (removed). Update reviews table to reference users.id.
    // For now returning empty reviews until migration is done.
    res.json({
      reviews: [],
      stats: { averageRating: 0, totalReviews: 0, ratingDistribution: [] }
    });
  } catch (error) {
    console.error('Error al obtener reseñas del perfil:', error);
    res.status(500).json({ message: 'Error al obtener las reseñas del perfil' });
  }
};

// Obtener perfil público completo
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const profileData: any = {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      displayName: profile.displayName,
      userType: profile.userType,
      profileImageUrl: profile.profileImageUrl,
      coverImageUrl: profile.coverImageUrl,
      city: profile.city,
      bio: profile.bio,
      shortBio: profile.shortBio,
      rating: profile.rating,
      projectsCompleted: 0,
      reviewsCount: profile.totalReviews,
      followersCount: profile.fanCount || 0,
      followingCount: 0,
      isVerified: profile.isVerified,
      createdAt: profile.createdAt,
    };

    if (profile.userType === 'artist') {
      // Get category hierarchy names
      const [catRow] = profile.categoryId ? await db
        .select({
          categoryName: categories.name,
          categoryCode: categories.code,
        })
        .from(categories)
        .where(eq(categories.id, profile.categoryId))
        .limit(1) : [null];

      const [discRow] = profile.disciplineId ? await db
        .select({ disciplineName: disciplines.name, disciplineCode: disciplines.code })
        .from(disciplines)
        .where(eq(disciplines.id, profile.disciplineId))
        .limit(1) : [null];

      const [roleRow] = profile.roleId ? await db
        .select({ roleName: roles.name, roleCode: roles.code })
        .from(roles)
        .where(eq(roles.id, profile.roleId))
        .limit(1) : [null];

      const [specRow] = profile.specializationId ? await db
        .select({ specializationName: specializations.name, specializationCode: specializations.code })
        .from(specializations)
        .where(eq(specializations.id, profile.specializationId))
        .limit(1) : [null];

      const artistMetadata = profile.artistMetadata as Record<string, any> | undefined;

      profileData.artistData = {
        stageName: profile.stageName,
        professionalTitle: profile.stageName || profile.artistName,
        category: profile.categoryId ? {
          id: profile.categoryId,
          code: catRow?.categoryCode || profile.categoryId.toString(),
          name: catRow?.categoryName || 'Categoría'
        } : null,
        discipline: profile.disciplineId ? {
          id: profile.disciplineId,
          code: discRow?.disciplineCode || profile.disciplineId.toString(),
          name: discRow?.disciplineName || 'Disciplina'
        } : null,
        role: profile.roleId ? {
          id: profile.roleId,
          code: roleRow?.roleCode || profile.roleId.toString(),
          name: roleRow?.roleName || 'Rol'
        } : null,
        specialization: profile.specializationId ? {
          id: profile.specializationId,
          code: specRow?.specializationCode || profile.specializationId.toString(),
          name: specRow?.specializationName || 'Especialización'
        } : null,
        // description: texto largo "Acerca de mí" (≠ user.bio que es frase corta)
        description: profile.description,
        yearsOfExperience: profile.yearsOfExperience,
        availability: profile.availability || {},
        tags: profile.tags || [],
        portfolioUrl: null,
        baseCity: profile.baseCity || profile.city,
        education: profile.education || [],
        languages: profile.languages || [],
        licenses: profile.licenses || [],
        linkedAccounts: profile.linkedAccounts || {},
        workExperience: profile.workExperience || [],
        hourlyRate: profile.hourlyRate,
        pricingType: profile.pricingType,
        priceRange: profile.priceRange,
        experience: profile.experience,
        artistType: profile.artistType,
        travelAvailability: profile.travelAvailability,
        travelDistance: profile.travelDistance,
      };

      try {
        const featuredWorkResult = await db.select()
          .from(gallery)
          .where(and(
            eq(gallery.userId, id),
            eq(gallery.isFeatured, true),
            eq(gallery.isPublic, true)
          ))
          .orderBy(gallery.orderPosition)
          .limit(4);
        profileData.featuredWork = featuredWorkResult || [];
      } catch (error) {
        console.error('Error al obtener trabajos destacados:', error);
        profileData.featuredWork = [];
      }

      profileData.stats = {
        totalProjects: 0,
        totalReviews: Number(profile.totalReviews) || 0,
        averageRating: Number(profile.rating) || 0,
        responseTime: '< 24h',
      };
    } else {
      profileData.stats = {
        totalProjects: 0,
        totalReviews: Number(profile.totalReviews) || 0,
        averageRating: Number(profile.rating) || 0,
        responseTime: '< 24h',
      };

      if (profile.userType === 'company') {
        profileData.companyData = {
          companyName: profile.displayName || `${profile.firstName} ${profile.lastName}`,
          industry: null,
          size: null,
          website: null,
        };
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Error al obtener perfil público:', error);
    res.status(500).json({ message: 'Error al obtener el perfil público' });
  }
};

// Obtener mis reseñas (usuario autenticado)
export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '10', offset = '0' } = req.query;

    const limitNum = Math.min(Number(limit) || 10, 100);
    const offsetNum = Math.max(Number(offset) || 0, 0);

    const myReviews = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        score: reviews.score,
        comment: reviews.reason,
        type: reviews.type,
        createdAt: reviews.createdAt
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .limit(limitNum)
      .offset(offsetNum);

    const [ratingStats] = await db
      .select({
        average: sql<number>`COALESCE(AVG(score), 0) as average`,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    res.json({
      reviews: myReviews,
      stats: {
        averageRating: ratingStats?.average ? parseFloat(String(ratingStats.average)) : 0,
        totalReviews: ratingStats?.count ? parseInt(String(ratingStats.count)) : 0,
        ratingDistribution: []
      }
    });
  } catch (error) {
    console.error('Error al obtener mis reseñas:', error);
    res.status(500).json({ message: 'Error al obtener mis reseñas' });
  }
};

// Controlador para compatibilidad con rutas
export const profileController = {
  getAll: getProfiles,
  getById: getProfileById,
  getReviews: getProfileReviews,
  getMyReviews: getMyReviews,
  getPublic: getPublicProfile
};
