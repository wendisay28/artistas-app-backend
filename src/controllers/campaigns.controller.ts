import { Response } from 'express';
import { storage } from '../storage/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { campaigns, campaignApplications } from '../schema.js';

export const campaignsController = {
  // Obtener todas las campañas de una empresa
  async getCompanyCampaigns(req: any, res: Response) {
    try {
      const { companyId } = req.params;

      const companyCampaigns = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.companyId, parseInt(companyId)))
        .orderBy(desc(campaigns.createdAt));

      return res.json(companyCampaigns);
    } catch (error) {
      console.error('Error al obtener campañas de empresa:', error);
      return res.status(500).json({ message: 'Error al obtener campañas' });
    }
  },

  // Obtener campañas del usuario autenticado
  async getMyCampaigns(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const myCampaigns = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, userId))
        .orderBy(desc(campaigns.createdAt));

      return res.json(myCampaigns);
    } catch (error) {
      console.error('Error al obtener mis campañas:', error);
      return res.status(500).json({ message: 'Error al obtener campañas' });
    }
  },

  // Obtener una campaña específica
  async getCampaignById(req: any, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(id)))
        .limit(1);

      if (!campaign || campaign.length === 0) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      // Incrementar view count
      await storage.db
        .update(campaigns)
        .set({ viewCount: (campaign[0].viewCount || 0) + 1 })
        .where(eq(campaigns.id, parseInt(id)));

      return res.json(campaign[0]);
    } catch (error) {
      console.error('Error al obtener campaña:', error);
      return res.status(500).json({ message: 'Error al obtener campaña' });
    }
  },

  // Crear una nueva campaña
  async createCampaign(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const {
        companyId,
        title,
        description,
        shortDescription,
        campaignType,
        compensationType,
        budget,
        compensationDetails,
        requirements,
        deliverables,
        targetAudience,
        platforms,
        startDate,
        endDate,
        applicationDeadline,
        locationType,
        location,
        city,
        featuredImage,
        gallery,
        maxParticipants,
        minFollowers,
        categories,
        tags,
        isPublic,
      } = req.body;

      if (!companyId || !title || !campaignType) {
        return res.status(400).json({
          message: 'Los campos companyId, title y campaignType son requeridos'
        });
      }

      const newCampaign = await storage.db
        .insert(campaigns)
        .values({
          companyId: parseInt(companyId),
          userId,
          title,
          description,
          shortDescription,
          campaignType,
          compensationType,
          budget,
          compensationDetails,
          requirements: requirements || [],
          deliverables: deliverables || [],
          targetAudience,
          platforms: platforms || [],
          startDate,
          endDate,
          applicationDeadline,
          locationType: locationType || 'online',
          location,
          city,
          featuredImage,
          gallery: gallery || [],
          maxParticipants,
          minFollowers,
          categories: categories || [],
          tags: tags || [],
          status: 'draft',
          isPublic: isPublic !== undefined ? isPublic : true,
        })
        .returning();

      return res.status(201).json(newCampaign[0]);
    } catch (error) {
      console.error('Error al crear campaña:', error);
      return res.status(500).json({ message: 'Error al crear campaña' });
    }
  },

  // Actualizar una campaña
  async updateCampaign(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Verificar que la campaña existe y pertenece al usuario
      const existingCampaign = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(id)))
        .limit(1);

      if (!existingCampaign || existingCampaign.length === 0) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      if (existingCampaign[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar esta campaña' });
      }

      const updateData = { ...req.body };
      delete updateData.userId;
      delete updateData.id;
      delete updateData.companyId;

      const updatedCampaign = await storage.db
        .update(campaigns)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, parseInt(id)))
        .returning();

      return res.json(updatedCampaign[0]);
    } catch (error) {
      console.error('Error al actualizar campaña:', error);
      return res.status(500).json({ message: 'Error al actualizar campaña' });
    }
  },

  // Eliminar una campaña
  async deleteCampaign(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const existingCampaign = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(id)))
        .limit(1);

      if (!existingCampaign || existingCampaign.length === 0) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      if (existingCampaign[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar esta campaña' });
      }

      await storage.db
        .delete(campaigns)
        .where(eq(campaigns.id, parseInt(id)));

      return res.json({ message: 'Campaña eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar campaña:', error);
      return res.status(500).json({ message: 'Error al eliminar campaña' });
    }
  },

  // Publicar/despublicar campaña
  async publishCampaign(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { status } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const existingCampaign = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(id)))
        .limit(1);

      if (!existingCampaign || existingCampaign.length === 0) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      if (existingCampaign[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para modificar esta campaña' });
      }

      const updatedCampaign = await storage.db
        .update(campaigns)
        .set({
          status,
          publishedAt: status === 'active' ? new Date() : existingCampaign[0].publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, parseInt(id)))
        .returning();

      return res.json(updatedCampaign[0]);
    } catch (error) {
      console.error('Error al publicar campaña:', error);
      return res.status(500).json({ message: 'Error al publicar campaña' });
    }
  },

  // APLICACIONES A CAMPAÑAS

  // Obtener aplicaciones de una campaña
  async getCampaignApplications(req: any, res: Response) {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Verificar que el usuario sea el dueño de la campaña
      const campaign = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(campaignId)))
        .limit(1);

      if (!campaign || campaign.length === 0) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      if (campaign[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para ver estas aplicaciones' });
      }

      const applications = await storage.db
        .select()
        .from(campaignApplications)
        .where(eq(campaignApplications.campaignId, parseInt(campaignId)))
        .orderBy(desc(campaignApplications.appliedAt));

      return res.json(applications);
    } catch (error) {
      console.error('Error al obtener aplicaciones:', error);
      return res.status(500).json({ message: 'Error al obtener aplicaciones' });
    }
  },

  // Aplicar a una campaña
  async applyToCampaign(req: any, res: Response) {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const {
        message,
        portfolio,
        socialLinks,
        expectedDelivery,
        followerCount,
        previousWork,
      } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'El mensaje es requerido' });
      }

      // Verificar que la campaña existe y está activa
      const campaign = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(campaignId)))
        .limit(1);

      if (!campaign || campaign.length === 0) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      if (campaign[0].status !== 'active') {
        return res.status(400).json({ message: 'Esta campaña no está aceptando aplicaciones' });
      }

      // No permitir al dueño aplicar a su propia campaña
      if (campaign[0].userId === userId) {
        return res.status(400).json({ message: 'No puedes aplicar a tu propia campaña' });
      }

      const newApplication = await storage.db
        .insert(campaignApplications)
        .values({
          campaignId: parseInt(campaignId),
          userId,
          message,
          portfolio,
          socialLinks: socialLinks || {},
          expectedDelivery,
          followerCount: followerCount || {},
          previousWork: previousWork || [],
          status: 'pending',
        })
        .returning();

      // Incrementar contador de aplicaciones
      await storage.db
        .update(campaigns)
        .set({
          applicationCount: (campaign[0].applicationCount || 0) + 1
        })
        .where(eq(campaigns.id, parseInt(campaignId)));

      return res.status(201).json(newApplication[0]);
    } catch (error: any) {
      console.error('Error al aplicar a campaña:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Ya aplicaste a esta campaña' });
      }
      return res.status(500).json({ message: 'Error al aplicar a campaña' });
    }
  },

  // Actualizar estado de aplicación
  async updateApplicationStatus(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { status, companyNotes } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Verificar que la aplicación existe
      const application = await storage.db
        .select()
        .from(campaignApplications)
        .where(eq(campaignApplications.id, parseInt(id)))
        .limit(1);

      if (!application || application.length === 0) {
        return res.status(404).json({ message: 'Aplicación no encontrada' });
      }

      // Verificar que el usuario sea el dueño de la campaña
      const campaign = await storage.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, application[0].campaignId))
        .limit(1);

      if (!campaign || campaign.length === 0) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      if (campaign[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar esta aplicación' });
      }

      const updatedApplication = await storage.db
        .update(campaignApplications)
        .set({
          status,
          companyNotes,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(campaignApplications.id, parseInt(id)))
        .returning();

      return res.json(updatedApplication[0]);
    } catch (error) {
      console.error('Error al actualizar aplicación:', error);
      return res.status(500).json({ message: 'Error al actualizar aplicación' });
    }
  },
};
