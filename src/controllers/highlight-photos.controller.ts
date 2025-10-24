import { Request, Response } from 'express';
import { db } from '../db.js';
import { highlightPhotos } from '../schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Obtiene las fotos destacadas del usuario autenticado
 */
export const getMyHighlightPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const photos = await db
      .select()
      .from(highlightPhotos)
      .where(eq(highlightPhotos.userId, userId))
      .orderBy(highlightPhotos.position);

    res.json(photos);
  } catch (error) {
    console.error('Error al obtener fotos destacadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene las fotos destacadas de un usuario específico (público)
 */
export const getUserHighlightPhotos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario no proporcionado' });
    }

    const photos = await db
      .select()
      .from(highlightPhotos)
      .where(eq(highlightPhotos.userId, userId))
      .orderBy(highlightPhotos.position);

    res.json(photos);
  } catch (error) {
    console.error('Error al obtener fotos destacadas del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Crea o actualiza una foto destacada en una posición específica
 */
export const upsertHighlightPhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { imageUrl, position, caption } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Validar posición
    if (!position || position < 1 || position > 4) {
      return res.status(400).json({ error: 'La posición debe ser entre 1 y 4' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'La URL de la imagen es requerida' });
    }

    // Verificar si ya existe una foto en esa posición
    const existingPhoto = await db
      .select()
      .from(highlightPhotos)
      .where(
        and(
          eq(highlightPhotos.userId, userId),
          eq(highlightPhotos.position, position)
        )
      )
      .limit(1);

    if (existingPhoto.length > 0) {
      // Actualizar foto existente
      const [updatedPhoto] = await db
        .update(highlightPhotos)
        .set({
          imageUrl,
          caption,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(highlightPhotos.userId, userId),
            eq(highlightPhotos.position, position)
          )
        )
        .returning();

      return res.json(updatedPhoto);
    } else {
      // Crear nueva foto
      const [newPhoto] = await db
        .insert(highlightPhotos)
        .values({
          userId,
          imageUrl,
          position,
          caption,
        })
        .returning();

      return res.status(201).json(newPhoto);
    }
  } catch (error) {
    console.error('Error al guardar foto destacada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Actualiza múltiples fotos destacadas a la vez
 */
export const updateHighlightPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { photos } = req.body; // Array de { position, imageUrl, caption }

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar un array de fotos' });
    }

    // Validar que todas las fotos tengan posiciones válidas
    for (const photo of photos) {
      if (!photo.position || photo.position < 1 || photo.position > 4) {
        return res.status(400).json({
          error: `Posición inválida: ${photo.position}. Debe ser entre 1 y 4`
        });
      }
      if (!photo.imageUrl) {
        return res.status(400).json({
          error: `La imagen en la posición ${photo.position} requiere una URL`
        });
      }
    }

    const updatedPhotos = [];

    for (const photo of photos) {
      const { position, imageUrl, caption } = photo;

      // Verificar si ya existe
      const existing = await db
        .select()
        .from(highlightPhotos)
        .where(
          and(
            eq(highlightPhotos.userId, userId),
            eq(highlightPhotos.position, position)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Actualizar
        const [updated] = await db
          .update(highlightPhotos)
          .set({
            imageUrl,
            caption,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(highlightPhotos.userId, userId),
              eq(highlightPhotos.position, position)
            )
          )
          .returning();

        updatedPhotos.push(updated);
      } else {
        // Insertar
        const [inserted] = await db
          .insert(highlightPhotos)
          .values({
            userId,
            imageUrl,
            position,
            caption,
          })
          .returning();

        updatedPhotos.push(inserted);
      }
    }

    res.json(updatedPhotos);
  } catch (error) {
    console.error('Error al actualizar fotos destacadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Elimina una foto destacada
 */
export const deleteHighlightPhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { position } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const positionNum = parseInt(position);
    if (isNaN(positionNum) || positionNum < 1 || positionNum > 4) {
      return res.status(400).json({ error: 'Posición inválida' });
    }

    const [deletedPhoto] = await db
      .delete(highlightPhotos)
      .where(
        and(
          eq(highlightPhotos.userId, userId),
          eq(highlightPhotos.position, positionNum)
        )
      )
      .returning();

    if (!deletedPhoto) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    res.json({ message: 'Foto eliminada correctamente', photo: deletedPhoto });
  } catch (error) {
    console.error('Error al eliminar foto destacada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Verifica si el usuario tiene las 4 fotos destacadas completas
 */
export const checkHighlightPhotosComplete = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const photos = await db
      .select()
      .from(highlightPhotos)
      .where(eq(highlightPhotos.userId, userId));

    const isComplete = photos.length === 4;
    const missingPositions = [1, 2, 3, 4].filter(
      pos => !photos.some(p => p.position === pos)
    );

    res.json({
      isComplete,
      totalPhotos: photos.length,
      requiredPhotos: 4,
      missingPositions,
    });
  } catch (error) {
    console.error('Error al verificar fotos destacadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
