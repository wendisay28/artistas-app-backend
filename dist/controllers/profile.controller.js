import { db } from '../db.js';
import { users, artists, reviews, categories, disciplines, roles, specializations, gallery } from '../schema.js';
import { eq, and, or, desc, sql } from 'drizzle-orm';
// Nota: Se removieron tipos externos no definidos (User, Artist) para evitar conflictos de compilación.
// Obtener todos los perfiles con filtros
export const getProfiles = async (req, res) => {
    try {
        const { category, city, minRating, limit = '10', offset = '0' } = req.query;
        // Validar paginación - máximo 100 items por página
        const limitNum = Math.min(Number(limit) || 10, 100);
        const offsetNum = Math.max(Number(offset) || 0, 0);
        // Construir condiciones base
        // Solo buscar artistas verificados (las empresas se manejan por tabla companies separada)
        const conditions = [
            eq(users.userType, 'artist'),
            eq(users.isVerified, true)
        ];
        // Agregar condiciones de filtro si existen
        if (city)
            conditions.push(eq(users.city, city));
        if (minRating)
            conditions.push(sql `${users.rating} >= ${Number(minRating)}`);
        if (category) {
            const categoryConditions = [];
            if (artists.categoryId) {
                categoryConditions.push(eq(artists.categoryId, Number(category)));
            }
            if (artists.subcategories) {
                categoryConditions.push(sql `${artists.subcategories} @> ARRAY[${category}]::text[]`);
            }
            if (categoryConditions.length > 0) {
                const orCondition = or(...categoryConditions);
                if (orCondition) {
                    conditions.push(orCondition);
                }
            }
        }
        // Construir consulta final con LEFT JOIN para evitar N+1
        const query = db
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
            // Incluir datos de artista directamente
            artistId: artists.id,
            artistName: artists.artistName,
            stageName: artists.stageName,
            categoryId: artists.categoryId,
            yearsOfExperience: artists.yearsOfExperience,
            viewCount: artists.viewCount,
            disciplineId: artists.disciplineId,
            roleId: artists.roleId,
            specializationId: artists.specializationId,
            tags: artists.tags,
        })
            .from(users)
            .leftJoin(artists, eq(users.id, artists.userId))
            .where(and(...conditions))
            .orderBy(desc(users.isFeatured), desc(users.rating))
            .limit(limitNum)
            .offset(offsetNum);
        const profiles = await query;
        // Mapear datos sin queries adicionales
        const enrichedProfiles = profiles.map((profile) => {
            const profileData = {
                id: profile.id,
                firstName: profile.firstName,
                lastName: profile.lastName,
                displayName: profile.displayName,
                profileImageUrl: profile.profileImageUrl,
                coverImageUrl: profile.coverImageUrl,
                userType: profile.userType,
                bio: profile.bio,
                city: profile.city,
                rating: profile.rating,
                totalReviews: profile.totalReviews,
                isFeatured: profile.isFeatured,
                isAvailable: profile.isAvailable,
                createdAt: profile.createdAt,
            };
            // Incluir datos de artista si existen
            if (profile.userType === 'artist' && profile.artistId) {
                profileData.artist = {
                    id: profile.artistId,
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
                // Calcular estadísticas
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
    }
    catch (error) {
        console.error('Error al obtener perfiles:', error);
        res.status(500).json({ message: 'Error al obtener los perfiles' });
    }
};
// Obtener un perfil por ID
export const getProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        // Obtener datos básicos del usuario
        const [profile] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        if (!profile) {
            return res.status(404).json({ message: 'Perfil no encontrado' });
        }
        const profileData = { ...profile };
        // Obtener detalles adicionales según el tipo de perfil
        if (profile.userType === 'artist' && profile.id) {
            const [artist] = await db
                .select()
                .from(artists)
                .where(eq(artists.userId, id));
            if (artist) {
                profileData.artist = artist;
                // Calcular estadísticas
                profileData.stats = {
                    totalReviews: Number(profile.totalReviews) || 0,
                    averageRating: Number(profile.rating) || 0,
                    yearsExperience: artist.yearsOfExperience || 0,
                    totalEvents: artist.viewCount ? Math.floor(Number(artist.viewCount) / 2) : 0
                };
            }
        }
        res.json(profileData);
    }
    catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil' });
    }
};
// Obtener reseñas de un perfil
export const getProfileReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = '10', offset = '0' } = req.query;
        // Validar paginación - máximo 100 items por página
        const limitNum = Math.min(Number(limit) || 10, 100);
        const offsetNum = Math.max(Number(offset) || 0, 0);
        // Verificar si el perfil existe
        const [profile] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        if (!profile) {
            return res.status(404).json({ message: 'Perfil no encontrado' });
        }
        // Obtener reseñas del perfil SOLO para artistas del usuario
        const profileReviews = await db
            .select({
            id: reviews.id,
            userId: reviews.userId,
            score: reviews.score,
            comment: reviews.reason,
            type: reviews.type,
            createdAt: reviews.createdAt
        })
            .from(reviews)
            .where(sql `${reviews.artistId} IN (SELECT id FROM artists WHERE user_id = ${id})`)
            .limit(limitNum)
            .offset(offsetNum);
        // Obtener estadísticas de calificaciones
        const [ratingStats] = await db
            .select({
            average: sql `COALESCE(AVG(score), 0) as average`,
            count: sql `COUNT(*) as count`,
        })
            .from(reviews)
            .where(sql `${reviews.artistId} IN (SELECT id FROM artists WHERE user_id = ${id})`);
        res.json({
            reviews: profileReviews,
            stats: {
                averageRating: ratingStats?.average ? parseFloat(String(ratingStats.average)) : 0,
                totalReviews: ratingStats?.count ? parseInt(String(ratingStats.count)) : 0,
                ratingDistribution: []
            }
        });
    }
    catch (error) {
        console.error('Error al obtener reseñas del perfil:', error);
        res.status(500).json({ message: 'Error al obtener las reseñas del perfil' });
    }
};
// Obtener perfil público completo (con trabajos destacados y toda la información)
export const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        // Obtener datos básicos del usuario
        const [profile] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        if (!profile) {
            return res.status(404).json({ message: 'Perfil no encontrado' });
        }
        const profileData = {
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
            projectsCompleted: 0, // TODO: implementar sistema de proyectos
            reviewsCount: profile.totalReviews,
            followersCount: profile.fanCount || 0,
            followingCount: 0, // TODO: implementar sistema de following
            isVerified: profile.isVerified,
            createdAt: profile.createdAt,
        };
        // Obtener detalles adicionales según el tipo de perfil
        if (profile.userType === 'artist') {
            // Obtener datos del artista con JOINs para categorías
            const [artistWithCategories] = await db
                .select({
                // Datos del artista
                id: artists.id,
                stageName: artists.stageName,
                artistName: artists.artistName,
                categoryId: artists.categoryId,
                disciplineId: artists.disciplineId,
                roleId: artists.roleId,
                specializationId: artists.specializationId,
                yearsOfExperience: artists.yearsOfExperience,
                availability: artists.availability,
                tags: artists.tags,
                portfolioUrl: artists.portfolio,
                baseCity: artists.baseCity,
                education: artists.education,
                languages: artists.languages,
                licenses: artists.licenses,
                linkedAccounts: artists.linkedAccounts,
                workExperience: artists.workExperience,
                hourlyRate: artists.hourlyRate,
                pricingType: artists.pricingType,
                priceRange: artists.priceRange,
                experience: artists.experience,
                artistType: artists.artistType,
                travelAvailability: artists.travelAvailability,
                travelDistance: artists.travelDistance,
                // Nombres de las categorías
                categoryName: categories.name,
                categoryCode: categories.code,
                disciplineName: disciplines.name,
                disciplineCode: disciplines.code,
                roleName: roles.name,
                roleCode: roles.code,
                specializationName: specializations.name,
                specializationCode: specializations.code,
            })
                .from(artists)
                .leftJoin(categories, eq(artists.categoryId, categories.id))
                .leftJoin(disciplines, eq(artists.disciplineId, disciplines.id))
                .leftJoin(roles, eq(artists.roleId, roles.id))
                .leftJoin(specializations, eq(artists.specializationId, specializations.id))
                .where(eq(artists.userId, id))
                .limit(1);
            if (artistWithCategories) {
                const artist = artistWithCategories;
                // Formatear datos del artista con información de categorías
                profileData.artistData = {
                    stageName: artist.stageName,
                    professionalTitle: artist.stageName || artist.artistName,
                    category: artist.categoryId ? {
                        id: artist.categoryId,
                        code: artist.categoryCode || artist.categoryId.toString(),
                        name: artist.categoryName || 'Categoría'
                    } : null,
                    discipline: artist.disciplineId ? {
                        id: artist.disciplineId,
                        code: artist.disciplineCode || artist.disciplineId.toString(),
                        name: artist.disciplineName || 'Disciplina'
                    } : null,
                    role: artist.roleId ? {
                        id: artist.roleId,
                        code: artist.roleCode || artist.roleId.toString(),
                        name: artist.roleName || 'Rol'
                    } : null,
                    specialization: artist.specializationId ? {
                        id: artist.specializationId,
                        code: artist.specializationCode || artist.specializationId.toString(),
                        name: artist.specializationName || 'Especialización'
                    } : null,
                    yearsOfExperience: artist.yearsOfExperience,
                    availability: artist.availability || {},
                    tags: artist.tags || [],
                    portfolioUrl: null, // El portfolio se obtiene desde portfolioPhotos
                    baseCity: artist.baseCity || profile.city,
                    // Información académica y profesional
                    education: artist.education || [],
                    languages: artist.languages || [],
                    licenses: artist.licenses || [],
                    linkedAccounts: artist.linkedAccounts || {},
                    workExperience: artist.workExperience || [],
                    // Información de precios
                    hourlyRate: artist.hourlyRate,
                    pricingType: artist.pricingType,
                    priceRange: artist.priceRange,
                    // Información profesional adicional
                    experience: artist.experience,
                    artistType: artist.artistType,
                    travelAvailability: artist.travelAvailability,
                    travelDistance: artist.travelDistance,
                };
                // Obtener trabajos destacados del portafolio
                try {
                    // Usar la tabla gallery en lugar de portfolio_photos
                    const featuredWorkResult = await db.select()
                        .from(gallery)
                        .where(and(eq(gallery.userId, id), eq(gallery.isFeatured, true), eq(gallery.isPublic, true)))
                        .orderBy(gallery.orderPosition)
                        .limit(4);
                    profileData.featuredWork = featuredWorkResult || [];
                }
                catch (error) {
                    console.error('Error al obtener trabajos destacados:', error);
                    profileData.featuredWork = [];
                }
                // Calcular estadísticas públicas
                profileData.stats = {
                    totalProjects: 0, // TODO: implementar contador de proyectos
                    totalReviews: Number(profile.totalReviews) || 0,
                    averageRating: Number(profile.rating) || 0,
                    responseTime: '< 24h', // TODO: calcular tiempo de respuesta real
                };
            }
        }
        else {
            // Para usuarios tipo 'client', 'company', o 'general' (contratantes)
            // Agregar estadísticas básicas
            profileData.stats = {
                totalProjects: 0, // TODO: implementar contador de proyectos publicados
                totalReviews: Number(profile.totalReviews) || 0,
                averageRating: Number(profile.rating) || 0,
                responseTime: '< 24h',
            };
            // Agregar datos adicionales para empresas si existen
            if (profile.userType === 'company') {
                // TODO: Implementar datos de empresa cuando exista la tabla
                profileData.companyData = {
                    companyName: profile.displayName || `${profile.firstName} ${profile.lastName}`,
                    industry: null, // TODO: agregar campo industry
                    size: null, // TODO: agregar campo company size
                    website: null, // TODO: agregar campo website
                };
            }
        }
        res.json(profileData);
    }
    catch (error) {
        console.error('Error al obtener perfil público:', error);
        res.status(500).json({ message: 'Error al obtener el perfil público' });
    }
};
// Obtener mis reseñas (usuario autenticado)
export const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = '10', offset = '0' } = req.query;
        // Validar paginación - máximo 100 items por página
        const limitNum = Math.min(Number(limit) || 10, 100);
        const offsetNum = Math.max(Number(offset) || 0, 0);
        // Obtener reseñas del usuario autenticado
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
        // Obtener estadísticas de calificaciones
        const [ratingStats] = await db
            .select({
            average: sql `COALESCE(AVG(score), 0) as average`,
            count: sql `COUNT(*) as count`,
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
    }
    catch (error) {
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
