import { Request, Response } from 'express';
import { storage } from '../storage/index.js';
import { eq, and } from 'drizzle-orm';
import { companies } from '../schema.js';

export const companyController = {
  // Obtener todas las empresas del usuario autenticado
  async getMyCompanies(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const userCompanies = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.userId, userId))
        .orderBy(companies.createdAt);

      return res.json(userCompanies);
    } catch (error) {
      console.error('Error al obtener empresas del usuario:', error);
      return res.status(500).json({ message: 'Error al obtener empresas' });
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
