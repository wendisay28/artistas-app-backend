import { and, eq, gte, lte, lt, ne, or, sql, SQL, count, desc, avg } from 'drizzle-orm';
import { events, categories, users, eventAttendees, eventReviews, eventAgenda } from '../../schema.js';
import { db } from '../../db.js';
import { generateUniqueSlug } from './event.utils.js';
import { CreateEventInput, UpdateEventInput, EventFilterOptions } from './event.types.js';
import { cacheService, CacheKeys, CacheTTL } from '../../services/cache.service.js';

/**
 * Servicio para manejar la lógica de negocio de eventos
 */
export class EventService {
  /**
   * Obtiene un evento por su ID con sus relaciones
   */
  static async getEventById(eventId: number, userId?: string) {
    // Obtener evento con información del organizador
    const [result] = await db
      .select({
        // Campos del evento
        id: events.id,
        title: events.title,
        slug: events.slug,
        description: events.description,
        shortDescription: events.shortDescription,
        startDate: events.startDate,
        endDate: events.endDate,
        timezone: events.timezone,
        locationType: events.locationType,
        address: events.address,
        city: events.city,
        state: events.state,
        country: events.country,
        coordinates: events.coordinates,
        onlineEventUrl: events.onlineEventUrl,
        venueName: events.venueName,
        venueDescription: events.venueDescription,
        isFree: events.isFree,
        ticketPrice: events.ticketPrice,
        ticketUrl: events.ticketUrl,
        capacity: events.capacity,
        availableTickets: events.availableTickets,
        featuredImage: events.featuredImage,
        gallery: events.gallery,
        videoUrl: events.videoUrl,
        status: events.status,
        isFeatured: events.isFeatured,
        isRecurring: events.isRecurring,
        recurrencePattern: events.recurrencePattern,
        categoryId: events.categoryId,
        subcategories: events.subcategories,
        tags: events.tags,
        eventType: events.eventType,
        organizerId: events.organizerId,
        companyId: events.companyId,
        viewCount: events.viewCount,
        saveCount: events.saveCount,
        shareCount: events.shareCount,
        requiresApproval: events.requiresApproval,
        enableWaitlist: events.enableWaitlist,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        // Información del organizador (solo nombre y avatar)
        organizer: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          isVerified: users.isVerified,
          userType: users.userType,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(eq(events.id, eventId));

    if (!result) {
      return null;
    }

    // Incrementar el contador de vistas
    await db
      .update(events)
      .set({ viewCount: (result.viewCount || 0) + 1 })
      .where(eq(events.id, eventId));

    // Obtener agenda del evento
    const agenda = await db
      .select({
        id: eventAgenda.id,
        title: eventAgenda.title,
        description: eventAgenda.description,
        startTime: eventAgenda.startTime,
        endTime: eventAgenda.endTime,
        location: eventAgenda.location,
        speakerName: eventAgenda.speakerName,
        speakerTitle: eventAgenda.speakerTitle,
        speakerImage: eventAgenda.speakerImage,
        sortOrder: eventAgenda.sortOrder,
      })
      .from(eventAgenda)
      .where(eq(eventAgenda.eventId, eventId))
      .orderBy(eventAgenda.sortOrder);

    // Obtener reseñas del evento con información del usuario
    const reviews = await db
      .select({
        id: eventReviews.id,
        rating: eventReviews.rating,
        title: eventReviews.title,
        comment: eventReviews.comment,
        isVerified: eventReviews.isVerified,
        createdAt: eventReviews.createdAt,
        organizerResponse: eventReviews.organizerResponse,
        organizerResponseAt: eventReviews.organizerResponseAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(eventReviews)
      .leftJoin(users, eq(eventReviews.userId, users.id))
      .where(and(
        eq(eventReviews.eventId, eventId),
        eq(eventReviews.isHidden, false)
      ))
      .orderBy(desc(eventReviews.createdAt));

    // Calcular estadísticas de reseñas
    const reviewStats = {
      count: reviews.length,
      average: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      }
    };

    // Obtener estado de registro del usuario actual (si está autenticado)
    let userRegistration = null;
    if (userId) {
      const [registration] = await db
        .select({
          id: eventAttendees.id,
          status: eventAttendees.status,
          registeredAt: eventAttendees.registeredAt,
          checkedInAt: eventAttendees.checkedInAt,
          certificateUrl: eventAttendees.certificateUrl,
        })
        .from(eventAttendees)
        .where(and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId)
        ));

      if (registration) {
        // Verificar si el usuario ya dejó una reseña
        const [existingReview] = await db
          .select({ id: eventReviews.id })
          .from(eventReviews)
          .where(and(
            eq(eventReviews.eventId, eventId),
            eq(eventReviews.userId, userId)
          ));

        // Verificar si el evento ya pasó
        const eventDate = result.startDate ? new Date(result.startDate) : new Date();
        const now = new Date();
        const isEventPast = eventDate < now || result.status === 'completed';

        userRegistration = {
          ...registration,
          isRegistered: true,
          hasReviewed: !!existingReview,
          // Solo puede dejar reseña si: está aprobado, hizo check-in, evento ya pasó, y no ha reseñado
          canReview: registration.status === 'approved' && !!registration.checkedInAt && isEventPast && !existingReview,
          // Solo puede descargar certificado si: está aprobado y hizo check-in
          canDownloadCertificate: registration.status === 'approved' && !!registration.checkedInAt,
        };
      }
    }

    // Contar asistentes aprobados
    const [attendeeCount] = await db
      .select({ count: count() })
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.status, 'approved')
      ));

    return {
      ...result,
      agenda,
      reviews,
      reviewStats,
      userRegistration,
      attendeeCount: attendeeCount?.count || 0,
    };
  }

  /**
   * Crea un nuevo evento
   */
  static async createEvent(eventData: CreateEventInput, userId: string) {
    // Generar slug único
    const slug = await generateUniqueSlug(eventData.title);

    // Procesar fechas
    const startDate = eventData.startDate ? new Date(eventData.startDate) : new Date();
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

    // Preparar datos para la creación (bio se mapea a shortDescription)
    const newEvent = {
      title: eventData.title,
      description: eventData.description,
      shortDescription: (eventData as any).bio || eventData.shortDescription || null,
      startDate: startDate,
      endDate: endDate || null,
      timezone: eventData.timezone || 'America/Mexico_City',
      locationType: eventData.locationType,
      address: eventData.address || null,
      city: eventData.city || null,
      state: eventData.state || null,
      country: eventData.country || null,
      coordinates: eventData.coordinates || null,
      onlineEventUrl: eventData.onlineEventUrl || null,
      venueName: eventData.venueName || null,
      venueDescription: eventData.venueDescription || null,
      isFree: eventData.isFree || false,
      ticketPrice: eventData.ticketPrice ? sql`${eventData.ticketPrice}::numeric` : null,
      ticketUrl: eventData.ticketUrl || null,
      capacity: eventData.capacity || null,
      availableTickets: eventData.availableTickets || null,
      featuredImage: eventData.featuredImage || null,
      gallery: eventData.gallery || [],
      videoUrl: eventData.videoUrl || null,
      status: 'draft' as const,
      isFeatured: false,
      isRecurring: eventData.isRecurring || false,
      recurrencePattern: eventData.recurrencePattern || null,
      categoryId: eventData.categoryId || null,
      subcategories: eventData.subcategories || [],
      tags: eventData.tags || [],
      eventType: eventData.eventType || 'other',
      slug,
      organizerId: userId, // Usuario autenticado
      companyId: eventData.companyId ? parseInt(eventData.companyId) : null, // Empresa organizadora
      viewCount: 0,
      saveCount: 0,
      shareCount: 0,
      createdAt: sql`now()`,
      updatedAt: sql`now()`,
    };

    // Insertar en la base de datos
    const [newEventRecord] = await db
      .insert(events)
      .values(newEvent)
      .returning();

    // Invalidar caché relacionado
    cacheService.invalidateUserEvents(userId);
    cacheService.del(CacheKeys.EVENTS_UPCOMING);
    cacheService.del(CacheKeys.EVENTS_PUBLIC);

    return newEventRecord;
  }

  /**
   * Obtiene los eventos asociados a una empresa
   */
  static async getCompanyEvents(companyId: number) {
    const companyEvents = await db
      .select()
      .from(events)
      .where(eq(events.companyId, companyId))
      .orderBy(sql`${events.startDate} DESC`);

    return companyEvents;
  }

  /**
   * Obtiene los eventos creados por un usuario
   */
  static async getMyEvents(userId: string) {
    const cacheKey = CacheKeys.EVENTS_BY_USER(userId);

    return cacheService.getOrSet(cacheKey, async () => {
      const userEvents = await db
        .select()
        .from(events)
        .where(eq(events.organizerId, userId))
        .orderBy(sql`${events.startDate} DESC`);

      return userEvents;
    }, CacheTTL.MEDIUM);
  }

  /**
   * Actualiza un evento existente
   */
  static async updateEvent(eventId: number, eventData: UpdateEventInput, userId: string) {
    // Verificar si el evento existe
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!existingEvent) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verificar permisos
    if (existingEvent.organizerId !== userId) {
      throw new Error('FORBIDDEN');
    }

    // Preparar datos para la actualización
    const updateData: any = { ...eventData };

    // Mapear bio a shortDescription si se envía
    if (updateData.bio !== undefined) {
      updateData.shortDescription = updateData.bio;
      delete updateData.bio;
    }

    // Si se actualiza el título, generar un nuevo slug
    if (updateData.title && updateData.title !== existingEvent.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, eventId);
    }

    // Procesar fechas
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }

    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    } else if (updateData.endDate === null) {
      updateData.endDate = null;
    }

    // Actualizar fecha de modificación
    updateData.updatedAt = new Date();

    // Eliminar campos que no se deben actualizar
    delete updateData.id;
    delete updateData.organizerId;
    delete updateData.createdAt;

    // Actualizar en la base de datos
    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    // Invalidar caché relacionado
    cacheService.invalidateEvent(eventId);
    cacheService.invalidateUserEvents(userId);

    return updatedEvent;
  }

  /**
   * Cancela un evento
   */
  static async cancelEvent(eventId: number, userId: string) {
    // Verificar si el evento existe
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!existingEvent) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verificar permisos
    if (existingEvent.organizerId !== userId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar que no esté ya cancelado
    if (existingEvent.status === 'cancelled') {
      throw new Error('ALREADY_CANCELLED');
    }

    // Actualizar estado
    const [cancelledEvent] = await db
      .update(events)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId))
      .returning();

    // Invalidar caché relacionado
    cacheService.invalidateEvent(eventId);
    cacheService.invalidateUserEvents(userId);

    return cancelledEvent;
  }

  /**
   * Elimina un evento permanentemente
   * Solo se puede eliminar si:
   * - El usuario es el organizador
   * - No hay asistentes aprobados o con check-in
   */
  static async deleteEvent(eventId: number, userId: string) {
    // Verificar si el evento existe
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!existingEvent) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verificar permisos
    if (existingEvent.organizerId !== userId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar si hay asistentes aprobados o con check-in
    const [attendeeCount] = await db
      .select({ count: count() })
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        or(
          eq(eventAttendees.status, 'approved'),
          eq(eventAttendees.status, 'checked_in'),
          sql`${eventAttendees.checkedInAt} IS NOT NULL`
        )
      ));

    if (attendeeCount && Number(attendeeCount.count) > 0) {
      throw new Error('HAS_ATTENDEES');
    }

    // Eliminar registros relacionados primero (en orden)
    // 1. Eliminar asistentes pendientes/rechazados
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, eventId));

    // 2. Eliminar reseñas
    await db.delete(eventReviews).where(eq(eventReviews.eventId, eventId));

    // 3. Eliminar agenda
    await db.delete(eventAgenda).where(eq(eventAgenda.eventId, eventId));

    // 4. Finalmente eliminar el evento
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning();

    // Invalidar caché relacionado
    cacheService.invalidateEvent(eventId);
    cacheService.invalidateUserEvents(userId);

    return deletedEvent;
  }

  /**
   * Verifica si un usuario es el organizador de un evento
   */
  static async isEventOrganizer(eventId: number, userId?: string): Promise<boolean> {
    if (!userId) return false;

    const [event] = await db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, eventId));

    return event?.organizerId === userId;
  }

  /**
   * Busca eventos con filtros
   */
  static async searchEvents(filters: EventFilterOptions) {
    const {
      query,
      category,
      startDate,
      endDate,
      isFree,
      location,
      eventType,
      limit = '20',
      offset = '0',
    } = filters;

    // Construir condiciones
    const conditions: SQL[] = [
      eq(events.status, 'published'),
      ne(events.status, 'cancelled')
    ];

    // Búsqueda por texto
    if (query && typeof query === 'string') {
      const searchTerm = `%${query}%`;
      const searchConditions: SQL[] = [
        sql`LOWER(${events.title}::text) LIKE LOWER(${searchTerm}::text)`,
        sql`LOWER(${events.description}::text) LIKE LOWER(${searchTerm}::text)`
      ];

      if (events.shortDescription) {
        searchConditions.push(
          sql`LOWER(${events.shortDescription}::text) LIKE LOWER(${searchTerm}::text)`
        );
      }

      const searchCondition = or(...searchConditions);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Filtrar por categoría
    if (category) {
      conditions.push(eq(categories.name, category));
    }

    // Filtrar por fechas
    if (startDate) {
      conditions.push(gte(events.startDate, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(events.endDate || events.startDate, new Date(endDate)));
    }

    // Filtrar por tipo
    if (eventType && typeof eventType === 'string') {
      const validEventTypes = ['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other'];
      if (validEventTypes.includes(eventType)) {
        conditions.push(eq(events.eventType, eventType as any));
      }
    }

    // Filtrar por ubicación
    if (location && typeof location === 'string') {
      const locationTerm = `%${location}%`;
      const locationConditions: SQL[] = [];

      if (events.city) {
        locationConditions.push(sql`LOWER(${events.city}::text) LIKE LOWER(${locationTerm}::text)`);
      }
      if (events.state) {
        locationConditions.push(sql`LOWER(${events.state}::text) LIKE LOWER(${locationTerm}::text)`);
      }
      if (events.country) {
        locationConditions.push(sql`LOWER(${events.country}::text) LIKE LOWER(${locationTerm}::text)`);
      }
      if (events.venueName) {
        locationConditions.push(sql`LOWER(${events.venueName}::text) LIKE LOWER(${locationTerm}::text)`);
      }

      const locationCondition = or(...locationConditions);
      if (locationCondition) {
        conditions.push(locationCondition);
      }
    }

    // Filtrar por precio
    if (isFree !== undefined) {
      const isFreeBool = typeof isFree === 'string' ? isFree === 'true' : Boolean(isFree);
      conditions.push(eq(events.isFree, isFreeBool));
    }

    // Ejecutar queries
    const [eventsList, totalCount] = await Promise.all([
      db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          shortDescription: events.shortDescription,
          startDate: events.startDate,
          endDate: events.endDate,
          timezone: events.timezone,
          locationType: events.locationType,
          address: events.address,
          city: events.city,
          state: events.state,
          country: events.country,
          isFree: events.isFree,
          ticketPrice: events.ticketPrice,
          featuredImage: events.featuredImage,
          status: events.status,
          organizer: {
            id: users.id,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          },
          category: sql`${categories.name} as category_name`,
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .leftJoin(categories, eq(events.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(events.startDate)
        .limit(Number(limit))
        .offset(Number(offset)),

      db.select({ count: sql<number>`count(*)` })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .leftJoin(categories, eq(events.categoryId, categories.id))
        .where(and(...conditions))
    ]);

    return {
      data: eventsList,
      pagination: {
        total: Number(totalCount[0]?.count) || 0,
        limit: Number(limit),
        offset: Number(offset),
      },
    };
  }

  /**
   * Obtiene próximos eventos
   */
  static async getUpcomingEvents(limit: string = '10') {
    const cacheKey = `${CacheKeys.EVENTS_UPCOMING}:${limit}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const today = new Date();

      const upcomingEvents = await db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          shortDescription: events.shortDescription,
          startDate: events.startDate,
          endDate: events.endDate,
          timezone: events.timezone,
          locationType: events.locationType,
          address: events.address,
          city: events.city,
          state: events.state,
          country: events.country,
          isFree: events.isFree,
          ticketPrice: events.ticketPrice,
          featuredImage: events.featuredImage,
          status: events.status,
          organizer: {
            id: users.id,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          },
          category: sql`${categories.name} as category_name`,
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .leftJoin(categories, eq(events.categoryId, categories.id))
        .where(
          and(
            gte(events.startDate, today),
            eq(events.status, 'published'),
            ne(events.status, 'cancelled')
          )
        )
        .orderBy(events.startDate)
        .limit(Number(limit));

      return upcomingEvents;
    }, CacheTTL.MEDIUM);
  }

  /**
   * Registra un usuario para un evento (Luma-style)
   */
  static async registerForEvent(eventId: number, userId: string, ticketTypeId?: number) {
    // Verificar si el evento existe
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verificar que el evento no esté cancelado
    if (event.status === 'cancelled') {
      throw new Error('EVENT_CANCELLED');
    }

    // Verificar si ya está registrado
    const [existingRegistration] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId)
      ));

    if (existingRegistration) {
      throw new Error('ALREADY_REGISTERED');
    }

    // Obtener estadísticas actuales
    const stats = await this.getAttendeeStats(eventId);

    // Determinar estado inicial
    let initialStatus: 'pending' | 'approved' | 'waitlisted' = 'pending';

    if (!event.requiresApproval) {
      // Si no requiere aprobación, aprobar automáticamente
      if (event.capacity && stats.approved >= event.capacity) {
        // Si está lleno y hay waitlist, poner en waitlist
        if (event.enableWaitlist) {
          initialStatus = 'waitlisted';
        } else {
          throw new Error('EVENT_FULL');
        }
      } else {
        initialStatus = 'approved';
      }
    } else {
      // Si requiere aprobación, dejar en pending
      initialStatus = 'pending';
    }

    // Crear registro
    const [newAttendee] = await db
      .insert(eventAttendees)
      .values({
        eventId,
        userId,
        ticketTypeId: ticketTypeId || null,
        status: initialStatus,
        registeredAt: new Date(),
        statusUpdatedAt: new Date(),
      })
      .returning();

    // Invalidar caché relacionado
    cacheService.invalidateEventAttendees(eventId);
    cacheService.invalidateUserEvents(userId);

    return newAttendee;
  }

  /**
   * Cancela el registro de un usuario para un evento
   */
  static async unregisterFromEvent(eventId: number, userId: string) {
    const [registration] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId)
      ));

    if (!registration) {
      throw new Error('REGISTRATION_NOT_FOUND');
    }

    // Eliminar registro
    await db
      .delete(eventAttendees)
      .where(eq(eventAttendees.id, registration.id));

    // Invalidar caché relacionado
    cacheService.invalidateEventAttendees(eventId);
    cacheService.invalidateUserEvents(userId);

    return { success: true };
  }

  /**
   * Obtiene todos los asistentes de un evento (solo organizador)
   */
  static async getEventAttendees(eventId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Obtener asistentes con información de usuario
    const attendees = await db
      .select({
        id: eventAttendees.id,
        eventId: eventAttendees.eventId,
        userId: eventAttendees.userId,
        status: eventAttendees.status,
        ticketTypeId: eventAttendees.ticketTypeId,
        registeredAt: eventAttendees.registeredAt,
        statusUpdatedAt: eventAttendees.statusUpdatedAt,
        checkedInAt: eventAttendees.checkedInAt,
        notes: eventAttendees.notes,
        user: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(eventAttendees)
      .leftJoin(users, eq(eventAttendees.userId, users.id))
      .where(eq(eventAttendees.eventId, eventId))
      .orderBy(eventAttendees.registeredAt);

    return attendees;
  }

  /**
   * Aprueba un asistente
   */
  static async approveAttendee(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar capacidad
    const stats = await this.getAttendeeStats(eventId);
    if (event.capacity && stats.approved >= event.capacity) {
      throw new Error('EVENT_FULL');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'approved',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    // Invalidar caché de asistentes
    cacheService.invalidateEventAttendees(eventId);

    return updatedAttendee;
  }

  /**
   * Rechaza un asistente
   */
  static async rejectAttendee(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'rejected',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    // Invalidar caché de asistentes
    cacheService.invalidateEventAttendees(eventId);

    return updatedAttendee;
  }

  /**
   * Mueve un asistente a la lista de espera
   */
  static async moveToWaitlist(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    if (!event.enableWaitlist) {
      throw new Error('WAITLIST_NOT_ENABLED');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'waitlisted',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    // Invalidar caché de asistentes
    cacheService.invalidateEventAttendees(eventId);

    return updatedAttendee;
  }

  /**
   * Mueve un asistente de la lista de espera a aprobado
   */
  static async moveFromWaitlist(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar capacidad
    const stats = await this.getAttendeeStats(eventId);
    if (event.capacity && stats.approved >= event.capacity) {
      throw new Error('EVENT_FULL');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'approved',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    return updatedAttendee;
  }

  /**
   * Hace check-in de un asistente en el evento
   */
  static async checkInAttendee(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership del evento
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar que el asistente existe y está aprobado
    const [attendee] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.id, attendeeId),
        eq(eventAttendees.eventId, eventId)
      ));

    if (!attendee) {
      throw new Error('ATTENDEE_NOT_FOUND');
    }

    if (attendee.status !== 'approved') {
      throw new Error('ATTENDEE_NOT_APPROVED');
    }

    if (attendee.checkedInAt) {
      throw new Error('ALREADY_CHECKED_IN');
    }

    // Realizar el check-in
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        checkedInAt: new Date(),
        checkedInBy: organizerId,
        status: 'checked_in',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    // Invalidar caché de asistentes y del usuario que hizo check-in
    cacheService.invalidateEventAttendees(eventId);
    if (attendee.userId) {
      cacheService.invalidateUserEvents(attendee.userId);
    }

    return updatedAttendee;
  }

  /**
   * Deshace el check-in de un asistente (en caso de error)
   */
  static async undoCheckIn(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership del evento
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar que el asistente tiene check-in
    const [attendee] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.id, attendeeId),
        eq(eventAttendees.eventId, eventId)
      ));

    if (!attendee) {
      throw new Error('ATTENDEE_NOT_FOUND');
    }

    if (!attendee.checkedInAt) {
      throw new Error('NOT_CHECKED_IN');
    }

    // Revertir el check-in
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        checkedInAt: null,
        checkedInBy: null,
        status: 'approved',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    // Invalidar caché de asistentes y del usuario
    cacheService.invalidateEventAttendees(eventId);
    if (attendee.userId) {
      cacheService.invalidateUserEvents(attendee.userId);
    }

    return updatedAttendee;
  }

  /**
   * Obtiene el registro de un usuario para un evento
   */
  static async getMyRegistration(eventId: number, userId: string) {
    const [registration] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId)
      ));

    return registration || null;
  }

  /**
   * Obtiene estadísticas de asistentes para un evento
   */
  static async getAttendeeStats(eventId: number) {
    const results = await db
      .select({
        status: eventAttendees.status,
        count: count(),
      })
      .from(eventAttendees)
      .where(eq(eventAttendees.eventId, eventId))
      .groupBy(eventAttendees.status);

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
      registered: 0,
      checked_in: 0,
    };

    results.forEach((result: any) => {
      if (result.status in stats) {
        stats[result.status as keyof typeof stats] = Number(result.count);
      }
    });

    // Obtener capacidad del evento
    const [event] = await db
      .select({ capacity: events.capacity })
      .from(events)
      .where(eq(events.id, eventId));

    const capacity = event?.capacity || 0;
    const availableSpots = capacity > 0 ? Math.max(0, capacity - stats.approved) : Infinity;

    return {
      ...stats,
      capacity,
      availableSpots,
    };
  }

  // ========== RESEÑAS ==========

  /**
   * Crea una reseña para un evento
   */
  static async createReview(eventId: number, userId: string, data: {
    rating: number;
    title?: string;
    comment?: string;
  }) {
    // Verificar que el usuario asistió al evento
    const [attendance] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId),
        eq(eventAttendees.status, 'approved')
      ));

    if (!attendance) {
      throw new Error('NOT_ATTENDEE');
    }

    if (!attendance.checkedInAt) {
      throw new Error('NOT_CHECKED_IN');
    }

    // Verificar que no haya dejado una reseña antes
    const [existingReview] = await db
      .select()
      .from(eventReviews)
      .where(and(
        eq(eventReviews.eventId, eventId),
        eq(eventReviews.userId, userId)
      ));

    if (existingReview) {
      throw new Error('ALREADY_REVIEWED');
    }

    // Crear la reseña
    const [review] = await db
      .insert(eventReviews)
      .values({
        eventId,
        userId,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment || null,
        isVerified: true, // Verificado porque ya comprobamos que asistió
      })
      .returning();

    return review;
  }

  /**
   * Obtiene las reseñas de un evento
   */
  static async getEventReviews(eventId: number) {
    const reviews = await db
      .select({
        id: eventReviews.id,
        rating: eventReviews.rating,
        title: eventReviews.title,
        comment: eventReviews.comment,
        isVerified: eventReviews.isVerified,
        createdAt: eventReviews.createdAt,
        organizerResponse: eventReviews.organizerResponse,
        organizerResponseAt: eventReviews.organizerResponseAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(eventReviews)
      .leftJoin(users, eq(eventReviews.userId, users.id))
      .where(and(
        eq(eventReviews.eventId, eventId),
        eq(eventReviews.isHidden, false)
      ))
      .orderBy(desc(eventReviews.createdAt));

    return reviews;
  }

  /**
   * Permite al organizador responder a una reseña
   */
  static async respondToReview(eventId: number, reviewId: number, organizerId: string, response: string) {
    // Verificar que el evento existe y el usuario es el organizador
    const [event] = await db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar que la reseña existe y pertenece a este evento
    const [review] = await db
      .select()
      .from(eventReviews)
      .where(and(
        eq(eventReviews.id, reviewId),
        eq(eventReviews.eventId, eventId)
      ));

    if (!review) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    // Actualizar la reseña con la respuesta del organizador
    const [updatedReview] = await db
      .update(eventReviews)
      .set({
        organizerResponse: response.trim(),
        organizerResponseAt: new Date(),
      })
      .where(eq(eventReviews.id, reviewId))
      .returning();

    return updatedReview;
  }

  // ========== HISTORIAL DE ASISTENCIA ==========

  /**
   * Obtiene los eventos a los que el usuario ha asistido (no creados por él)
   * Solo incluye eventos pasados o con check-in realizado
   */
  static async getAttendedEvents(userId: string) {
    const cacheKey = CacheKeys.EVENTS_ATTENDED(userId);

    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();

      const attendedEvents = await db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        shortDescription: events.shortDescription,
        description: events.description,
        startDate: events.startDate,
        endDate: events.endDate,
        featuredImage: events.featuredImage,
        city: events.city,
        address: events.address,
        country: events.country,
        locationType: events.locationType,
        status: events.status,
        capacity: events.capacity,
        availableTickets: events.availableTickets,
        isFree: events.isFree,
        ticketPrice: events.ticketPrice,
        tags: events.tags,
        organizerId: events.organizerId,
        // Datos del registro
        registrationStatus: eventAttendees.status,
        registeredAt: eventAttendees.registeredAt,
        checkedInAt: eventAttendees.checkedInAt,
        certificateUrl: eventAttendees.certificateUrl,
        // Organizador
        organizer: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(eventAttendees)
      .innerJoin(events, eq(eventAttendees.eventId, events.id))
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(and(
        eq(eventAttendees.userId, userId),
        ne(events.organizerId, userId), // No incluir eventos que el usuario organizó
        // Solo eventos pasados o completados o con check-in
        or(
          lte(events.startDate, now),
          eq(events.status, 'completed'),
          sql`${eventAttendees.checkedInAt} IS NOT NULL`
        )
      ))
      .orderBy(desc(events.startDate));

    // Obtener todas las reseñas del usuario para los eventos asistidos en UNA sola query
    const eventIds = attendedEvents.map(e => e.id);

    let userReviewsSet = new Set<number>();
    if (eventIds.length > 0) {
      const userReviews = await db
        .select({ eventId: eventReviews.eventId })
        .from(eventReviews)
        .where(and(
          eq(eventReviews.userId, userId),
          sql`${eventReviews.eventId} = ANY(${eventIds})`
        ));

      userReviewsSet = new Set(userReviews.map(r => r.eventId));
    }

      // Mapear eventos con estado de reseña (sin queries adicionales)
      const eventsWithReviewStatus = attendedEvents.map((event) => {
        const hasReviewed = userReviewsSet.has(event.id);
        return {
          ...event,
          hasReviewed,
          canReview: event.registrationStatus === 'approved' && event.checkedInAt && !hasReviewed,
          canDownloadCertificate: event.registrationStatus === 'approved' && !!event.checkedInAt,
        };
      });

      return eventsWithReviewStatus;
    }, CacheTTL.SHORT); // Short TTL because hasReviewed can change
  }

  /**
   * Obtiene los eventos próximos donde el usuario está registrado (no creados por él)
   */
  static async getRegisteredEvents(userId: string) {
    const cacheKey = CacheKeys.EVENTS_REGISTERED(userId);

    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();

      const registeredEvents = await db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          shortDescription: events.shortDescription,
          startDate: events.startDate,
          endDate: events.endDate,
          featuredImage: events.featuredImage,
          city: events.city,
          address: events.address,
          country: events.country,
          locationType: events.locationType,
          onlineEventUrl: events.onlineEventUrl,
          status: events.status,
          capacity: events.capacity,
          availableTickets: events.availableTickets,
          isFree: events.isFree,
          ticketPrice: events.ticketPrice,
          tags: events.tags,
          organizerId: events.organizerId,
          // Datos del registro
          registrationStatus: eventAttendees.status,
          registeredAt: eventAttendees.registeredAt,
          // Organizador
          organizer: {
            id: users.id,
            displayName: users.displayName,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(eventAttendees)
        .innerJoin(events, eq(eventAttendees.eventId, events.id))
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(
          eq(eventAttendees.userId, userId),
          ne(events.organizerId, userId), // No incluir eventos que el usuario organizó
          gte(events.startDate, now), // Solo eventos futuros
          ne(events.status, 'cancelled') // No incluir eventos cancelados
        ))
        .orderBy(events.startDate);

      return registeredEvents;
    }, CacheTTL.MEDIUM);
  }

  // ========== CERTIFICADOS ==========

  /**
   * Genera el certificado de asistencia para un evento
   */
  static async generateCertificate(eventId: number, odUserId: string) {
    // Verificar que el usuario asistió al evento
    const [attendance] = await db
      .select({
        id: eventAttendees.id,
        status: eventAttendees.status,
        checkedInAt: eventAttendees.checkedInAt,
        certificateUrl: eventAttendees.certificateUrl,
      })
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, odUserId)
      ));

    if (!attendance) {
      throw new Error('NOT_ATTENDEE');
    }

    if (attendance.status !== 'approved') {
      throw new Error('NOT_APPROVED');
    }

    if (!attendance.checkedInAt) {
      throw new Error('NOT_CHECKED_IN');
    }

    // Obtener datos del evento y usuario
    const [event] = await db
      .select({
        title: events.title,
        startDate: events.startDate,
        endDate: events.endDate,
        venueName: events.venueName,
        city: events.city,
      })
      .from(events)
      .where(eq(events.id, eventId));

    const [user] = await db
      .select({
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, odUserId));

    if (!event || !user) {
      throw new Error('DATA_NOT_FOUND');
    }

    const userName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

    // Retornar datos del certificado (el frontend puede generar el PDF)
    return {
      eventId,
      odUserId,
      eventTitle: event.title,
      eventDate: event.startDate,
      eventEndDate: event.endDate,
      eventLocation: event.venueName || event.city || 'Virtual',
      attendeeName: userName,
      checkedInAt: attendance.checkedInAt,
      certificateCode: `CERT-${eventId}-${Date.now().toString(36).toUpperCase()}`,
    };
  }
}
