import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';

// Importar controladores de artista
import { 
  getFeatured as getFeaturedArtists, 
  getAll as getAllArtists, 
  getById as getArtistById 
} from '../controllers/artist.controller.js';

// Los controladores de eventos ahora se importan desde el módulo events/

// Importar controladores del blog
import { getRecentPosts as getBlogRecentPosts } from '../controllers/blog.controller.js';

// Importar controladores de usuario
import { userController } from '../controllers/user.controller.js';

// Importar controladores de elementos destacados
import * as featuredController from '../controllers/featured.controller.js';

// Importar controlador del dashboard
import { dashboardController } from '../controllers/dashboard.controller.js';

// Importar rutas del dashboard (comentado - conflicto con activityRoutes que ya maneja /dashboard/stats)
// import dashboardRoutes from './dashboard.routes.js';

// Importar controladores de ofertas
import { offerController } from '../controllers/offer.controller.js';

// Importar controladores de perfiles
import { profileController } from '../controllers/profile.controller.js';

// Importar rutas del blog
import blogRoutes from './blog.routes.js';

// Importar rutas sociales (usuarios sugeridos, tendencias, follows)
import socialRoutes from './social.routes.js';

// Importar rutas de elementos guardados
import savedItemsRoutes from './saved-items.routes.js';

// Importar rutas de contratos y cotizaciones
import contractsRoutes from './contracts.routes.js';

// Importar rutas de preferencias
import preferencesRoutes from './preferences.routes.js';

// DISABLED: Importar rutas de actividad - Missing service dependencies
// import activityRoutes from './activity.routes.js';

// DISABLED: Importar rutas de analytics - Missing service dependencies
// import analyticsRoutes from './analytics.routes.js';

// Importar rutas de estadísticas
import statsRoutes from './stats.routes.js';

// Importar rutas de recomendaciones
import recommendationsRoutes from './recommendations.routes.js';

// Importar rutas de cotizaciones
import quotationsRoutes from './quotations.routes.js';

// Importar rutas de pagos
import paymentsRoutes from './payments.routes.js';

// Importar rutas de eventos
import eventsRoutes from './events.routes.js';

// Importar rutas de órdenes
import orderRoutes from './orders.routes.js';

// DISABLED: Importar rutas de carrito de compras - Controller has errors
// import cartRoutes from './cart.routes.js';

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
// DISABLED: import artistHierarchyRoutes from './artist-hierarchy.routes.js'; - Controller has complex Drizzle errors
import documentsRoutes from './documents.routes.js';
import highlightPhotosRoutes from './highlight-photos.routes.js';
import servicesRoutes from './services.routes.js';
import storeRoutes from './store.routes.js';
import campaignsRoutes from './campaigns.routes.js';
import bookingsRoutes from './bookings.routes.js';
import venuesRoutes from './venues.routes.js';
import favoritesRoutes from './favorites.routes.js';
import dislikedItemsRoutes from './dislikedItems.routes.js';
import uploadRoutes from './upload.routes.js';
import collectionsRoutes from './collections.routes.js';
import { venuesController } from '../controllers/venues.controller.js';
import { storage } from '../storage/index.js';

// Crear el enrutador
const router = Router();

// Extender el tipo RequestHandler para incluir los parámetros de ruta
type RouteHandler<T = any> = RequestHandler<Record<string, string>, any, T>;

// No hay rutas de prueba en producción

// Auth routes
router.use('/auth', authRoutes);

// Messages routes (root: /api/messages/*)
router.get('/messages', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const messages = await storage.getUserMessages(userId);
    return res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ message: 'Error fetching messages' });
  }
});

router.get('/messages/conversation/:userId', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId1 = req.user?.id;
    const userId2 = req.params.userId;
    if (!userId1) return res.status(401).json({ message: 'No autenticado' });
    if (!userId2) return res.status(400).json({ message: 'userId requerido' });
    const conversation = await storage.getConversation(userId1, userId2);
    return res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ message: 'Failed to fetch conversation' });
  }
});

router.get('/messages/threads', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const allMessages = await storage.getUserMessages(userId);

    const threadsMap = new Map<string, {
      userId: string;
      lastMessageId: number;
      lastMessageText: string;
      lastMessageAt: Date | null;
      otherUser: any;
      unreadCount: number;
    }>();

    for (const m of allMessages as any[]) {
      const otherUserId = m.senderId === userId ? m.receiverId : m.senderId;
      const otherUser = m.senderId === userId ? m.receiver : m.sender;

      const existing = threadsMap.get(otherUserId);
      const isUnreadForMe = m.receiverId === userId && !m.isRead;
      const unreadInc = isUnreadForMe ? 1 : 0;

      if (!existing) {
        threadsMap.set(otherUserId, {
          userId: otherUserId,
          lastMessageId: m.id,
          lastMessageText: m.content,
          lastMessageAt: m.createdAt || null,
          otherUser,
          unreadCount: unreadInc,
        });
        continue;
      }

      const prevDate = existing.lastMessageAt ? new Date(existing.lastMessageAt).getTime() : 0;
      const curDate = m.createdAt ? new Date(m.createdAt).getTime() : 0;

      if (curDate >= prevDate) {
        existing.lastMessageId = m.id;
        existing.lastMessageText = m.content;
        existing.lastMessageAt = m.createdAt || null;
        existing.otherUser = otherUser;
      }
      existing.unreadCount += unreadInc;
    }

    const threads = Array.from(threadsMap.values())
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      })
      .map((t) => ({
        id: t.userId,
        otherUser: t.otherUser,
        lastMessage: {
          id: t.lastMessageId,
          text: t.lastMessageText,
          createdAt: t.lastMessageAt,
        },
        unreadCount: t.unreadCount,
      }));

    return res.json(threads);
  } catch (error) {
    console.error('Error fetching message threads:', error);
    return res.status(500).json({ message: 'Failed to fetch message threads' });
  }
});

router.post('/messages', authMiddleware, async (req: any, res: Response) => {
  try {
    const senderId = req.user?.id;
    const receiverId = req.body?.receiverId;
    const content = req.body?.content;

    if (!senderId) return res.status(401).json({ message: 'No autenticado' });
    if (!receiverId || typeof receiverId !== 'string') return res.status(400).json({ message: 'receiverId requerido' });
    if (!content || typeof content !== 'string') return res.status(400).json({ message: 'content requerido' });

    const message = await storage.sendMessage({ senderId, receiverId, content, isRead: false });
    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(400).json({ message: 'Failed to send message' });
  }
});

// API v1 routes
const v1 = Router();

// Rutas públicas
router.get('/v1/artists/featured', getFeaturedArtists);
router.get('/v1/artists', getAllArtists);
router.get('/v1/artists/:id', getArtistById);

// Ruta pública de venues (explorador) - DEBE estar en router, no en v1
router.get('/v1/venues', venuesController.getAllVenues);
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

// Rutas públicas (sin autenticación)
v1.get('/profile/public/:id', profileController.getPublic as RouteHandler); // Ruta pública
v1.get('/users/:userId', userController.getPublicProfile as RouteHandler); // Ruta pública
// La ruta /portfolio/user/:userId/featured es manejada por portfolioRoutes montado abajo

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

// Rutas del blog
v1.use('/posts', blogRoutes);

// Rutas sociales
v1.use('/', socialRoutes);

// Rutas de explorer (públicas - antes del middleware)
v1.use('/explorer', explorerRoutes);

// Rutas públicas de búsqueda
v1.get('/users/search', userController.searchUsers as RouteHandler);

// Rutas por páginas (estructura limpia por secciones de la app)
const pages = Router();
pages.use('/home', homeRoutes);
pages.use('/hiring', hiringRoutes);
pages.use('/profile', profilePageRoutes);
v1.use('/pages', pages);

// Rutas de portafolio (protegidas)
v1.use('/portfolio', authMiddleware, portfolioRoutes);

// Rutas de contratos y cotizaciones (protegidas)
v1.use('/contracts', authMiddleware, contractsRoutes);

// Rutas de preferencias (protegidas)
v1.use('/preferences', authMiddleware, preferencesRoutes);

// Rutas de empresas (protegidas)
v1.use('/companies', authMiddleware, companyRoutes);

// Rutas de onboarding (protegidas)
v1.use('/onboarding', onboardingRoutes);

// DISABLED: Rutas de actividad, notificaciones y progreso - Missing service dependencies
// v1.use('/activities', activityRoutes);
// v1.use('/notifications', activityRoutes); // REMOVIDO: Las rutas de notificaciones tienen el prefijo completo
// v1.use('/achievements', activityRoutes);
// v1.use('/dashboard', activityRoutes);
// v1.use('/activity', activityRoutes);
// NO montar activityRoutes en raíz porque captura todas las rutas
// Las rutas como /users/:userId/follow, /notifications, /profile/* están definidas con path completo en activityRoutes
// y se acceden directamente sin prefijo adicional

// DISABLED: Rutas de analytics - Missing service dependencies
// v1.use('/analytics', analyticsRoutes);

// Rutas de recomendaciones
v1.use('/recommendations', recommendationsRoutes);

// Rutas de cotizaciones
v1.use('/quotations', quotationsRoutes);

// Rutas de pagos (protegidas - el middleware está en el router)
v1.use('/payments', paymentsRoutes);

// Rutas de hiring (ofertas públicas de trabajo)
v1.use('/hiring', hiringRoutes);

// Rutas de eventos
v1.use('/events', eventsRoutes);

// Rutas de órdenes (protegidas)
v1.use('', authMiddleware, orderRoutes);

// DISABLED: Rutas de carrito de compras (protegidas) - Controller has errors
// v1.use('', cartRoutes);

// Rutas de estadísticas
v1.use(statsRoutes);

// DISABLED: Rutas de jerarquía de artistas (Disciplinas, Roles, Especializaciones, TADs, Stats)
// v1.use('/', artistHierarchyRoutes);

// Rutas de documentos (protegidas)
v1.use('/documents', documentsRoutes);

// Rutas de fotos destacadas (highlight photos)
v1.use('/highlight-photos', highlightPhotosRoutes);

// Rutas de blog (parcialmente protegidas)
v1.use('/blog', blogRoutes);

// Rutas de servicios (parcialmente protegidas)
v1.use('/services', servicesRoutes);

// Rutas de tienda/productos (parcialmente protegidas)
v1.use('/store', storeRoutes);

// Rutas de campañas (protegidas)
v1.use('/campaigns', campaignsRoutes);

// Rutas de reservas/bookings (protegidas)
v1.use('/bookings', bookingsRoutes);

// Rutas de venues/espacios (protegidas)
v1.use('/venues', authMiddleware, venuesRoutes);

// Rutas de favoritos (protegidas)
v1.use('/favorites', authMiddleware, favoritesRoutes);

// Rutas de colecciones e inspiraciones (protegidas)
v1.use('/collections', collectionsRoutes);

// Rutas de items rechazados / "no me interesa" (protegidas)
v1.use('/disliked-items', authMiddleware, dislikedItemsRoutes);

// Rutas de subida de archivos (protegidas)
v1.use('/upload', uploadRoutes);

// Nota: Las rutas de eventos están definidas en events.routes.ts
// Las rutas duplicadas fueron removidas para evitar conflictos

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
      // Información académica y profesional adicional
      education,
      languages,
      licenses,
      linkedAccounts,
      workExperience,
      // Información profesional
      experience,
      artistType,
      travelAvailability,
      travelDistance,
      // Precios
      hourlyRate,
      pricingType,
      priceRange,
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
    const existing: any = found[0];

    console.log('🔍 Buscando artista existente:', { userId, found: found.length, existing: !!existing, existingId: existing?.artist?.id });

    if (!existing || !existing.artist) {
      console.log('❌ No se encontró perfil de artista para el usuario:', userId);
      return res.status(404).json({ message: 'Perfil de artista no encontrado' });
    }

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
      // Información académica y profesional adicional
      education: Array.isArray(education) ? education : undefined,
      languages: Array.isArray(languages) ? languages : undefined,
      licenses: Array.isArray(licenses) ? licenses : undefined,
      linkedAccounts: linkedAccounts && typeof linkedAccounts === 'object' ? linkedAccounts : undefined,
      workExperience: Array.isArray(workExperience) ? workExperience : undefined,
      // Información profesional
      experience: typeof experience === 'number' ? experience : undefined,
      artistType: artistType ? artistType : undefined,
      travelAvailability: typeof travelAvailability === 'boolean' ? travelAvailability : undefined,
      travelDistance: typeof travelDistance === 'number' ? travelDistance : undefined,
      // Precios
      hourlyRate: typeof hourlyRate === 'number' ? hourlyRate.toString() : undefined,
      pricingType: pricingType ? pricingType : undefined,
      priceRange: priceRange && typeof priceRange === 'object' ? priceRange : undefined,
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
      workExperience: artistPayload.workExperience,
      education: artistPayload.education,
      languages: artistPayload.languages,
      hourlyRate: artistPayload.hourlyRate,
      pricingType: artistPayload.pricingType,
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
    // Limpiar campos undefined del payload (Postgres no acepta undefined)
    const cleanPayload = Object.fromEntries(
      Object.entries(artistPayload).filter(([_, v]) => v !== undefined)
    );

    console.log('🧹 cleanPayload después de filtrar undefined:', JSON.stringify(cleanPayload, null, 2));
    console.log('🔑 cleanPayload keys:', Object.keys(cleanPayload));

    const updated = await storage.updateArtist(existing.artist.id, cleanPayload as any);
    return res.json(updated);
  } catch (e: any) {
    console.error('Error updating my artist profile:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    const errorStack = e instanceof Error ? e.stack : 'No stack trace available';
    console.error('Detailed error:', {
        message: errorMessage,
        stack: errorStack,
        body: req.body
    });
    return res.status(500).json({
        message: 'Error al actualizar el perfil de artista',
        error: {
            message: errorMessage,
            stack: errorStack
        }
    });
  }
}) as RouteHandler);

// Rutas del dashboard (comentado - conflicto con activityRoutes que ya maneja /dashboard/stats)
// v1.use('/dashboard', dashboardRoutes);

// Ruta específica para estadísticas del dashboard
v1.get('/dashboard/stats', authMiddleware, (dashboardController as any).getStats.bind(dashboardController));

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

// DISABLED: Montar activityRoutes sin prefijo para rutas con paths completos
// (como /users/:userId/follow, /notifications, /profile/*, /recommendations/*)
// Se monta al final para no interferir con rutas más específicas definidas arriba
// v1.use(activityRoutes);

// Usar rutas de la API v1 con prefijo /api/v1 (único punto de entrada)
router.use('/v1', v1);

export default router;
