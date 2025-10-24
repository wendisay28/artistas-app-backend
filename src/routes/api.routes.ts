import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';

// Importar controladores de artista
import { 
  getFeatured as getFeaturedArtists, 
  getAll as getAllArtists, 
  getById as getArtistById 
} from '../controllers/artist.controller.js';

// Importar controladores de eventos
import EventController, { getUpcomingEvents } from '../controllers/event.controller.js';

// Importar controladores del blog
import { getRecentPosts as getBlogRecentPosts } from '../controllers/blog.controller.js';

// Importar controladores de usuario
import { userController } from '../controllers/user.controller.js';

// Importar controladores de elementos destacados
import * as featuredController from '../controllers/featured.controller.js';

// Importar controladores de ofertas
import { offerController } from '../controllers/offer.controller.js';

// Importar controladores de perfiles
import { profileController } from '../controllers/profile.controller.js';

// Importar rutas de posts
import postRoutes from './posts.routes.js';

// Importar rutas de elementos guardados
import savedItemsRoutes from './saved-items.routes.js';

// Importar rutas de contratos y cotizaciones
import contractsRoutes from './contracts.routes.js';

// Importar rutas de preferencias
import preferencesRoutes from './preferences.routes.js';

// Importar rutas de actividad
import activityRoutes from './activity.routes.js';

// Importar rutas de analytics
import analyticsRoutes from './analytics.routes.js';

// Importar rutas
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import offerRoutes from './offer.routes.js';
import homeRoutes from './home.routes.js';
import explorerRoutes from './explorer.routes.js';
import hiringRoutes from './hiring.routes.js';
import profilePageRoutes from './profile-page.routes.js';
import portfolioRoutes from './portfolio.routes.js';
import companyRoutes from './company.routes.js';
import onboardingRoutes from './onboarding.routes.js';
import artistHierarchyRoutes from './artist-hierarchy.routes.js';
import documentsRoutes from './documents.routes.js';
import highlightPhotosRoutes from './highlight-photos.routes.js';
import { storage } from '../storage/index.js';

// Crear el enrutador
const router = Router();

// Extender el tipo RequestHandler para incluir los parámetros de ruta
type RouteHandler<T = any> = RequestHandler<Record<string, string>, any, T>;

// No hay rutas de prueba en producción

// Auth routes
router.use('/auth', authRoutes);

// API v1 routes
const v1 = Router();

// Rutas públicas
router.get('/v1/artists/featured', getFeaturedArtists);
router.get('/v1/artists', getAllArtists);
router.get('/v1/artists/:id', getArtistById);
router.get('/v1/events', getUpcomingEvents);
router.get('/v1/blog', getBlogRecentPosts);
// Listado de categorías
router.get('/v1/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (e) {
    console.error('Error fetching categories:', e);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

// Rutas protegidas (requieren autenticación)
const protectedRoutes = Router();
protectedRoutes.use(authMiddleware);

// Rutas de elementos destacados
v1.get('/featured', featuredController.getUserFeaturedItems as RouteHandler);
v1.get('/users/:userId/featured', featuredController.getUserFeaturedItems as RouteHandler);
v1.post('/featured', featuredController.createFeaturedItem as RouteHandler);
v1.put('/featured/:id', featuredController.updateFeaturedItem as RouteHandler);
v1.delete('/featured/:id', featuredController.deleteFeaturedItem as RouteHandler);

// Rutas de perfil (públicas eliminadas; usar protectedRoutes más abajo)

// Rutas de posts
v1.use('/posts', postRoutes);

// Rutas por páginas (estructura limpia por secciones de la app)
const pages = Router();
pages.use('/home', homeRoutes);
pages.use('/explorer', explorerRoutes);
pages.use('/hiring', hiringRoutes);
pages.use('/profile', profilePageRoutes);
v1.use('/pages', pages);

// Rutas de portafolio (perfil -> portfolio) protegidas
v1.use('/portfolio', authMiddleware, portfolioRoutes);

// Rutas de contratos y cotizaciones (protegidas)
v1.use('/contracts', authMiddleware, contractsRoutes);

// Rutas de preferencias (protegidas)
v1.use('/preferences', authMiddleware, preferencesRoutes);

// Rutas de empresas (protegidas)
v1.use('/companies', authMiddleware, companyRoutes);

// Rutas de onboarding (protegidas)
v1.use('/onboarding', onboardingRoutes);

// Rutas de actividad, notificaciones y progreso
v1.use('/activities', activityRoutes);
v1.use('/notifications', activityRoutes);
v1.use('/users', activityRoutes);
v1.use('/achievements', activityRoutes);
v1.use('/dashboard', activityRoutes);
v1.use('/recommendations', activityRoutes);

// Rutas de analytics
v1.use('/analytics', analyticsRoutes);

// Rutas de jerarquía de artistas (Disciplinas, Roles, Especializaciones, TADs, Stats)
v1.use('/', artistHierarchyRoutes);

// Rutas de documentos (protegidas)
v1.use('/documents', documentsRoutes);

// Rutas de fotos destacadas (highlight photos)
v1.use('/highlight-photos', highlightPhotosRoutes);

// Rutas de eventos
v1.post('/events', EventController.createEvent as RouteHandler);
v1.put('/events/:id', EventController.updateEvent as RouteHandler);
v1.post('/events/:id/cancel', EventController.cancelEvent as RouteHandler);
v1.get('/events/search', EventController.searchEvents as RouteHandler);

// Rutas de perfil protegidas
protectedRoutes.get('/profile', userController.getProfile as RouteHandler);
protectedRoutes.put('/profile', userController.updateProfile as RouteHandler);
protectedRoutes.patch('/profile/type', userController.updateUserType as RouteHandler);

// Rutas de artista (perfil del artista del usuario autenticado)
protectedRoutes.get('/artist/me', (async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const artists = await storage.getArtists({ userId });
    const first = artists[0];
    // Estructura: { artist, user, category }
    return res.json(first || null);
  } catch (e) {
    console.error('Error fetching my artist profile:', e);
    return res.status(500).json({ message: 'Error al obtener el perfil de artista' });
  }
}) as RouteHandler);

protectedRoutes.put('/artist/me', (async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const {
      artistName,
      categoryId,
      // Nueva estructura jerárquica
      disciplineId,
      roleId,
      specializationId,
      additionalTalents, // Array de discipline IDs (TADs)
      customStats, // Objeto { stat_key: value }
      // Campos legacy
      subcategories,
      tags,
      description,
      availability,
      isAvailable,
      stageName,
      gallery,
      pricePerHour,
      yearsOfExperience,
      portfolio,
    } = req.body || {};

    console.log('🔵 PUT /artist/me - req.body:', JSON.stringify({
      stageName,
      categoryId,
      disciplineId,
      roleId,
      specializationId,
      additionalTalents,
      customStats,
      tags,
      pricePerHour,
      yearsOfExperience,
    }, null, 2));

    // Saneamiento de inputs
    const safeCategoryId = (() => {
      if (typeof categoryId === 'number') {
        return Number.isFinite(categoryId) ? categoryId : undefined;
      }
      if (typeof categoryId === 'string') {
        const trimmed = categoryId.trim();
        if (!trimmed) return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    })();

    const safeDisciplineId = typeof disciplineId === 'number' ? disciplineId : undefined;
    const safeRoleId = typeof roleId === 'number' ? roleId : undefined;
    const safeSpecializationId = typeof specializationId === 'number' ? specializationId : undefined;
    const safeAdditionalTalents = Array.isArray(additionalTalents)
      ? additionalTalents.filter((t: any) => typeof t === 'number')
      : undefined;
    const safeCustomStats = customStats && typeof customStats === 'object' ? customStats : undefined;

    const safeGallery = Array.isArray(gallery)
      ? gallery
          .map((g: any) => (typeof g === 'string' ? g : (g?.url || g?.src)))
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      : undefined;

    // Buscar artista existente por userId
    const found = await storage.getArtists({ userId });
    const existing = found[0];

    // Normalizar payload parcial permitido
    const artistPayload: Partial<typeof import('../schema.js').artists.$inferInsert> = {
      artistName,
      stageName,
      categoryId: safeCategoryId,
      // Nueva estructura jerárquica
      disciplineId: safeDisciplineId,
      roleId: safeRoleId,
      specializationId: safeSpecializationId,
      additionalTalents: safeAdditionalTalents,
      customStats: safeCustomStats,
      // Campos legacy
      subcategories: Array.isArray(subcategories) ? subcategories : undefined,
      tags: Array.isArray(tags) ? tags : undefined,
      description: typeof description === 'string' ? description : undefined,
      availability: availability && typeof availability === 'object' ? availability : undefined,
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : undefined,
      gallery: safeGallery,
      pricePerHour: typeof pricePerHour === 'number' ? pricePerHour.toString() : undefined,
      yearsOfExperience: typeof yearsOfExperience === 'number' ? yearsOfExperience : undefined,
      portfolio: portfolio && typeof portfolio === 'object' ? portfolio : undefined,
    };

    console.log('🟢 artistPayload procesado:', JSON.stringify({
      stageName: artistPayload.stageName,
      categoryId: artistPayload.categoryId,
      disciplineId: artistPayload.disciplineId,
      roleId: artistPayload.roleId,
      specializationId: artistPayload.specializationId,
      additionalTalents: artistPayload.additionalTalents,
      safeCategoryId,
      tags: artistPayload.tags,
      pricePerHour: artistPayload.pricePerHour,
    }, null, 2));

    // Crear si no existe
    if (!existing) {
      const created = await storage.createArtist({
        userId,
        artistName: artistPayload.artistName || 'Sin título',
        categoryId: artistPayload.categoryId ?? null,
        // Nueva jerarquía
        disciplineId: artistPayload.disciplineId ?? null,
        roleId: artistPayload.roleId ?? null,
        specializationId: artistPayload.specializationId ?? null,
        additionalTalents: artistPayload.additionalTalents as any,
        customStats: artistPayload.customStats as any,
        // Campos adicionales opcionales
        description: artistPayload.description,
        subcategories: artistPayload.subcategories as any,
        tags: artistPayload.tags as any,
        availability: artistPayload.availability as any,
        isAvailable: artistPayload.isAvailable as any,
        stageName: artistPayload.stageName as any,
        gallery: artistPayload.gallery as any,
        pricePerHour: artistPayload.pricePerHour as any,
        yearsOfExperience: artistPayload.yearsOfExperience as any,
        portfolio: artistPayload.portfolio as any,
      } as any);
      return res.json(created);
    }

    // Actualizar si existe
    const updated = await storage.updateArtist(existing.id, artistPayload as any);
    return res.json(updated);
  } catch (e) {
    console.error('Error updating my artist profile:', e);
    return res.status(500).json({ message: 'Error al actualizar el perfil de artista' });
  }
}) as RouteHandler);

// Rutas de ofertas
v1.post('/offers', offerController.create as RouteHandler);
v1.get('/offers', offerController.getAll as RouteHandler);
v1.get('/offers/:id', offerController.getById as RouteHandler);
v1.patch('/offers/:id/status', offerController.updateStatus as RouteHandler);

// Rutas de perfiles
v1.get('/profiles', profileController.getAll as RouteHandler);
v1.get('/profiles/:id', profileController.getById as RouteHandler);
v1.get('/profiles/:id/reviews', profileController.getReviews as RouteHandler);

// Montar rutas protegidas en v1
v1.use(protectedRoutes);

// Rutas públicas de usuario (después de las protegidas para evitar conflictos)
v1.get('/users/:userId', userController.getPublicProfile as RouteHandler);

// Usar rutas de la API v1 con prefijo /api/v1 (único punto de entrada)
router.use('/v1', v1);

export default router;
