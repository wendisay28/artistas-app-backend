import { Response } from 'express';
import { storage } from '../storage/index.js';
import { eq, and } from 'drizzle-orm';
import { companies, venues } from '../schema.js';

export const companyController = {
  // Obtener todas las empresas del usuario autenticado
  async getMyCompanies(req: any, res: Response) {
    // Validar que el usuario esté autenticado
    if (!req.user?.id) {
      console.error('❌ Intento de acceso no autorizado a getMyCompanies');
      return res.status(401).json({ 
        success: false,
        message: 'No autorizado',
        error: 'USER_NOT_AUTHENTICATED'
      });
    }

    const userId = req.user.id;

    try {
      console.log(`🔍 Buscando empresas para el usuario: ${userId}`);
      
      // Verificar que el userId tenga un formato válido
      if (typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('ID de usuario no válido');
      }

      // Obtener las empresas del usuario
      const userCompanies = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.userId, userId))
        .orderBy(companies.createdAt);

      console.log(`✅ Se encontraron ${userCompanies.length} empresas para el usuario ${userId}`);
      
      return res.status(200).json({
        success: true,
        data: userCompanies,
        count: userCompanies.length
      });

    } catch (error) {
      console.error('❌ Error en getMyCompanies:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        timestamp: new Date().toISOString()
      });

      // Manejar diferentes tipos de errores
      if (error instanceof Error) {
        if (error.message.includes('relation "companies" does not exist')) {
          return res.status(500).json({
            success: false,
            message: 'Error en la base de datos: tabla no encontrada',
            error: 'DATABASE_TABLE_NOT_FOUND'
          });
        }
        
        if (error.message.includes('connection')) {
          return res.status(503).json({
            success: false,
            message: 'Error de conexión con la base de datos',
            error: 'DATABASE_CONNECTION_ERROR'
          });
        }
      }

      // Error genérico
      return res.status(500).json({
        success: false,
        message: 'Error al obtener las empresas',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  },

  // Obtener una empresa específica por ID
  async getCompanyById(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const company = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(id)))
        .limit(1);

      if (!company || company.length === 0) {
        return res.status(404).json({ message: 'Empresa no encontrada' });
      }

      // Verificar que el usuario sea el dueño de la empresa
      if (userId && company[0].userId !== userId) {
        // Si no es el dueño, solo devolver información pública
        const publicCompany = {
          ...company[0],
          taxId: undefined,
          email: undefined,
          phone: undefined,
        };
        return res.json(publicCompany);
      }

      return res.json(company[0]);
    } catch (error) {
      console.error('Error al obtener empresa:', error);
      return res.status(500).json({ message: 'Error al obtener empresa' });
    }
  },

  // Crear una nueva empresa
  async createCompany(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const {
        companyName,
        legalName,
        taxId,
        description,
        shortDescription,
        companyType,
        categories,
        subcategories,
        tags,
        contactPerson,
        phone,
        email,
        website,
        socialMedia,
        address,
        city,
        state,
        country,
        postalCode,
        coordinates,
        services,
        amenities,
        capacity,
        rooms,
        openingHours,
        is24h,
        priceRange,
        depositRequired,
        depositAmount,
        logoUrl,
        coverPhotoUrl,
        gallery,
        videoTourUrl,
        isPrimary,
      } = req.body;

      if (!companyName) {
        return res.status(400).json({ message: 'El nombre de la empresa es requerido' });
      }

      // Si es la primera empresa o se marca como principal, actualizar otras empresas
      if (isPrimary) {
        await storage.db
          .update(companies)
          .set({ isPrimary: false })
          .where(eq(companies.userId, userId));
      }

      const newCompany = await storage.db
        .insert(companies)
        .values({
          userId,
          companyName,
          legalName,
          taxId,
          description,
          shortDescription,
          companyType,
          categories: categories || [],
          subcategories: subcategories || [],
          tags: tags || [],
          contactPerson,
          phone,
          email,
          website,
          socialMedia: socialMedia || {},
          address,
          city,
          state,
          country,
          postalCode,
          coordinates,
          services: services || [],
          amenities: amenities || [],
          capacity,
          rooms: rooms || [],
          openingHours: openingHours || {},
          is24h: is24h || false,
          priceRange,
          depositRequired: depositRequired || false,
          depositAmount,
          logoUrl,
          coverPhotoUrl,
          gallery: gallery || [],
          videoTourUrl,
          isPrimary: isPrimary || false,
          isActive: true,
          isVerified: false,
          isProfileComplete: false,
        })
        .returning();

      // Crear automáticamente un venue para que la empresa aparezca en el explorador
      const multimedia = {
        logo: logoUrl,
        cover: coverPhotoUrl,
        gallery: gallery || [],
        video: videoTourUrl,
      };

      const contact = {
        phone,
        email,
        website,
        ...(socialMedia || {}),
      };

      const dailyRate = priceRange?.min || depositAmount || 0;

      await storage.db
        .insert(venues)
        .values({
          companyId: newCompany[0].id,
          name: companyName,
          description: description || shortDescription,
          venueType: companyType,
          services: tags || [],
          address,
          city,
          openingHours: openingHours || {},
          contact,
          multimedia,
          coordinates,
          dailyRate,
          capacity,
          isAvailable: true,
          rating: 0,
          totalReviews: 0,
        });

      console.log(`✅ Empresa y venue creados exitosamente para ${companyName}`);
      return res.status(201).json(newCompany[0]);
    } catch (error) {
      console.error('Error al crear empresa:', error);
      return res.status(500).json({ message: 'Error al crear empresa' });
    }
  },

  // Actualizar una empresa existente
  async updateCompany(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Verificar que la empresa existe y pertenece al usuario
      const existingCompany = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(id)))
        .limit(1);

      if (!existingCompany || existingCompany.length === 0) {
        return res.status(404).json({ message: 'Empresa no encontrada' });
      }

      if (existingCompany[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar esta empresa' });
      }

      const updateData = { ...req.body };
      delete updateData.userId; // No permitir cambiar el dueño
      delete updateData.id; // No permitir cambiar el ID

      // Si se marca como principal, desmarcar otras empresas
      if (updateData.isPrimary) {
        await storage.db
          .update(companies)
          .set({ isPrimary: false })
          .where(and(
            eq(companies.userId, userId),
            eq(companies.id, parseInt(id))
          ));
      }

      const updatedCompany = await storage.db
        .update(companies)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, parseInt(id)))
        .returning();

      // Actualizar también el venue asociado si hay cambios relevantes
      const venueUpdateData: any = {};

      if (updateData.companyName) venueUpdateData.name = updateData.companyName;
      if (updateData.description || updateData.shortDescription) {
        venueUpdateData.description = updateData.description || updateData.shortDescription;
      }
      if (updateData.companyType) venueUpdateData.venueType = updateData.companyType;
      if (updateData.tags) venueUpdateData.services = updateData.tags;
      if (updateData.address) venueUpdateData.address = updateData.address;
      if (updateData.city) venueUpdateData.city = updateData.city;
      if (updateData.openingHours) venueUpdateData.openingHours = updateData.openingHours;
      if (updateData.coordinates) venueUpdateData.coordinates = updateData.coordinates;
      if (updateData.capacity) venueUpdateData.capacity = updateData.capacity;

      // Actualizar multimedia si hay cambios
      const multimedia: any = {};
      if (updateData.logoUrl) multimedia.logo = updateData.logoUrl;
      if (updateData.coverPhotoUrl) multimedia.cover = updateData.coverPhotoUrl;
      if (updateData.gallery) multimedia.gallery = updateData.gallery;
      if (updateData.videoTourUrl) multimedia.video = updateData.videoTourUrl;
      if (Object.keys(multimedia).length > 0) venueUpdateData.multimedia = multimedia;

      // Actualizar contacto si hay cambios
      const contact: any = {};
      if (updateData.phone) contact.phone = updateData.phone;
      if (updateData.email) contact.email = updateData.email;
      if (updateData.website) contact.website = updateData.website;
      if (updateData.socialMedia) Object.assign(contact, updateData.socialMedia);
      if (Object.keys(contact).length > 0) venueUpdateData.contact = contact;

      // Actualizar tarifa diaria si hay cambios
      if (updateData.priceRange?.min || updateData.depositAmount) {
        venueUpdateData.dailyRate = updateData.priceRange?.min || updateData.depositAmount;
      }

      // Solo actualizar el venue si hay cambios
      if (Object.keys(venueUpdateData).length > 0) {
        venueUpdateData.updatedAt = new Date();
        await storage.db
          .update(venues)
          .set(venueUpdateData)
          .where(eq(venues.companyId, parseInt(id)));

        console.log(`✅ Venue actualizado para la empresa ${id}`);
      }

      return res.json(updatedCompany[0]);
    } catch (error) {
      console.error('Error al actualizar empresa:', error);
      return res.status(500).json({ message: 'Error al actualizar empresa' });
    }
  },

  // Eliminar una empresa
  async deleteCompany(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Verificar que la empresa existe y pertenece al usuario
      const existingCompany = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(id)))
        .limit(1);

      if (!existingCompany || existingCompany.length === 0) {
        return res.status(404).json({ message: 'Empresa no encontrada' });
      }

      if (existingCompany[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar esta empresa' });
      }

      await storage.db
        .delete(companies)
        .where(eq(companies.id, parseInt(id)));

      return res.json({ message: 'Empresa eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      return res.status(500).json({ message: 'Error al eliminar empresa' });
    }
  },

  // Marcar una empresa como principal
  async setPrimaryCompany(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Verificar que la empresa existe y pertenece al usuario
      const existingCompany = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(id)))
        .limit(1);

      if (!existingCompany || existingCompany.length === 0) {
        return res.status(404).json({ message: 'Empresa no encontrada' });
      }

      if (existingCompany[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para modificar esta empresa' });
      }

      // Desmarcar todas las empresas del usuario como principales
      await storage.db
        .update(companies)
        .set({ isPrimary: false })
        .where(eq(companies.userId, userId));

      // Marcar la empresa seleccionada como principal
      const updatedCompany = await storage.db
        .update(companies)
        .set({ isPrimary: true })
        .where(eq(companies.id, parseInt(id)))
        .returning();

      return res.json(updatedCompany[0]);
    } catch (error) {
      console.error('Error al establecer empresa principal:', error);
      return res.status(500).json({ message: 'Error al establecer empresa principal' });
    }
  },
};
