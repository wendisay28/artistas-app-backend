
import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

// Importar controladores de artista
import { 
  getFeatured as getFeaturedArtists, 
  getAll as getAllArtists, 
  getById as getArtistById 
} from '../controllers/artist.controller';

// Importar controladores de eventos
import EventController, { getUpcomingEvents } from '../controllers/event.controller';

// Importar controladores del blog
import { getRecentPosts as getBlogRecentPosts } from '../controllers/blog.controller';

// Importar controladores de usuario
import { userController } from '../controllers/user.controller';

// Importar controladores de elementos destacados
import * as featuredController from '../controllers/featured.controller';

// Importar rutas
import firebaseTestRoutes from './firebase-test';
import storageTestRoutes from './storage-test';
import authRoutes from './auth.routes';

// Crear el enrutador
const router = Router();

// Extender el tipo RequestHandler para incluir los parámetros de ruta
type RouteHandler<T = any> = RequestHandler<Record<string, string>, any, T>;

// Firebase test routes
router.use('/firebase', firebaseTestRoutes);

// Storage routes (protegidas por autenticación)
router.use('/storage', authMiddleware, storageTestRoutes);

// Auth routes
router.use('/auth', authRoutes);

// API v1 routes
const v1 = Router();

// Rutas públicas
v1.get('/artists', getAllArtists as RouteHandler);
v1.get('/artists/featured', getFeaturedArtists as RouteHandler);
v1.get('/artists/:id', getArtistById as RouteHandler);
v1.get('/events', getUpcomingEvents as RouteHandler);
v1.get('/blog', getBlogRecentPosts as RouteHandler);

// Rutas protegidas (requieren autenticación)
const protectedRoutes = Router();
protectedRoutes.use(authMiddleware);

// Aplicar middleware de autenticación a todas las rutas protegidas
v1.use(authMiddleware);

// Rutas de elementos destacados
v1.get('/featured', featuredController.getUserFeaturedItems as RouteHandler);
v1.get('/users/:userId/featured', featuredController.getUserFeaturedItems as RouteHandler);
v1.post('/featured', featuredController.createFeaturedItem as RouteHandler);
v1.put('/featured/:id', featuredController.updateFeaturedItem as RouteHandler);
v1.delete('/featured/:id', featuredController.deleteFeaturedItem as RouteHandler);

// Rutas de perfil
v1.get('/profile', userController.getProfile as RouteHandler);
v1.put('/profile', userController.updateProfile as RouteHandler);
v1.get('/profile/:username', userController.getPublicProfile as RouteHandler);

// Rutas de eventos
v1.post('/events', EventController.createEvent as RouteHandler);
v1.put('/events/:id', EventController.updateEvent as RouteHandler);
v1.post('/events/:id/cancel', EventController.cancelEvent as RouteHandler);
v1.get('/events/search', EventController.searchEvents as RouteHandler);

// Rutas de perfil protegidas
protectedRoutes.get('/profile', userController.getProfile as RouteHandler);
protectedRoutes.put('/profile', userController.updateProfile as RouteHandler);
protectedRoutes.patch('/profile/type', userController.updateUserType as RouteHandler);

// Montar rutas protegidas en v1
v1.use(protectedRoutes);

// Rutas públicas de usuario (después de las protegidas para evitar conflictos)
v1.get('/users/:userId', userController.getPublicProfile as RouteHandler);

// Usar rutas de la API v1 con prefijo /api/v1
router.use('/v1', v1);

export default router;
