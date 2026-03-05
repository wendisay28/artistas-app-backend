import { Router } from 'express';
import ExplorerController from '../controllers/explorer.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
// Page-scoped router: Explorar (Explorer)
const explorerRoutes = Router();
// GET /api/v1/explorer - Obtener todos los datos del explorador
explorerRoutes.get('/', ExplorerController.getAll);
// GET /api/v1/explorer/artists/search - Buscar artistas
explorerRoutes.get('/artists/search', ExplorerController.searchArtists);
// GET /api/v1/explorer/artists - Obtener artistas
explorerRoutes.get('/artists', ExplorerController.getArtists);
// GET /api/v1/explorer/events - Obtener eventos
explorerRoutes.get('/events', ExplorerController.getEvents);
// GET /api/v1/explorer/venues - Obtener lugares
explorerRoutes.get('/venues', ExplorerController.getVenues);
// GET /api/v1/explorer/services - Obtener servicios
explorerRoutes.get('/services', ExplorerController.getServices);
// GET /api/v1/explorer/artworks - Obtener obras de arte
explorerRoutes.get('/artworks', ExplorerController.getArtworks);
// Rutas protegidas - Servicios del usuario
explorerRoutes.get('/services/me', authMiddleware, ExplorerController.getUserServices);
explorerRoutes.post('/services', authMiddleware, ExplorerController.createService);
explorerRoutes.patch('/services/:id', authMiddleware, ExplorerController.updateService);
explorerRoutes.delete('/services/:id', authMiddleware, ExplorerController.deleteService);
// Rutas públicas de servicios
explorerRoutes.get('/services/user/:userId', ExplorerController.getUserServicesById);
explorerRoutes.get('/services/:id', ExplorerController.getServiceById);
// Rutas protegidas - Obras de arte del usuario
explorerRoutes.get('/artworks/me', authMiddleware, ExplorerController.getUserArtworks);
explorerRoutes.post('/artworks', authMiddleware, ExplorerController.createArtwork);
explorerRoutes.patch('/artworks/:id', authMiddleware, ExplorerController.updateArtwork);
explorerRoutes.delete('/artworks/:id', authMiddleware, ExplorerController.deleteArtwork);
export default explorerRoutes;
