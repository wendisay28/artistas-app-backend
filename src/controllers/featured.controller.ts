import { Request, Response } from 'express';
import { db } from '../db';
import { featuredItems } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createFeaturedItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Asumiendo que tienes autenticación configurada
    const { title, description, url, type, thumbnailUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const [newItem] = await db
      .insert(featuredItems)
      .values({
        userId,
        title,
        description,
        url,
        type,
        thumbnailUrl,
      })
      .returning();

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error al crear elemento destacado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getUserFeaturedItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.userId || userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'ID de usuario no proporcionado' });
    }

    const items = await db
      .select()
      .from(featuredItems)
      .where(eq(featuredItems.userId, targetUserId))
      .orderBy(featuredItems.createdAt);

    res.json(items);
  } catch (error) {
    console.error('Error al obtener elementos destacados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateFeaturedItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;
    const { title, description } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const [updatedItem] = await db
      .update(featuredItems)
      .set({
        title,
        description,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(featuredItems.id, parseInt(itemId)),
          eq(featuredItems.userId, userId)
        )
      )
      .returning();

    if (!updatedItem) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Error al actualizar elemento destacado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteFeaturedItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;

    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const [deletedItem] = await db
      .delete(featuredItems)
      .where(
        and(
          eq(featuredItems.id, parseInt(itemId)),
          eq(featuredItems.userId, userId)
        )
      )
      .returning();

    if (!deletedItem) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    res.json({ message: 'Elemento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar elemento destacado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
