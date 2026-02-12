import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { EventController } from '../controllers/events/index.js';
import ticketTypesRoutes from './ticketTypes.routes.js';

const eventsRoutes = Router();

/**
 * GET /api/v1/events/search
 * Buscar eventos por nombre/descripción
 */
import ExplorerController from '../controllers/explorer.controller.js';
eventsRoutes.get('/search', ExplorerController.searchEvents);

/**
 * GET /api/v1/events
 * Obtener todos los eventos públicos
 */
// Obtener todos los eventos públicos
eventsRoutes.get('/', EventController.searchEvents);

/**
 * GET /api/v1/events/upcoming
 * Obtener próximos eventos
 */
eventsRoutes.get('/upcoming', EventController.getUpcomingEvents);

/**
 * GET /api/v1/events/company/:companyId
 * Obtener eventos de una empresa (público)
 */
eventsRoutes.get('/company/:companyId', EventController.getCompanyEvents);

/**
 * GET /api/v1/events/my
 * Obtener eventos del usuario autenticado (requiere auth)
 */
eventsRoutes.get('/my', authMiddleware, EventController.getMyEvents);

/**
 * GET /api/v1/events/registered
 * Obtener eventos donde el usuario está registrado - próximos (requiere auth)
 */
eventsRoutes.get('/registered', authMiddleware, EventController.getRegisteredEvents);

/**
 * GET /api/v1/events/attended
 * Obtener eventos a los que el usuario asistió (requiere auth)
 */
eventsRoutes.get('/attended', authMiddleware, EventController.getAttendedEvents);

/**
 * GET /api/v1/events/:id
 * Obtener detalle de un evento
 */
eventsRoutes.get('/:id', EventController.getEventById);

/**
 * POST /api/v1/events
 * Crear un nuevo evento (requiere auth)
 */
eventsRoutes.post('/', authMiddleware, EventController.createEvent);

/**
 * PUT /api/v1/events/:id
 * Actualizar un evento (requiere auth)
 */
eventsRoutes.put('/:id', authMiddleware, EventController.updateEvent);

/**
 * PATCH /api/v1/events/:id/cancel
 * Cancelar un evento (requiere auth)
 */
eventsRoutes.patch('/:id/cancel', authMiddleware, EventController.cancelEvent);

/**
 * DELETE /api/v1/events/:id
 * Eliminar un evento permanentemente (requiere auth, solo organizador, sin asistentes aprobados)
 */
eventsRoutes.delete('/:id', authMiddleware, EventController.deleteEvent);

// ========== GESTIÓN DE ASISTENTES (Luma-style) ==========

/**
 * POST /api/v1/events/:eventId/register
 * Registrarse para un evento (requiere auth)
 */
eventsRoutes.post('/:eventId/register', authMiddleware, EventController.registerForEvent);

/**
 * DELETE /api/v1/events/:eventId/unregister
 * Cancelar registro para un evento (requiere auth)
 */
eventsRoutes.delete('/:eventId/unregister', authMiddleware, EventController.unregisterFromEvent);

/**
 * GET /api/v1/events/:eventId/my-registration
 * Obtener mi registro para un evento (requiere auth)
 */
eventsRoutes.get('/:eventId/my-registration', authMiddleware, EventController.getMyRegistration);

/**
 * GET /api/v1/events/:eventId/attendees
 * Obtener todos los asistentes de un evento (solo organizador, requiere auth)
 */
eventsRoutes.get('/:eventId/attendees', authMiddleware, EventController.getEventAttendees);

/**
 * GET /api/v1/events/:eventId/attendees/stats
 * Obtener estadísticas de asistentes (público)
 */
eventsRoutes.get('/:eventId/attendees/stats', EventController.getAttendeeStats);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/approve
 * Aprobar un asistente (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/approve', authMiddleware, EventController.approveAttendee);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/reject
 * Rechazar un asistente (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/reject', authMiddleware, EventController.rejectAttendee);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/move-to-waitlist
 * Mover a lista de espera (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/move-to-waitlist', authMiddleware, EventController.moveToWaitlist);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/move-from-waitlist
 * Mover desde lista de espera a aprobado (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/move-from-waitlist', authMiddleware, EventController.moveFromWaitlist);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/checkin
 * Hacer check-in de un asistente (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/checkin', authMiddleware, EventController.checkInAttendee);

/**
 * DELETE /api/v1/events/:eventId/attendees/:attendeeId/checkin
 * Deshacer check-in de un asistente (solo organizador, requiere auth)
 */
eventsRoutes.delete('/:eventId/attendees/:attendeeId/checkin', authMiddleware, EventController.undoCheckIn);

/**
 * /api/v1/events/:eventId/ticket-types
 * Rutas de tipos de entradas/boletos para eventos
 */
eventsRoutes.use('/:eventId/ticket-types', ticketTypesRoutes);

// ========== RESEÑAS ==========

/**
 * POST /api/v1/events/:eventId/reviews
 * Crear una reseña para un evento (requiere auth y haber asistido)
 */
eventsRoutes.post('/:eventId/reviews', authMiddleware, EventController.createReview);

/**
 * GET /api/v1/events/:eventId/reviews
 * Obtener todas las reseñas de un evento (público)
 */
eventsRoutes.get('/:eventId/reviews', EventController.getEventReviews);

/**
 * POST /api/v1/events/:eventId/reviews/:reviewId/response
 * Responder a una reseña (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/reviews/:reviewId/response', authMiddleware, EventController.respondToReview);

// ========== CERTIFICADOS ==========

/**
 * GET /api/v1/events/:eventId/certificate
 * Generar/obtener certificado de asistencia (requiere auth y haber asistido)
 */
eventsRoutes.get('/:eventId/certificate', authMiddleware, EventController.generateCertificate);

export default eventsRoutes;
