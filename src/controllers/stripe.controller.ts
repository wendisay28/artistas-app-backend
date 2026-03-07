// src/controllers/stripe.controller.ts
import { Request, Response } from 'express';
import { db } from '../db.js';
import { users } from '../schema/users.js';
import { eq } from 'drizzle-orm';

// Iniciar conexión con Stripe Connect
export const initiateStripeConnect = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { holderName, email, phone, accountType, acceptTerms } = req.body;

    // Validaciones básicas
    if (!holderName || !email || !accountType || !acceptTerms) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos',
        required: ['holderName', 'email', 'accountType', 'acceptTerms']
      });
    }

    if (!acceptTerms) {
      return res.status(400).json({ 
        error: 'Debes aceptar los términos de servicio de Stripe' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'El formato del correo electrónico no es válido' 
      });
    }

    // Guardar información preliminar en la base de datos
    await db.update(users)
      .set({
        stripeHolderName: holderName,
        stripeEmail: email,
        stripePhone: phone || null,
        stripeAccountType: accountType,
        stripeStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // En un entorno real, aquí generaríamos el enlace de Stripe Connect
    // Por ahora, simulamos la conexión
    const mockConnectUrl = `https://connect.stripe.com/express/mock?user_id=${userId}`;

    res.json({
      message: 'Proceso de conexión iniciado',
      connectUrl: mockConnectUrl,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error al iniciar conexión Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar estado de la conexión
export const getStripeStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const [user] = await db.select({
      stripeStatus: users.stripeStatus,
      stripeAccountId: users.stripeAccountId,
      stripeHolderName: users.stripeHolderName,
      stripeEmail: users.stripeEmail,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // En un entorno real, verificaríamos con la API de Stripe
    // Por ahora, simulamos el estado
    const status = user.stripeStatus || 'disconnected';
    const chargesEnabled = status === 'connected';
    const payoutsEnabled = status === 'connected';

    res.json({
      status,
      accountId: user.stripeAccountId,
      chargesEnabled,
      payoutsEnabled,
      requirements: status === 'restricted' ? [
        'Verificar identidad',
        'Completar información bancaria'
      ] : undefined,
      currentDeadline: status === 'restricted' ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
    });

  } catch (error) {
    console.error('Error al obtener estado Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener enlace del dashboard de Stripe
export const getStripeDashboardLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const [user] = await db.select({
      stripeAccountId: users.stripeAccountId,
      stripeStatus: users.stripeStatus,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user || user.stripeStatus !== 'connected') {
      return res.status(400).json({ 
        error: 'No tienes una cuenta Stripe conectada' 
      });
    }

    // En un entorno real, generaríamos un enlace temporal al dashboard
    const mockDashboardUrl = `https://dashboard.stripe.com/connect/accounts/${user.stripeAccountId}`;
    
    res.json({
      dashboardUrl: mockDashboardUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora
    });

  } catch (error) {
    console.error('Error al generar enlace dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Desconectar cuenta Stripe
export const disconnectStripe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Limpiar información de Stripe de la base de datos
    await db.update(users)
      .set({
        stripeStatus: 'disconnected',
        stripeAccountId: null,
        stripeHolderName: null,
        stripeEmail: null,
        stripePhone: null,
        stripeAccountType: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      message: 'Cuenta Stripe desconectada exitosamente'
    });

  } catch (error) {
    console.error('Error al desconectar Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar información de la cuenta
export const updateStripeAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { holderName, email, phone } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (holderName) updateData.stripeHolderName = holderName;
    if (email) updateData.stripeEmail = email;
    if (phone) updateData.stripePhone = phone;

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    res.json({
      message: 'Información de cuenta actualizada'
    });

  } catch (error) {
    console.error('Error al actualizar cuenta Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
