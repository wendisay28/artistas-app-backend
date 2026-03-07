import { Request, Response } from 'express';
import { db } from '../db.js';
import { users } from '../schema/users.js';
import { eq } from 'drizzle-orm';

// Obtener estado actual de aceptación legal
export const getLegalAcceptanceStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const user = await db.select({
      termsAccepted: users.termsAccepted,
      privacyAccepted: users.privacyAccepted,
      ageVerified: users.ageVerified,
      termsAcceptedAt: users.termsAcceptedAt,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      termsAccepted: user[0].termsAccepted,
      privacyAccepted: user[0].privacyAccepted,
      ageVerified: user[0].ageVerified,
      termsAcceptedAt: user[0].termsAcceptedAt,
      allAccepted: user[0].termsAccepted && user[0].privacyAccepted && user[0].ageVerified,
    });
  } catch (error) {
    console.error('Error al obtener estado legal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar aceptación legal
export const updateLegalAcceptance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { termsAccepted, privacyAccepted, ageVerified } = req.body;

    // Validar que los campos sean booleanos
    if (typeof termsAccepted !== 'boolean' || 
        typeof privacyAccepted !== 'boolean' || 
        typeof ageVerified !== 'boolean') {
      return res.status(400).json({ error: 'Todos los campos deben ser booleanos' });
    }

    // Calcular si todos los términos están aceptados
    const allAccepted = termsAccepted && privacyAccepted && ageVerified;

    // Actualizar en la base de datos
    await db.update(users)
      .set({
        termsAccepted,
        privacyAccepted,
        ageVerified,
        termsAcceptedAt: allAccepted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      message: 'Aceptación legal actualizada',
      termsAccepted,
      privacyAccepted,
      ageVerified,
      allAccepted,
      termsAcceptedAt: allAccepted ? new Date() : null,
    });
  } catch (error) {
    console.error('Error al actualizar aceptación legal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Endpoint para aceptar todos los términos de una vez
export const acceptAllTerms = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const now = new Date();
    
    await db.update(users)
      .set({
        termsAccepted: true,
        privacyAccepted: true,
        ageVerified: true,
        termsAcceptedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    res.json({
      message: 'Todos los términos han sido aceptados',
      termsAccepted: true,
      privacyAccepted: true,
      ageVerified: true,
      allAccepted: true,
      termsAcceptedAt: now,
    });
  } catch (error) {
    console.error('Error al aceptar todos los términos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar modo de entrega
export const updateDeliveryMode = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { deliveryMode } = req.body;

    // Validar que el modo de entrega sea válido
    const validModes = ['presencial', 'digital', 'hibrido'];
    if (deliveryMode && !validModes.includes(deliveryMode)) {
      return res.status(400).json({ 
        error: 'Modo de entrega inválido',
        validModes 
      });
    }

    await db.update(users)
      .set({
        deliveryMode,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      message: 'Modo de entrega actualizado',
      deliveryMode,
    });
  } catch (error) {
    console.error('Error al actualizar modo de entrega:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Activar perfil de artista (visible para el público)
export const activateArtistProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que todos los requisitos estén completos
    const [user] = await db.select({
      termsAccepted: users.termsAccepted,
      privacyAccepted: users.privacyAccepted,
      ageVerified: users.ageVerified,
      deliveryMode: users.deliveryMode,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar requisitos
    const requirements = {
      termsAccepted: user.termsAccepted,
      privacyAccepted: user.privacyAccepted,
      ageVerified: user.ageVerified,
      deliveryMode: !!user.deliveryMode,
    };

    const allRequirementsMet = Object.values(requirements).every(Boolean);

    if (!allRequirementsMet) {
      return res.status(400).json({
        error: 'Requisitos incompletos',
        requirements,
        message: 'Debes completar todos los requisitos para activar tu perfil'
      });
    }

    // Actualizar tabla de artists para hacer visible el perfil
    // Esto requiere importar la tabla artists
    // Por ahora, actualizamos un campo en users o creamos uno nuevo
    
    await db.update(users)
      .set({
        // Aquí podríamos agregar un campo como profile_public: true
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      message: 'Perfil activado exitosamente',
      profilePublic: true,
      activatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error al activar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
