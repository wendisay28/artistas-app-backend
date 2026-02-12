import { Request, Response } from 'express';
import { db } from '../db.js';
import { and, eq, gte, lte, or, sql, SQL, desc, inArray, ilike } from 'drizzle-orm';
import { users, artists, events, venues, services, artworks, categories, highlightPhotos } from '../schema.js';

/**
 * Controlador para el explorador
 * Maneja las consultas de búsqueda y filtrado para artistas, eventos, servicios, obras, etc.
 */
class ExplorerController {
  /**
   * Obtiene artistas para el explorador con filtros
   * GET /api/v1/explorer/artists
   */
  static async getArtists(req: Request, res: Response) {
    try {
      const {
        query,
        city,
        category,
        tags,
        minPrice,
        maxPrice,
        discipline, // Subcategoría/disciplina del artista
        role, // Tipo de artista (músico, pintor, etc.)
        sortBy, // Ordenamiento: rating, price, newest
        limit = '20',
        offset = '0',
      } = req.query;

      const conditions: SQL[] = [];

      // Solo mostrar usuarios con userType = 'artist'
      conditions.push(eq(users.userType, 'artist'));

      // Solo mostrar artistas con show_in_explorer = true
      // conditions.push(eq(users.showInExplorer, true)); // Este campo se agregará en la migración

      // Filtrar por ciudad
      if (city && typeof city === 'string') {
        conditions.push(eq(users.city, city));
      }

      // Filtrar por categoría (usando categoryId del artist)
      if (category && typeof category === 'string') {
        const categoryId = parseInt(category);
        if (!isNaN(categoryId)) {
          conditions.push(eq(artists.categoryId, categoryId));
        }
      }

      // Filtrar por disciplina/subcategoría (busca en tags o artistType)
      if (discipline && typeof discipline === 'string') {
        const disciplineTerm = `%${discipline}%`;
        conditions.push(
          or(
            sql`LOWER(${artists.artistType}::text) LIKE LOWER(${disciplineTerm}::text)`,
            sql`${artists.tags}::text ILIKE ${disciplineTerm}`
          ) as SQL
        );
      }

      // Filtrar por rol/tipo de artista
      if (role && typeof role === 'string') {
        const roleTerm = `%${role}%`;
        conditions.push(sql`LOWER(${artists.artistType}::text) LIKE LOWER(${roleTerm}::text)`);
      }

      // Filtrar por precio máximo
      if (maxPrice && typeof maxPrice === 'string') {
        const maxPriceNum = parseFloat(maxPrice);
        if (!isNaN(maxPriceNum)) {
          conditions.push(lte(artists.pricePerHour, maxPriceNum.toString()));
        }
      }

      // Filtrar por precio mínimo
      if (minPrice && typeof minPrice === 'string') {
        const minPriceNum = parseFloat(minPrice);
        if (!isNaN(minPriceNum)) {
          conditions.push(gte(artists.pricePerHour, minPriceNum.toString()));
        }
      }

      // Búsqueda por texto
      if (query && typeof query === 'string') {
        const searchTerm = `%${query}%`;
        const searchConditions: SQL[] = [
          sql`LOWER(${users.firstName}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${users.lastName}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${users.displayName}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${users.bio}::text) LIKE LOWER(${searchTerm}::text)`,
        ];

        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      // Construir query
      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const artistsList = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          profileImageUrl: users.profileImageUrl,
          city: users.city,
          bio: users.bio,
          rating: users.rating,
          totalReviews: users.totalReviews,
          userType: users.userType,
          isVerified: users.isVerified,
          isAvailable: users.isAvailable,
          website: users.website,
          socialMedia: users.socialMedia,
          artistData: {
            id: artists.id,
            artistName: artists.artistName,
            stageName: artists.stageName,
            categoryId: artists.categoryId,
            tags: artists.tags,
            pricePerHour: artists.pricePerHour,
            baseCity: artists.baseCity,
            yearsOfExperience: artists.yearsOfExperience,
            experience: artists.experience,
            artistType: artists.artistType,
            travelAvailability: artists.travelAvailability,
            travelDistance: artists.travelDistance,
            hourlyRate: artists.hourlyRate,
            pricingType: artists.pricingType,
            priceRange: artists.priceRange,
            availability: artists.availability,
            languages: artists.languages,
            licenses: artists.licenses,
            linkedAccounts: artists.linkedAccounts,
          },
        })
        .from(users)
        .leftJoin(artists, eq(users.id, artists.userId))
        .where(whereCondition)
        .orderBy(
          sortBy === 'price' ? artists.pricePerHour :
          sortBy === 'newest' ? desc(users.createdAt) :
          desc(users.rating) // default: rating
        )
        .limit(Number(limit))
        .offset(Number(offset));

      // Contar total
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .leftJoin(artists, eq(users.id, artists.userId))
        .where(whereCondition);

      // Obtener fotos destacadas para cada artista (resiliente si la tabla no existe)
      let artistsWithPhotos: typeof artistsList & { highlightPhotos?: string[] }[];
      try {
        artistsWithPhotos = await Promise.all(
          artistsList.map(async (artist) => {
            try {
              const featuredPhotos = await db
                .select({
                  imageUrl: highlightPhotos.imageUrl,
                })
                .from(highlightPhotos)
                .where(eq(highlightPhotos.userId, artist.id))
                .orderBy(highlightPhotos.position)
                .limit(4);

              return {
                ...artist,
                highlightPhotos: featuredPhotos.map(photo => photo.imageUrl),
              };
            } catch {
              return { ...artist, highlightPhotos: [] };
            }
          })
        );
      } catch {
        artistsWithPhotos = artistsList.map(artist => ({ ...artist, highlightPhotos: [] }));
      }

      res.status(200).json({
        data: artistsWithPhotos,
        pagination: {
          total: Number(totalResult?.count) || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      console.error('Error al obtener artistas del explorador:', error);
      res.status(500).json({
        message: 'Error al obtener artistas',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene eventos para el explorador con filtros
   * GET /api/v1/explorer/events
   */
  static async getEvents(req: Request, res: Response) {
    try {
      const {
        query,
        city,
        startDate,
        endDate,
        isFree,
        limit = '20',
        offset = '0',
      } = req.query;

      const conditions: SQL[] = [
        eq(events.status, 'published'),
      ];

      // Solo eventos futuros
      conditions.push(gte(events.startDate, new Date()));

      // Filtrar por ciudad
      if (city && typeof city === 'string') {
        conditions.push(eq(events.city, city));
      }

      // Filtrar por rango de fechas
      if (startDate && typeof startDate === 'string') {
        conditions.push(gte(events.startDate, new Date(startDate)));
      }
      if (endDate && typeof endDate === 'string') {
        conditions.push(lte(events.endDate || events.startDate, new Date(endDate)));
      }

      // Filtrar por eventos gratis
      if (isFree !== undefined) {
        const isFreeBool = typeof isFree === 'string' ? isFree === 'true' : Boolean(isFree);
        conditions.push(eq(events.isFree, isFreeBool));
      }

      // Búsqueda por texto
      if (query && typeof query === 'string') {
        const searchTerm = `%${query}%`;
        const searchConditions: SQL[] = [
          sql`LOWER(${events.title}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${events.description}::text) LIKE LOWER(${searchTerm}::text)`,
        ];

        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const eventsList = await db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          description: events.description,
          shortDescription: events.shortDescription,
          startDate: events.startDate,
          endDate: events.endDate,
          city: events.city,
          address: events.address,
          featuredImage: events.featuredImage,
          gallery: events.gallery,
          isFree: events.isFree,
          ticketPrice: events.ticketPrice,
          tags: events.tags,
          eventType: events.eventType,
          capacity: events.capacity,
          companyId: events.companyId,
          venueId: events.venueId,
          status: events.status,
          coordinates: events.coordinates,
          organizer: {
            id: users.id,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(...conditions))
        .orderBy(events.startDate)
        .limit(Number(limit))
        .offset(Number(offset));

      // Contar total
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(and(...conditions));

      res.status(200).json({
        data: eventsList,
        pagination: {
          total: Number(totalResult?.count) || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      console.error('Error al obtener eventos del explorador:', error);
      res.status(500).json({
        message: 'Error al obtener eventos',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene lugares/venues para el explorador
   * GET /api/v1/explorer/venues
   */
  static async getVenues(req: Request, res: Response) {
    try {
      const {
        query,
        city,
        limit = '20',
        offset = '0',
      } = req.query;

      const conditions: SQL[] = [
        eq(venues.isAvailable, true),
      ];

      // Filtrar por ciudad
      if (city && typeof city === 'string') {
        conditions.push(eq(venues.city, city));
      }

      // Búsqueda por texto
      if (query && typeof query === 'string') {
        const searchTerm = `%${query}%`;
        const searchConditions: SQL[] = [
          sql`LOWER(${venues.name}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${venues.description}::text) LIKE LOWER(${searchTerm}::text)`,
        ];

        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const venuesList = await db
        .select({
          id: venues.id,
          companyId: venues.companyId,
          name: venues.name,
          description: venues.description,
          city: venues.city,
          address: venues.address,
          venueType: venues.venueType,
          services: venues.services,
          capacity: venues.capacity,
          rating: venues.rating,
          totalReviews: venues.totalReviews,
          multimedia: venues.multimedia,
          openingHours: venues.openingHours,
          contact: venues.contact,
          dailyRate: venues.dailyRate,
          coordinates: venues.coordinates,
        })
        .from(venues)
        .where(and(...conditions))
        .orderBy(desc(venues.rating))
        .limit(Number(limit))
        .offset(Number(offset));

      // Contar total
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(venues)
        .where(and(...conditions));

      res.status(200).json({
        data: venuesList,
        pagination: {
          total: Number(totalResult?.count) || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      console.error('Error al obtener venues del explorador:', error);
      res.status(500).json({
        message: 'Error al obtener venues',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene servicios para el explorador
   * GET /api/v1/explorer/services
   */
  static async getServices(req: Request, res: Response) {
    try {
      // Verificar si la tabla services existe
      try {
        await db.select({ id: services.id }).from(services).limit(0);
      } catch {
        return res.status(200).json({ data: [], pagination: { total: 0, limit: 20, offset: 0 } });
      }
      const {
        query,
        category,
        minPrice,
        maxPrice,
        limit = '20',
        offset = '0',
      } = req.query;

      const conditions: SQL[] = [
        eq(services.isActive, true),
      ];

      // Filtrar por categoría
      if (category && typeof category === 'string') {
        conditions.push(eq(services.category, category));
      }

      // Filtrar por precio
      if (minPrice && typeof minPrice === 'string') {
        conditions.push(gte(services.price, minPrice));
      }
      if (maxPrice && typeof maxPrice === 'string') {
        conditions.push(lte(services.price, maxPrice));
      }

      // Búsqueda por texto
      if (query && typeof query === 'string') {
        const searchTerm = `%${query}%`;
        const searchConditions: SQL[] = [
          sql`LOWER(${services.name}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${services.description}::text) LIKE LOWER(${searchTerm}::text)`,
        ];

        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const servicesList = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          price: services.price,
          duration: services.duration,
          category: services.category,
          images: services.images,
          provider: {
            id: users.id,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
            city: users.city,
          },
        })
        .from(services)
        .leftJoin(users, eq(services.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(services.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      // Contar total
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(services)
        .where(and(...conditions));

      res.status(200).json({
        data: servicesList,
        pagination: {
          total: Number(totalResult?.count) || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      console.error('Error al obtener servicios del explorador:', error);
      res.status(500).json({
        message: 'Error al obtener servicios',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene obras de arte para el explorador
   * GET /api/v1/explorer/artworks
   */
  static async getArtworks(req: Request, res: Response) {
    try {
      // Verificar si la tabla artworks existe
      try {
        await db.select({ id: artworks.id }).from(artworks).limit(0);
      } catch {
        return res.status(200).json({ data: [], pagination: { total: 0, limit: 20, offset: 0 } });
      }
      const {
        query,
        category,
        city,
        minPrice,
        maxPrice,
        available,
        limit = '20',
        offset = '0',
      } = req.query;

      const conditions: SQL[] = [
        eq(artworks.showInExplorer, true),
      ];

      // Filtrar por categoría
      if (category && typeof category === 'string') {
        const validCategories = ['pintura', 'escultura', 'libro', 'fotografía', 'digital', 'otro'];
        if (validCategories.includes(category as any)) {
          conditions.push(eq(artworks.category, category as any));
        }
      }

      // Filtrar por ciudad
      if (city && typeof city === 'string') {
        conditions.push(eq(artworks.city, city));
      }

      // Filtrar por disponibilidad
      if (available !== undefined) {
        const availableBool = typeof available === 'string' ? available === 'true' : Boolean(available);
        conditions.push(eq(artworks.available, availableBool));
      }

      // Filtrar por precio
      if (minPrice && typeof minPrice === 'string') {
        conditions.push(gte(artworks.price, minPrice));
      }
      if (maxPrice && typeof maxPrice === 'string') {
        conditions.push(lte(artworks.price, maxPrice));
      }

      // Búsqueda por texto
      if (query && typeof query === 'string') {
        const searchTerm = `%${query}%`;
        const searchConditions: SQL[] = [
          sql`LOWER(${artworks.name}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${artworks.description}::text) LIKE LOWER(${searchTerm}::text)`,
        ];

        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const artworksList = await db
        .select({
          id: artworks.id,
          name: artworks.name,
          description: artworks.description,
          category: artworks.category,
          images: artworks.images,
          price: artworks.price,
          dimensions: artworks.dimensions,
          materials: artworks.materials,
          year: artworks.year,
          available: artworks.available,
          stock: artworks.stock,
          city: artworks.city,
          tags: artworks.tags,
          views: artworks.views,
          likes: artworks.likes,
          artist: {
            id: users.id,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(artworks)
        .leftJoin(users, eq(artworks.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(artworks.views))
        .limit(Number(limit))
        .offset(Number(offset));

      // Contar total
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(artworks)
        .where(and(...conditions));

      res.status(200).json({
        data: artworksList,
        pagination: {
          total: Number(totalResult?.count) || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      console.error('Error al obtener artworks del explorador:', error);
      res.status(500).json({
        message: 'Error al obtener artworks',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene servicios del usuario actual
   * GET /api/v1/explorer/services/me
   */
  static async getUserServices(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const userServices = await db
        .select()
        .from(services)
        .where(eq(services.userId, userId))
        .orderBy(desc(services.createdAt));

      res.status(200).json(userServices);
    } catch (error: any) {
      console.error('Error al obtener servicios del usuario:', error);
      res.status(500).json({
        message: 'Error al obtener servicios',
        error: error.message,
      });
    }
  }

  /**
   * Crea un nuevo servicio
   * POST /api/v1/explorer/services
   */
  static async createService(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { name, description, price, duration, category, images } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'El nombre del servicio es requerido' });
      }

      const [newService] = await db
        .insert(services)
        .values({
          userId,
          name,
          description: description || null,
          price: price || null,
          duration: duration || null,
          category: category || null,
          images: images || [],
          isActive: true,
        })
        .returning();

      res.status(201).json(newService);
    } catch (error: any) {
      console.error('Error al crear servicio:', error);
      res.status(500).json({
        message: 'Error al crear servicio',
        error: error.message,
      });
    }
  }

  /**
   * Actualiza un servicio existente
   * PATCH /api/v1/explorer/services/:id
   */
  static async updateService(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const serviceId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (isNaN(serviceId)) {
        return res.status(400).json({ message: 'ID de servicio inválido' });
      }

      // Verificar que el servicio pertenece al usuario
      const [existingService] = await db
        .select()
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.userId, userId)));

      if (!existingService) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      const updateData: any = {};
      const { name, description, price, duration, category, images, isActive } = req.body;

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (duration !== undefined) updateData.duration = duration;
      if (category !== undefined) updateData.category = category;
      if (images !== undefined) updateData.images = images;
      if (isActive !== undefined) updateData.isActive = isActive;
      updateData.updatedAt = new Date();

      const [updatedService] = await db
        .update(services)
        .set(updateData)
        .where(eq(services.id, serviceId))
        .returning();

      res.status(200).json(updatedService);
    } catch (error: any) {
      console.error('Error al actualizar servicio:', error);
      res.status(500).json({
        message: 'Error al actualizar servicio',
        error: error.message,
      });
    }
  }

  /**
   * Elimina un servicio
   * DELETE /api/v1/explorer/services/:id
   */
  static async deleteService(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const serviceId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (isNaN(serviceId)) {
        return res.status(400).json({ message: 'ID de servicio inválido' });
      }

      // Verificar que el servicio pertenece al usuario
      const [existingService] = await db
        .select()
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.userId, userId)));

      if (!existingService) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      await db
        .delete(services)
        .where(eq(services.id, serviceId));

      res.status(200).json({ message: 'Servicio eliminado correctamente' });
    } catch (error: any) {
      console.error('Error al eliminar servicio:', error);
      res.status(500).json({
        message: 'Error al eliminar servicio',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene obras de arte del usuario actual
   * GET /api/v1/explorer/artworks/me
   */
  static async getUserArtworks(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const userArtworks = await db
        .select()
        .from(artworks)
        .where(eq(artworks.userId, userId))
        .orderBy(desc(artworks.createdAt));

      res.status(200).json(userArtworks);
    } catch (error: any) {
      console.error('Error al obtener obras de arte del usuario:', error);
      res.status(500).json({
        message: 'Error al obtener obras de arte',
        error: error.message,
      });
    }
  }

  /**
   * Crea una nueva obra de arte
   * POST /api/v1/explorer/artworks
   */
  static async createArtwork(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const {
        name,
        description,
        category,
        images,
        price,
        dimensions,
        materials,
        year,
        available,
        stock,
        city,
        tags,
        showInExplorer,
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'El nombre de la obra es requerido' });
      }

      const [newArtwork] = await db
        .insert(artworks)
        .values({
          userId,
          name,
          description: description || null,
          category: category || null,
          images: images || [],
          price: price || null,
          dimensions: dimensions || null,
          materials: materials || [],
          year: year || null,
          available: available !== undefined ? available : true,
          stock: stock || 1,
          city: city || null,
          tags: tags || [],
          showInExplorer: showInExplorer !== undefined ? showInExplorer : true,
        })
        .returning();

      res.status(201).json(newArtwork);
    } catch (error: any) {
      console.error('Error al crear obra de arte:', error);
      res.status(500).json({
        message: 'Error al crear obra de arte',
        error: error.message,
      });
    }
  }

  /**
   * Actualiza una obra de arte existente
   * PATCH /api/v1/explorer/artworks/:id
   */
  static async updateArtwork(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const artworkId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (isNaN(artworkId)) {
        return res.status(400).json({ message: 'ID de obra inválido' });
      }

      // Verificar que la obra pertenece al usuario
      const [existingArtwork] = await db
        .select()
        .from(artworks)
        .where(and(eq(artworks.id, artworkId), eq(artworks.userId, userId)));

      if (!existingArtwork) {
        return res.status(404).json({ message: 'Obra de arte no encontrada' });
      }

      const updateData: any = {};
      const {
        name,
        description,
        category,
        images,
        price,
        dimensions,
        materials,
        year,
        available,
        stock,
        city,
        tags,
        showInExplorer,
      } = req.body;

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (images !== undefined) updateData.images = images;
      if (price !== undefined) updateData.price = price;
      if (dimensions !== undefined) updateData.dimensions = dimensions;
      if (materials !== undefined) updateData.materials = materials;
      if (year !== undefined) updateData.year = year;
      if (available !== undefined) updateData.available = available;
      if (stock !== undefined) updateData.stock = stock;
      if (city !== undefined) updateData.city = city;
      if (tags !== undefined) updateData.tags = tags;
      if (showInExplorer !== undefined) updateData.showInExplorer = showInExplorer;
      updateData.updatedAt = new Date();

      const [updatedArtwork] = await db
        .update(artworks)
        .set(updateData)
        .where(eq(artworks.id, artworkId))
        .returning();

      res.status(200).json(updatedArtwork);
    } catch (error: any) {
      console.error('Error al actualizar obra de arte:', error);
      res.status(500).json({
        message: 'Error al actualizar obra de arte',
        error: error.message,
      });
    }
  }

  /**
   * Elimina una obra de arte
   * DELETE /api/v1/explorer/artworks/:id
   */
  static async deleteArtwork(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const artworkId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (isNaN(artworkId)) {
        return res.status(400).json({ message: 'ID de obra inválido' });
      }

      // Verificar que la obra pertenece al usuario
      const [existingArtwork] = await db
        .select()
        .from(artworks)
        .where(and(eq(artworks.id, artworkId), eq(artworks.userId, userId)));

      if (!existingArtwork) {
        return res.status(404).json({ message: 'Obra de arte no encontrada' });
      }

      await db
        .delete(artworks)
        .where(eq(artworks.id, artworkId));

      res.status(200).json({ message: 'Obra de arte eliminada correctamente' });
    } catch (error: any) {
      console.error('Error al eliminar obra de arte:', error);
      res.status(500).json({
        message: 'Error al eliminar obra de arte',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene todos los datos del explorador (combinados)
   * GET /api/v1/explorer/all
   */
  static async getAll(req: Request, res: Response) {
    try {
      const { city, limit = '10' } = req.query;

      // Obtener artistas destacados
      const artistsConditions: SQL[] = [];
      if (city && typeof city === 'string') {
        artistsConditions.push(eq(users.city, city));
      }
      const artistsWhere = artistsConditions.length > 0 ? and(...artistsConditions) : undefined;

      const topArtists = await db
        .select({
          id: users.id,
          name: users.displayName,
          profileImageUrl: users.profileImageUrl,
          city: users.city,
          rating: users.rating,
        })
        .from(users)
        .leftJoin(artists, eq(users.id, artists.userId))
        .where(artistsWhere)
        .orderBy(desc(users.rating))
        .limit(Number(limit));

      // Obtener próximos eventos
      const eventsConditions: SQL[] = [
        eq(events.status, 'published'),
        gte(events.startDate, new Date()),
      ];
      if (city && typeof city === 'string') {
        eventsConditions.push(eq(events.city, city));
      }

      const upcomingEvents = await db
        .select({
          id: events.id,
          title: events.title,
          startDate: events.startDate,
          city: events.city,
          featuredImage: events.featuredImage,
        })
        .from(events)
        .where(and(...eventsConditions))
        .orderBy(events.startDate)
        .limit(Number(limit));

      // Obtener venues destacados
      const venuesConditions: SQL[] = [eq(venues.isAvailable, true)];
      if (city && typeof city === 'string') {
        venuesConditions.push(eq(venues.city, city));
      }

      const topVenues = await db
        .select({
          id: venues.id,
          name: venues.name,
          city: venues.city,
          rating: venues.rating,
        })
        .from(venues)
        .where(and(...venuesConditions))
        .orderBy(desc(venues.rating))
        .limit(Number(limit));

      // Obtener artworks destacados
      const artworksConditions: SQL[] = [eq(artworks.showInExplorer, true)];
      if (city && typeof city === 'string') {
        artworksConditions.push(eq(artworks.city, city));
      }

      const topArtworks = await db
        .select({
          id: artworks.id,
          name: artworks.name,
          images: artworks.images,
          price: artworks.price,
          city: artworks.city,
        })
        .from(artworks)
        .where(and(...artworksConditions))
        .orderBy(desc(artworks.views))
        .limit(Number(limit));

      res.status(200).json({
        artists: topArtists,
        events: upcomingEvents,
        venues: topVenues,
        artworks: topArtworks,
      });
    } catch (error: any) {
      console.error('Error al obtener datos del explorador:', error);
      res.status(500).json({
        message: 'Error al obtener datos del explorador',
        error: error.message,
      });
    }
  }

  /**
   * Buscar artistas por nombre
   * GET /api/v1/explorer/artists/search?q=query&limit=5
   */
  static async searchArtists(req: Request, res: Response) {
    try {
      const { q, limit = '5' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json([]);
      }

      const searchQuery = `%${q.trim()}%`;
      const limitNum = Math.min(parseInt(limit as string) || 5, 20);

      // Usar SQL directo para evitar problemas con NULLs
      const results = await db.execute(sql`
        SELECT
          a.id,
          u.id as "userId",
          COALESCE(u.display_name, u.first_name || ' ' || COALESCE(u.last_name, ''), a.artist_name, 'Artista') as name,
          a.stage_name as profession,
          c.code as category,
          u.profile_image_url as "profileImageUrl"
        FROM artists a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE
          u.display_name ILIKE ${searchQuery} OR
          u.first_name ILIKE ${searchQuery} OR
          u.last_name ILIKE ${searchQuery} OR
          a.artist_name ILIKE ${searchQuery} OR
          a.stage_name ILIKE ${searchQuery} OR
          (u.first_name || ' ' || COALESCE(u.last_name, '')) ILIKE ${searchQuery}
        LIMIT ${limitNum}
      `);

      res.json((results as any).rows || results);
    } catch (error: any) {
      console.error('Error searching artists:', error);
      res.status(500).json({ message: 'Error al buscar artistas', error: error.message });
    }
  }

  /**
   * Buscar eventos por título
   * GET /api/v1/events/search?q=query&limit=5
   */
  static async searchEvents(req: Request, res: Response) {
    try {
      const { q, limit = '5' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({ success: true, data: [] });
      }

      const searchQuery = q.trim().toLowerCase();
      const limitNum = Math.min(parseInt(limit as string) || 5, 20);

      const results = await db
        .select({
          id: events.id,
          title: events.title,
          startDate: events.startDate,
          featuredImage: events.featuredImage,
          city: events.city,
          eventType: events.eventType,
        })
        .from(events)
        .where(
          or(
            ilike(events.title, `%${searchQuery}%`),
            ilike(events.description, `%${searchQuery}%`)
          )
        )
        .orderBy(desc(events.startDate))
        .limit(limitNum);

      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('Error searching events:', error);
      res.status(500).json({ message: 'Error al buscar eventos', error: error.message });
    }
  }
}

export default ExplorerController;
