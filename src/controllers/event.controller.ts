import { Request, Response } from 'express';
import { db } from '../db';
import { and, eq, gte, lte, ne, or, sql, SQL } from 'drizzle-orm';
import type { SQLWrapper } from 'drizzle-orm';
import { events, eventOccurrences, categories, users } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import { EventType } from '../types/event.types';

// Definir interfaces para las entradas
type CreateEventInput = {
  title: string;
  description: string;
  shortDescription?: string;
  startDate: string | Date;
  endDate?: string | Date;
  timezone?: string;
  isRecurring?: boolean;
  recurrencePattern?: any;
  locationType: 'physical' | 'online' | 'hybrid';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  onlineEventUrl?: string;
  venueName?: string;
  venueDescription?: string;
  isFree: boolean;
  ticketPrice?: number;
  ticketUrl?: string;
  capacity?: number;
  availableTickets?: number;
  featuredImage?: string;
  gallery?: string[];
  videoUrl?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'postponed' | 'completed';
  isFeatured?: boolean;
  categoryId?: number;
  subcategories?: string[];
  tags?: string[];
  eventType: EventType;
  organizerId: string;
};

type UpdateEventInput = Partial<Omit<CreateEventInput, 'organizerId' | 'eventType'>> & {
  id: number;
};

type EventFilterOptions = {
  query?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  isFree?: boolean;
  location?: string;
  eventType?: string;
  limit?: number | string;
  offset?: number | string;
};

// Definir tipos de respuesta para los endpoints
type EventResponse = {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  startDate: Date;
  endDate: Date | null;
  timezone: string;
  locationType: 'physical' | 'online' | 'hybrid';
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  coordinates: { lat: number; lng: number } | null;
  onlineEventUrl: string | null;
  venueName: string | null;
  venueDescription: string | null;
  isFree: boolean;
  ticketPrice: number | null;
  ticketUrl: string | null;
  capacity: number | null;
  availableTickets: number | null;
  featuredImage: string | null;
  gallery: string[];
  videoUrl: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'postponed' | 'completed';
  isFeatured: boolean;
  isRecurring: boolean;
  recurrencePattern: any;
  categoryId: number | null;
  subcategories: string[];
  tags: string[];
  eventType: EventType;
  viewCount: number;
  saveCount: number;
  shareCount: number;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  organizer?: {
    id: string;
    displayName: string | null;
    profileImageUrl: string | null;
  };
  category?: string;
};

// Schema de validación para la creación de eventos
const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().default('America/Bogota'),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.record(z.any()).optional(),
  locationType: z.enum(['physical', 'online', 'hybrid']).default('physical'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  onlineEventUrl: z.string().url().optional(),
  venueName: z.string().optional(),
  venueDescription: z.string().optional(),
  isFree: z.boolean().default(false),
  ticketPrice: z.number().min(0).optional(),
  ticketUrl: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  availableTickets: z.number().int().min(0).optional(),
  featuredImage: z.string().url().optional(),
  gallery: z.array(z.string().url()).default([]),
  videoUrl: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'postponed', 'completed']).default('draft'),
  isFeatured: z.boolean().default(false),
  categoryId: z.number().int().positive().optional(),
  subcategories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  eventType: z.enum(['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other']).default('other')
});

// Schema de validación para la actualización de eventos
const updateEventSchema = createEventSchema.partial().extend({
  id: z.number().int().positive()
});

// Schema de validación para filtros de eventos
const eventFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isFree: z.string().optional(),
  location: z.string().optional(),
  eventType: z.string().optional(),
  limit: z.string().default('20'),
  offset: z.string().default('0')
});

class EventController {
  /**
   * Crea un nuevo evento
   */
  static async createEvent(req: Request, res: Response) {
    console.log('=== Iniciando creación de evento ===');
    console.log('Headers:', req.headers);
    
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
      const userId = req.user._id; // Obtenemos el ID del usuario autenticado
      
      console.log(`✅ Usuario autenticado:`, {
        userId,
        email: req.user.email,
        userType: req.user.userType
      });
      
      console.log('📦 Datos del evento recibidos:', {
        title: eventData.title,
        startDate: eventData.startDate,
        locationType: eventData.locationType,
        isFree: eventData.isFree
      });

      // Validar datos de entrada
      console.log('🔍 Validando datos de entrada...');
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

      // Generar slug a partir del título
      const slugBase = eventData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      // Verificar si el slug ya existe
      let slug = slugBase;
      let counter = 1;
      
      while (true) {
        const [existingSlug] = await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.slug, slug))
          .limit(1);
        
        if (!existingSlug) break;
        slug = `${slugBase}-${++counter}`;
      }

      // Asegurarse de que las fechas sean objetos Date
      const startDate = eventData.startDate ? new Date(eventData.startDate) : new Date();
      const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

      // Preparar datos para la creación con los tipos correctos
      const newEvent = {
        title: eventData.title,
        description: eventData.description,
        shortDescription: eventData.shortDescription || null,
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
        status: 'draft' as const, // Por defecto en borrador
        isFeatured: false, // Por defecto no destacado
        isRecurring: eventData.isRecurring || false,
        recurrencePattern: eventData.recurrencePattern || null,
        categoryId: eventData.categoryId || null,
        subcategories: eventData.subcategories || [],
        tags: eventData.tags || [],
        eventType: eventData.eventType || 'other',
        slug,
        organizerId: userId,
        viewCount: 0,
        saveCount: 0,
        shareCount: 0,
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      };

      // Insertar el evento en la base de datos
      console.log('💾 Guardando evento en la base de datos...');
      let newEventRecord;
      
      try {
        [newEventRecord] = await db
          .insert(events)
          .values(newEvent)
          .returning();
          
        console.log('✅ Evento creado exitosamente:', newEventRecord.id);
        
        res.status(201).json({
          success: true,
          message: 'Evento creado exitosamente',
          data: newEventRecord,
          code: 'EVENT_CREATED'
        });
        
      } catch (error: any) {
        console.error('❌ Error al guardar en la base de datos:', error);
        
        // Manejar diferentes tipos de errores
        if (error.code === '23505') { // Violación de restricción única
          return res.status(409).json({
            success: false,
            error: 'Conflicto',
            message: 'Ya existe un evento con un identificador similar',
            code: 'DUPLICATE_ENTRY'
          });
        }
        
        // Error de base de datos
        if (error.code && typeof error.code === 'string' && error.code.startsWith('23')) {
          return res.status(500).json({
            success: false,
            error: 'Error de base de datos',
            message: 'Ocurrió un error al procesar la solicitud',
            code: 'DATABASE_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        
        // Error general
        return res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
          message: 'No se pudo crear el evento. Por favor, inténtalo de nuevo más tarde.',
          code: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    } catch (error: any) {
      console.error('❌ Error en createEvent:', error);
      
      // Si ya se envió una respuesta, no enviar otra
      if (res.headersSent) {
        console.warn('⚠️  Ya se envió una respuesta, omitiendo manejo de error');
        return;
      }
      
      // Manejar diferentes tipos de errores
      if (error.code === '23505') { // Violación de restricción única
        return res.status(409).json({
          success: false,
          error: 'Conflicto',
          message: 'Ya existe un evento con un identificador similar',
          code: 'DUPLICATE_ENTRY'
        });
      }
      
      // Error de base de datos
      if (error.code && typeof error.code === 'string' && error.code.startsWith('23')) {
        return res.status(500).json({
          success: false,
          error: 'Error de base de datos',
          message: 'Ocurrió un error al procesar la solicitud',
          code: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      // Error general
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear el evento. Por favor, inténtalo de nuevo más tarde.',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ...

  /**
   * Actualiza un evento existente
   */
  static async updateEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventData: UpdateEventInput = req.body;
      const userId = (req as any).user?.id; // Asumiendo que el usuario está autenticado

      // Verificar si el evento existe
      const [existingEvent] = await db
        .select()
        .from(events)
        .where(eq(events.id, parseInt(id, 10)));

      if (!existingEvent) {
        return res.status(404).json({ message: 'Evento no encontrado' });
      }

      // Verificar permisos (solo el organizador puede actualizar)
      if (existingEvent.organizerId !== userId) {
        return res.status(403).json({ 
          message: 'No autorizado para actualizar este evento' 
        });
      }

      // Validar datos de entrada
      const validationResult = updateEventSchema.safeParse(eventData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.issues,
        });
      }

      // Preparar datos para actualización
      const updateData: any = {
        ...eventData,
        updatedAt: new Date(),
      };

      // Si se actualiza el título, generar un nuevo slug
      if (eventData.title && eventData.title !== existingEvent.title) {
        const slugBase = eventData.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        
        // Verificar si el slug ya existe
        let slug = slugBase;
        let counter = 1;
        
        while (true) {
          const [existingSlug] = await db
            .select({ id: events.id })
            .from(events)
            .where(
              and(
                eq(events.slug, slug),
                ne(events.id, existingEvent.id)
              )
            )
            .limit(1);
          
          if (!existingSlug) break;
          slug = `${slugBase}-${++counter}`;
        }
        
        updateData.slug = slug;
      }

      // Actualizar el evento
      const [updatedEvent] = await db
        .update(events)
        .set(updateData)
        .where(eq(events.id, existingEvent.id))
        .returning();

      res.status(200).json(updatedEvent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al actualizar evento:', error);
      res.status(500).json({ 
        message: 'Error al actualizar el evento',
        error: errorMessage
      });
    }
  }

  /**
   * Cancela un evento (actualiza el estado a 'cancelled')
   */
  static async cancelEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Verificar si el evento existe
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, parseInt(id, 10)));

      if (!event) {
        return res.status(404).json({ message: 'Evento no encontrado' });
      }

      // Verificar permisos (solo el organizador puede cancelar)
      if (event.organizerId !== userId) {
        return res.status(403).json({ 
          message: 'No autorizado para cancelar este evento' 
        });
      }

      // Verificar que el evento no esté ya cancelado
      if (event.status === 'cancelled') {
        return res.status(400).json({ 
          message: 'El evento ya está cancelado' 
        });
      }

      // Actualizar estado a cancelado
      await db
        .update(events)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date() 
        })
        .where(eq(events.id, event.id));

      res.status(200).json({ 
        message: 'Evento cancelado correctamente',
        eventId: event.id
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al cancelar evento:', error);
      res.status(500).json({ 
        message: 'Error al cancelar el evento',
        error: errorMessage
      });
    }
  }

  /**
   * Busca eventos según criterios de filtrado
   */
  static async searchEvents(req: Request, res: Response) {
    try {
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
      } = req.query as unknown as EventFilterOptions;

      // Inicializar condiciones de búsqueda
      const conditions = [
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
        
        // Agregar condición para shortDescription solo si no es null
        if (events.shortDescription) {
          searchConditions.push(
            sql`LOWER(${events.shortDescription}::text) LIKE LOWER(${searchTerm}::text)`
          );
        }
        
        if (searchConditions.length > 0) {
          const searchCondition = or(...searchConditions);
          if (searchCondition) {
            conditions.push(searchCondition);
          }
        }
      }

      // Filtrar por categoría
      if (category) {
        conditions.push(eq(categories.name, category));
      }

      // Filtrar por rango de fechas
      if (startDate) {
        conditions.push(gte(events.startDate, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(events.endDate || events.startDate, new Date(endDate)));
      }

      // Filtrar por tipo de evento
      if (eventType && typeof eventType === 'string') {
        // Validar que el tipo de evento sea uno de los permitidos
        const validEventTypes = ['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other'];
        if (validEventTypes.includes(eventType)) {
          conditions.push(eq(events.eventType, eventType as any));
        }
      }

      // Filtrar por ubicación
      if (location && typeof location === 'string') {
        const locationTerm = `%${location}%`;
        const locationConditions: SQL[] = [];
        
        // Solo agregar condiciones para campos que existen en el esquema
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
        
        if (locationConditions.length > 0) {
          const locationCondition = or(...locationConditions);
          if (locationCondition) {
            conditions.push(locationCondition);
          }
        }
      }

      // Filtrar por precio
      if (isFree !== undefined) {
        let isFreeBool: boolean;
        if (typeof isFree === 'string') {
          isFreeBool = isFree === 'true';
        } else {
          isFreeBool = Boolean(isFree);
        }
        conditions.push(eq(events.isFree, isFreeBool));
      }

      // Consulta para obtener los eventos con información del organizador
      const eventsQuery = db
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
        .offset(Number(offset));

      // Ejecutar consultas en paralelo para obtener eventos y conteo total
      const [eventsList, totalCount] = await Promise.all([
        eventsQuery,
        db.select({ count: sql<number>`count(*)` })
          .from(events)
          .leftJoin(users, eq(events.organizerId, users.id))
          .leftJoin(categories, eq(events.categoryId, categories.id))
          .where(and(...conditions))
      ]);

      res.status(200).json({
        data: eventsList,
        pagination: {
          total: Number(totalCount[0]?.count) || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
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
}

// Export the controller class as default
export default EventController;

// Export individual methods for better tree-shaking and direct imports
export const getUpcomingEvents = EventController.getUpcomingEvents;
