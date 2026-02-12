import { Request, Response } from 'express';
import { EventService } from './event.service.js';
import { CreateEventInput, UpdateEventInput, EventFilterOptions } from './event.types.js';
import { createEventSchema, updateEventSchema } from './event.validations.js';
import { CertificateService } from '../../services/certificate.service.js';

/**
 * Controlador de eventos - Maneja las peticiones HTTP
 */
class EventController {
  /**
   * Obtiene un evento por su ID
   */
  static async getEventById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventId = parseInt(id, 10);
      const userId = (req as any).user?.id; // Usuario autenticado (opcional)

      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'ID de evento no válido' });
      }

      const event = await EventService.getEventById(eventId, userId);

      if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      // Formatear respuesta con organizador mapeado (solo nombre y avatar)
      const organizer = event.organizer ? {
        id: event.organizer.id,
        displayName: event.organizer.displayName,
        firstName: event.organizer.firstName,
        lastName: event.organizer.lastName,
        profileImageUrl: event.organizer.profileImageUrl,
        isVerified: event.organizer.isVerified,
        userType: event.organizer.userType,
        // Campos mapeados para compatibilidad con frontend
        name: event.organizer.displayName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 'Organizador',
        avatar: event.organizer.profileImageUrl || '/images/default-avatar.png',
        verified: event.organizer.isVerified || false,
        // Estadísticas del organizador (se pueden calcular después)
        eventsCount: 0,
        rating: 0,
      } : null;

      // Formatear agenda para el frontend
      const agenda = event.agenda?.map((item: any) => ({
        time: item.startTime ? new Date(item.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
        title: item.title,
        description: item.description,
        speaker: item.speakerName ? {
          name: item.speakerName,
          title: item.speakerTitle,
          image: item.speakerImage,
        } : null,
      })) || [];

      // Formatear reseñas para el frontend
      const reviews = event.reviews?.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        organizerResponse: review.organizerResponse,
        user: review.user ? {
          id: review.user.id,
          name: review.user.displayName || `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim(),
          avatar: review.user.profileImageUrl || '/images/default-avatar.png',
        } : null,
      })) || [];

      const response = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        shortDescription: event.shortDescription,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        locationType: event.locationType,
        address: event.address,
        city: event.city,
        state: event.state,
        country: event.country,
        coordinates: event.coordinates,
        onlineEventUrl: event.onlineEventUrl,
        venueName: event.venueName,
        venueDescription: event.venueDescription,
        isFree: event.isFree,
        ticketPrice: event.ticketPrice,
        ticketUrl: event.ticketUrl,
        capacity: event.capacity,
        availableTickets: event.availableTickets,
        featuredImage: event.featuredImage,
        gallery: event.gallery || [],
        videoUrl: event.videoUrl,
        status: event.status,
        isFeatured: event.isFeatured,
        isRecurring: event.isRecurring,
        recurrencePattern: event.recurrencePattern,
        categoryId: event.categoryId,
        subcategories: event.subcategories || [],
        tags: event.tags || [],
        eventType: event.eventType,
        viewCount: event.viewCount,
        saveCount: event.saveCount,
        shareCount: event.shareCount,
        requiresApproval: event.requiresApproval,
        enableWaitlist: event.enableWaitlist,
        // Reseñas y rating
        rating: event.reviewStats?.average || 0,
        reviewCount: event.reviewStats?.count || 0,
        reviewStats: event.reviewStats,
        reviews: reviews,
        // Agenda
        agenda: agenda,
        // Estado del usuario actual
        userRegistration: event.userRegistration,
        attendeeCount: event.attendeeCount,
        // Organizador
        organizer: organizer,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener el evento:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene los eventos de una empresa (público)
   */
  static async getCompanyEvents(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const id = parseInt(companyId, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de empresa no válido' });
      }

      const companyEvents = await EventService.getCompanyEvents(id);

      return res.status(200).json({
        success: true,
        data: companyEvents,
      });
    } catch (error) {
      console.error('Error al obtener eventos de empresa:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene los eventos del usuario autenticado
   */
  static async getMyEvents(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const userId = req.user.id;
      const userEvents = await EventService.getMyEvents(userId);

      return res.status(200).json({
        success: true,
        data: userEvents
      });
    } catch (error) {
      console.error('Error al obtener mis eventos:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Crea un nuevo evento
   */
  static async createEvent(req: Request, res: Response) {
    console.log('=== Iniciando creación de evento ===');

    try {
      // Verificar autenticación
      if (!req.user) {
        console.error('Intento de crear evento sin autenticación');
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: 'Debes iniciar sesión para crear un evento',
          code: 'UNAUTHORIZED'
        });
      }

      const eventData: CreateEventInput = req.body;
      const userId = req.user.id;

      console.log(`✅ Usuario autenticado: ${userId}`);

      // Validar datos de entrada
      const validationResult = createEventSchema.safeParse(eventData);
      if (!validationResult.success) {
        console.error('❌ Error de validación:', validationResult.error.issues);
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          message: 'Por favor, revisa los datos del evento',
          errors: validationResult.error.issues,
          code: 'VALIDATION_ERROR'
        });
      }

      console.log('✅ Validación de datos exitosa');

      // Crear evento usando el servicio
      const newEvent = await EventService.createEvent(eventData, userId);

      console.log('✅ Evento creado exitosamente:', newEvent.id);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: newEvent,
        code: 'EVENT_CREATED'
      });

    } catch (error: any) {
      console.error('❌ Error en createEvent:', error);

      if (res.headersSent) {
        return;
      }

      // Manejar errores específicos
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Conflicto',
          message: 'Ya existe un evento con un identificador similar',
          code: 'DUPLICATE_ENTRY'
        });
      }

      if (error.code?.startsWith('23')) {
        return res.status(500).json({
          success: false,
          error: 'Error de base de datos',
          message: 'Ocurrió un error al procesar la solicitud',
          code: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear el evento',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualiza un evento existente
   */
  static async updateEvent(req: Request, res: Response) {
    console.log('=== Iniciando actualización de evento ===');

    try {
      // Verificar autenticación
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: 'Debes iniciar sesión para actualizar un evento',
          code: 'UNAUTHORIZED'
        });
      }

      const { id } = req.params;
      const eventId = parseInt(id, 10);
      const userId = req.user.id;
      const eventData: UpdateEventInput = req.body;

      // Validar ID
      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de evento no válido',
          code: 'INVALID_EVENT_ID'
        });
      }

      // Validar datos
      const validationResult = updateEventSchema.safeParse({ ...eventData, id: eventId });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          message: 'Por favor, revisa los datos del evento',
          errors: validationResult.error.issues,
          code: 'VALIDATION_ERROR'
        });
      }

      // Actualizar usando el servicio
      const updatedEvent = await EventService.updateEvent(eventId, eventData, userId);

      console.log('✅ Evento actualizado correctamente');

      return res.json({
        success: true,
        data: updatedEvent,
        message: 'Evento actualizado correctamente',
        code: 'EVENT_UPDATED'
      });

    } catch (error: any) {
      console.error('❌ Error al actualizar el evento:', error);

      if (res.headersSent) {
        return;
      }

      // Manejar errores del servicio
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado',
          code: 'EVENT_NOT_FOUND'
        });
      }

      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          error: 'No autorizado',
          message: 'Solo el organizador del evento puede actualizarlo',
          code: 'FORBIDDEN'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el evento',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancela un evento
   */
  static async cancelEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: 'Debes iniciar sesión para cancelar un evento',
          code: 'UNAUTHORIZED'
        });
      }

      const eventId = parseInt(id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de evento no válido',
          code: 'INVALID_EVENT_ID'
        });
      }

      // Cancelar usando el servicio
      const cancelledEvent = await EventService.cancelEvent(eventId, userId);

      return res.status(200).json({
        success: true,
        message: 'Evento cancelado exitosamente',
        data: cancelledEvent
      });

    } catch (error: any) {
      console.error('Error al cancelar el evento:', error);

      // Manejar errores del servicio
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado',
          code: 'EVENT_NOT_FOUND'
        });
      }

      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          error: 'No autorizado',
          message: 'Solo el organizador puede cancelar este evento',
          code: 'FORBIDDEN'
        });
      }

      if (error.message === 'ALREADY_CANCELLED') {
        return res.status(400).json({
          success: false,
          error: 'El evento ya está cancelado',
          code: 'ALREADY_CANCELLED'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo cancelar el evento',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Elimina un evento permanentemente
   */
  static async deleteEvent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: 'Debes iniciar sesión para eliminar un evento',
          code: 'UNAUTHORIZED'
        });
      }

      const { id } = req.params;
      const eventId = parseInt(id, 10);
      const userId = req.user.id;

      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de evento no válido',
          code: 'INVALID_EVENT_ID'
        });
      }

      const deletedEvent = await EventService.deleteEvent(eventId, userId);

      return res.status(200).json({
        success: true,
        message: 'Evento eliminado exitosamente',
        data: deletedEvent
      });

    } catch (error: any) {
      console.error('Error al eliminar el evento:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado',
          code: 'EVENT_NOT_FOUND'
        });
      }

      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          error: 'No autorizado',
          message: 'Solo el organizador del evento puede eliminarlo',
          code: 'FORBIDDEN'
        });
      }

      if (error.message === 'HAS_ATTENDEES') {
        return res.status(400).json({
          success: false,
          error: 'No se puede eliminar',
          message: 'No puedes eliminar un evento que tiene asistentes aprobados o con check-in. Cancela el evento en su lugar.',
          code: 'HAS_ATTENDEES'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el evento',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca eventos con filtros
   */
  static async searchEvents(req: Request, res: Response) {
    try {
      const filters = req.query as unknown as EventFilterOptions;
      const result = await EventService.searchEvents(filters);

      res.status(200).json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al buscar eventos:', error);
      res.status(500).json({
        message: 'Error al buscar eventos',
        error: errorMessage
      });
    }
  }

  /**
   * Obtiene los próximos eventos
   */
  static async getUpcomingEvents(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;
      const upcomingEvents = await EventService.getUpcomingEvents(limit as string);

      res.status(200).json(upcomingEvents);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al obtener próximos eventos:', error);
      res.status(500).json({
        message: 'Error al obtener los próximos eventos',
        error: errorMessage
      });
    }
  }

  // ========== GESTIÓN DE ASISTENTES (Luma-style) ==========

  /**
   * Registra un usuario para un evento
   */
  static async registerForEvent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId } = req.params;
      const { ticketTypeId } = req.body;
      const userId = req.user.id;

      const attendee = await EventService.registerForEvent(
        parseInt(eventId),
        userId,
        ticketTypeId
      );

      res.status(201).json({
        success: true,
        message: 'Registro exitoso',
        data: attendee
      });
    } catch (error: any) {
      console.error('Error al registrar para evento:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'EVENT_CANCELLED') {
        return res.status(400).json({ error: 'El evento ha sido cancelado' });
      }
      if (error.message === 'ALREADY_REGISTERED') {
        return res.status(400).json({ error: 'Ya estás registrado para este evento' });
      }
      if (error.message === 'EVENT_FULL') {
        return res.status(400).json({ error: 'El evento está lleno' });
      }

      res.status(500).json({ error: 'Error al procesar el registro' });
    }
  }

  /**
   * Cancela el registro de un usuario
   */
  static async unregisterFromEvent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId } = req.params;
      const userId = req.user.id;

      await EventService.unregisterFromEvent(parseInt(eventId), userId);

      res.status(200).json({
        success: true,
        message: 'Registro cancelado exitosamente'
      });
    } catch (error: any) {
      console.error('Error al cancelar registro:', error);

      if (error.message === 'REGISTRATION_NOT_FOUND') {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }

      res.status(500).json({ error: 'Error al cancelar el registro' });
    }
  }

  /**
   * Obtiene el registro del usuario actual para un evento
   */
  static async getMyRegistration(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId } = req.params;
      const userId = req.user.id;

      const registration = await EventService.getMyRegistration(parseInt(eventId), userId);

      res.status(200).json({
        success: true,
        data: registration
      });
    } catch (error) {
      console.error('Error al obtener registro:', error);
      res.status(500).json({ error: 'Error al obtener el registro' });
    }
  }

  /**
   * Obtiene todos los asistentes de un evento (solo organizador)
   */
  static async getEventAttendees(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId } = req.params;
      const userId = req.user.id;

      const attendees = await EventService.getEventAttendees(parseInt(eventId), userId);

      res.status(200).json({
        success: true,
        data: attendees
      });
    } catch (error: any) {
      console.error('Error al obtener asistentes:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'No tienes permisos para ver los asistentes' });
      }

      res.status(500).json({ error: 'Error al obtener los asistentes' });
    }
  }

  /**
   * Obtiene estadísticas de asistentes para un evento
   * - Usuarios no autenticados: solo ven total de asistentes y capacidad
   * - Organizador: ve todas las estadísticas (pending, rejected, waitlisted, etc.)
   */
  static async getAttendeeStats(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = (req as any).user?.id;

      const stats = await EventService.getAttendeeStats(parseInt(eventId));

      // Verificar si el usuario es el organizador
      const isOrganizer = await EventService.isEventOrganizer(parseInt(eventId), userId);

      // Para usuarios no autenticados o no organizadores, limitar datos
      if (!isOrganizer) {
        return res.status(200).json({
          success: true,
          data: {
            approved: stats.approved,
            capacity: stats.capacity,
            availableSpots: stats.availableSpots,
            // No exponer: pending, rejected, waitlisted, checked_in
          }
        });
      }

      // Para el organizador, retornar todas las estadísticas
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
  }

  /**
   * Aprueba un asistente
   */
  static async approveAttendee(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId, attendeeId } = req.params;
      const userId = req.user.id;

      const attendee = await EventService.approveAttendee(
        parseInt(eventId),
        parseInt(attendeeId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Asistente aprobado',
        data: attendee
      });
    } catch (error: any) {
      console.error('Error al aprobar asistente:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      }
      if (error.message === 'EVENT_FULL') {
        return res.status(400).json({ error: 'El evento está lleno' });
      }

      res.status(500).json({ error: 'Error al aprobar el asistente' });
    }
  }

  /**
   * Rechaza un asistente
   */
  static async rejectAttendee(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId, attendeeId } = req.params;
      const userId = req.user.id;

      const attendee = await EventService.rejectAttendee(
        parseInt(eventId),
        parseInt(attendeeId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Asistente rechazado',
        data: attendee
      });
    } catch (error: any) {
      console.error('Error al rechazar asistente:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      }

      res.status(500).json({ error: 'Error al rechazar el asistente' });
    }
  }

  /**
   * Mueve un asistente a la lista de espera
   */
  static async moveToWaitlist(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId, attendeeId } = req.params;
      const userId = req.user.id;

      const attendee = await EventService.moveToWaitlist(
        parseInt(eventId),
        parseInt(attendeeId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Asistente movido a lista de espera',
        data: attendee
      });
    } catch (error: any) {
      console.error('Error al mover a lista de espera:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      }
      if (error.message === 'WAITLIST_NOT_ENABLED') {
        return res.status(400).json({ error: 'La lista de espera no está habilitada' });
      }

      res.status(500).json({ error: 'Error al mover a lista de espera' });
    }
  }

  /**
   * Mueve un asistente de la lista de espera a aprobado
   */
  static async moveFromWaitlist(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId, attendeeId } = req.params;
      const userId = req.user.id;

      const attendee = await EventService.moveFromWaitlist(
        parseInt(eventId),
        parseInt(attendeeId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Asistente aprobado desde lista de espera',
        data: attendee
      });
    } catch (error: any) {
      console.error('Error al mover desde lista de espera:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      }
      if (error.message === 'EVENT_FULL') {
        return res.status(400).json({ error: 'El evento está lleno' });
      }

      res.status(500).json({ error: 'Error al aprobar desde lista de espera' });
    }
  }

  // ========== CHECK-IN ==========

  /**
   * Hace check-in de un asistente en el evento
   */
  static async checkInAttendee(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId, attendeeId } = req.params;
      const userId = req.user.id;

      const attendee = await EventService.checkInAttendee(
        parseInt(eventId),
        parseInt(attendeeId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Check-in realizado exitosamente',
        data: attendee
      });
    } catch (error: any) {
      console.error('Error al hacer check-in:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      }
      if (error.message === 'ATTENDEE_NOT_FOUND') {
        return res.status(404).json({ error: 'Asistente no encontrado' });
      }
      if (error.message === 'ATTENDEE_NOT_APPROVED') {
        return res.status(400).json({ error: 'El asistente no está aprobado para el evento' });
      }
      if (error.message === 'ALREADY_CHECKED_IN') {
        return res.status(400).json({ error: 'El asistente ya hizo check-in' });
      }

      res.status(500).json({ error: 'Error al realizar el check-in' });
    }
  }

  /**
   * Deshace el check-in de un asistente
   */
  static async undoCheckIn(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId, attendeeId } = req.params;
      const userId = req.user.id;

      const attendee = await EventService.undoCheckIn(
        parseInt(eventId),
        parseInt(attendeeId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Check-in revertido exitosamente',
        data: attendee
      });
    } catch (error: any) {
      console.error('Error al revertir check-in:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      }
      if (error.message === 'ATTENDEE_NOT_FOUND') {
        return res.status(404).json({ error: 'Asistente no encontrado' });
      }
      if (error.message === 'NOT_CHECKED_IN') {
        return res.status(400).json({ error: 'El asistente no tiene check-in registrado' });
      }

      res.status(500).json({ error: 'Error al revertir el check-in' });
    }
  }

  // ========== RESEÑAS ==========

  /**
   * Crea una reseña para un evento
   */
  static async createReview(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId } = req.params;
      const { rating, title, comment } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5' });
      }

      const review = await EventService.createReview(parseInt(eventId), userId, {
        rating,
        title,
        comment,
      });

      res.status(201).json({
        success: true,
        message: 'Reseña creada exitosamente',
        data: review,
      });
    } catch (error: any) {
      console.error('Error al crear reseña:', error);

      if (error.message === 'NOT_ATTENDEE') {
        return res.status(403).json({ error: 'No puedes reseñar un evento al que no asististe' });
      }
      if (error.message === 'NOT_CHECKED_IN') {
        return res.status(403).json({ error: 'Debes haber hecho check-in para dejar una reseña' });
      }
      if (error.message === 'ALREADY_REVIEWED') {
        return res.status(400).json({ error: 'Ya dejaste una reseña para este evento' });
      }

      res.status(500).json({ error: 'Error al crear la reseña' });
    }
  }

  /**
   * Obtiene las reseñas de un evento
   */
  static async getEventReviews(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const reviews = await EventService.getEventReviews(parseInt(eventId));

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      console.error('Error al obtener reseñas:', error);
      res.status(500).json({ error: 'Error al obtener las reseñas' });
    }
  }

  /**
   * Permite al organizador responder a una reseña
   */
  static async respondToReview(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId, reviewId } = req.params;
      const { response } = req.body;
      const userId = req.user.id;

      if (!response || typeof response !== 'string' || response.trim().length === 0) {
        return res.status(400).json({ error: 'La respuesta es requerida' });
      }

      if (response.length > 1000) {
        return res.status(400).json({ error: 'La respuesta no puede exceder 1000 caracteres' });
      }

      const updatedReview = await EventService.respondToReview(
        parseInt(eventId),
        parseInt(reviewId),
        userId,
        response
      );

      res.status(200).json({
        success: true,
        message: 'Respuesta agregada exitosamente',
        data: updatedReview,
      });
    } catch (error: any) {
      console.error('Error al responder reseña:', error);

      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ error: 'Solo el organizador puede responder reseñas' });
      }
      if (error.message === 'REVIEW_NOT_FOUND') {
        return res.status(404).json({ error: 'Reseña no encontrada' });
      }

      res.status(500).json({ error: 'Error al responder la reseña' });
    }
  }

  // ========== HISTORIAL DE ASISTENCIA ==========

  /**
   * Obtiene los eventos donde el usuario está registrado (próximos)
   */
  static async getRegisteredEvents(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const userId = req.user.id;
      const events = await EventService.getRegisteredEvents(userId);

      // Formatear eventos para el frontend
      const formattedEvents = events.map((event: any) => ({
        ...event,
        organizer: event.organizer ? {
          id: event.organizer.id,
          name: event.organizer.displayName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim(),
          avatar: event.organizer.profileImageUrl || '/images/default-avatar.png',
        } : null,
      }));

      res.status(200).json({
        success: true,
        data: formattedEvents,
      });
    } catch (error) {
      console.error('Error al obtener eventos registrados:', error);
      res.status(500).json({ error: 'Error al obtener los eventos registrados' });
    }
  }

  /**
   * Obtiene los eventos a los que el usuario asistió
   */
  static async getAttendedEvents(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const userId = req.user.id;
      const events = await EventService.getAttendedEvents(userId);

      // Formatear eventos para el frontend
      const formattedEvents = events.map((event: any) => ({
        ...event,
        organizer: event.organizer ? {
          id: event.organizer.id,
          name: event.organizer.displayName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim(),
          avatar: event.organizer.profileImageUrl || '/images/default-avatar.png',
        } : null,
      }));

      res.status(200).json({
        success: true,
        data: formattedEvents,
      });
    } catch (error) {
      console.error('Error al obtener historial de asistencia:', error);
      res.status(500).json({ error: 'Error al obtener el historial de asistencia' });
    }
  }

  // ========== CERTIFICADOS ==========

  /**
   * Genera el certificado de asistencia en PDF
   */
  static async generateCertificate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { eventId } = req.params;
      const userId = req.user.id;
      const format = req.query.format as string; // 'pdf' o 'json'

      // Obtener datos del certificado
      const certificateData = await EventService.generateCertificate(parseInt(eventId), userId);

      // Si se solicita JSON, retornar datos
      if (format === 'json') {
        return res.status(200).json({
          success: true,
          data: certificateData,
        });
      }

      // Generar código único
      const certificateCode = CertificateService.generateCertificateCode(
        parseInt(eventId),
        userId
      );

      // Generar PDF
      const pdfBuffer = await CertificateService.generatePDF({
        eventId: parseInt(eventId),
        eventTitle: certificateData.eventTitle,
        eventDate: new Date(certificateData.eventDate),
        eventEndDate: certificateData.eventEndDate ? new Date(certificateData.eventEndDate) : undefined,
        eventLocation: certificateData.eventLocation,
        attendeeName: certificateData.attendeeName,
        attendeeId: userId,
        checkedInAt: new Date(certificateData.checkedInAt),
        certificateCode,
      });

      // Configurar headers para descarga de PDF
      const filename = `certificado-${certificateData.eventTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error al generar certificado:', error);

      if (error.message === 'NOT_ATTENDEE') {
        return res.status(403).json({ error: 'No asististe a este evento' });
      }
      if (error.message === 'NOT_APPROVED') {
        return res.status(403).json({ error: 'Tu registro no fue aprobado' });
      }
      if (error.message === 'NOT_CHECKED_IN') {
        return res.status(403).json({ error: 'No hiciste check-in en este evento' });
      }

      res.status(500).json({ error: 'Error al generar el certificado' });
    }
  }
}

export default EventController;
