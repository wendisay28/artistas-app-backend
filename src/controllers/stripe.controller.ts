// src/controllers/stripe.controller.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db.js';
import { users } from '../schema/users.js';
import { comprobantes } from '../schema/comprobantes.js';
import { eq, desc } from 'drizzle-orm';
import multer from 'multer';
import fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const RETURN_URL  = 'artistasapp://stripe-return';
const REFRESH_URL = 'artistasapp://stripe-refresh';

// ── Multer (archivos en memoria para subir a Stripe) ──────────────────────────
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
}).single('file');

// ── Iniciar conexión con Stripe Connect Express ────────────────────────────────
export const initiateStripeConnect = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const { holderName, email, phone, accountType, acceptTerms } = req.body;

    if (!holderName || !email || !accountType || !acceptTerms) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['holderName', 'email', 'accountType', 'acceptTerms'],
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
    }

    const [existingUser] = await db.select({
      stripeAccountId: users.stripeAccountId,
      stripeStatus:    users.stripeStatus,
    }).from(users).where(eq(users.id, userId)).limit(1);

    let accountId = existingUser?.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        business_type: accountType,
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        business_profile: { name: holderName },
        metadata: { userId },
      });
      accountId = account.id;
    }

    await db.update(users).set({
      stripeAccountId:   accountId,
      stripeHolderName:  holderName,
      stripeEmail:       email,
      stripePhone:       phone || null,
      stripeAccountType: accountType,
      stripeStatus:      'pending',
      updatedAt:         new Date(),
    }).where(eq(users.id, userId));

    const accountLink = await stripe.accountLinks.create({
      account:     accountId,
      refresh_url: REFRESH_URL,
      return_url:  RETURN_URL,
      type:        'account_onboarding',
    });

    res.json({ message: 'Proceso de conexión iniciado', connectUrl: accountLink.url, status: 'pending' });

  } catch (error) {
    console.error('Error al iniciar conexión Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Verificar estado real de la cuenta en Stripe ───────────────────────────────
export const getStripeStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const [user] = await db.select({
      stripeStatus:    users.stripeStatus,
      stripeAccountId: users.stripeAccountId,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!user.stripeAccountId) {
      return res.json({ status: 'disconnected', chargesEnabled: false, payoutsEnabled: false, requirements: [] });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const status: string =
      account.charges_enabled && account.payouts_enabled ? 'connected'  :
      account.details_submitted                          ? 'restricted' : 'pending';

    if (status !== user.stripeStatus) {
      await db.update(users).set({ stripeStatus: status, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    res.json({
      status,
      accountId:       account.id,
      chargesEnabled:  account.charges_enabled,
      payoutsEnabled:  account.payouts_enabled,
      requirements:    account.requirements?.currently_due ?? [],
      currentDeadline: account.requirements?.current_deadline
        ? new Date(account.requirements.current_deadline * 1000).toISOString()
        : undefined,
    });

  } catch (error) {
    console.error('Error al obtener estado Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Enlace al dashboard de Stripe Express ─────────────────────────────────────
export const getStripeDashboardLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const [user] = await db.select({
      stripeAccountId: users.stripeAccountId,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user?.stripeAccountId) {
      return res.status(400).json({ error: 'No tienes una cuenta Stripe conectada' });
    }

    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

    res.json({
      dashboardUrl: loginLink.url,
      expiresAt:    new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Error al generar enlace dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Desconectar cuenta Stripe ──────────────────────────────────────────────────
export const disconnectStripe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const [user] = await db.select({ stripeAccountId: users.stripeAccountId })
      .from(users).where(eq(users.id, userId)).limit(1);

    if (user?.stripeAccountId) {
      try {
        await stripe.oauth.deauthorize({
          client_id:      process.env.STRIPE_CLIENT_ID!,
          stripe_user_id: user.stripeAccountId,
        });
      } catch { /* Si falla, igual limpiamos en DB */ }
    }

    await db.update(users).set({
      stripeStatus:      'disconnected',
      stripeAccountId:   null,
      stripeHolderName:  null,
      stripeEmail:       null,
      stripePhone:       null,
      stripeAccountType: null,
      updatedAt:         new Date(),
    }).where(eq(users.id, userId));

    res.json({ message: 'Cuenta Stripe desconectada exitosamente' });

  } catch (error) {
    console.error('Error al desconectar Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Actualizar datos de cuenta ─────────────────────────────────────────────────
export const updateStripeAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const { holderName, email, phone } = req.body;
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (holderName) updateData.stripeHolderName = holderName;
    if (email)      updateData.stripeEmail = email;
    if (phone)      updateData.stripePhone = phone;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    res.json({ message: 'Información de cuenta actualizada' });

  } catch (error) {
    console.error('Error al actualizar cuenta Stripe:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Subir documento de verificación a Stripe ──────────────────────────────────
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const [user] = await db.select({ stripeAccountId: users.stripeAccountId })
      .from(users).where(eq(users.id, userId)).limit(1);

    if (!user?.stripeAccountId) {
      return res.status(400).json({ error: 'No tienes una cuenta Stripe conectada' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const { docType } = req.body; // 'identity_document' | 'additional_verification'

    // Subir el archivo a Stripe
    const fileUpload = await stripe.files.create({
      purpose: 'identity_document',
      file: {
        data:        req.file.buffer,
        name:        req.file.originalname || `doc_${Date.now()}`,
        type:        req.file.mimetype as any,
      },
    }, { stripeAccount: user.stripeAccountId });

    res.json({
      message:  'Documento subido exitosamente',
      fileId:   fileUpload.id,
      docType:  docType || 'identity_document',
      filename: fileUpload.filename,
    });

  } catch (error) {
    console.error('Error al subir documento a Stripe:', error);
    res.status(500).json({ error: 'Error al subir el documento. Intenta nuevamente.' });
  }
};

// ── Webhook de Stripe ──────────────────────────────────────────────────────────
export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET no configurado');
    return res.status(500).json({ error: 'Webhook no configurado' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Error verificando webhook:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const status =
          account.charges_enabled && account.payouts_enabled ? 'connected'  :
          account.details_submitted                          ? 'restricted' : 'pending';

        await db.update(users)
          .set({ stripeStatus: status, updatedAt: new Date() })
          .where(eq(users.stripeAccountId, account.id));

        console.log(`Stripe account.updated: ${account.id} → ${status}`);
        break;
      }

      case 'capability.updated': {
        const capability = event.data.object as Stripe.Capability;
        console.log(`Stripe capability.updated: ${capability.account} → ${capability.id} = ${capability.status}`);
        break;
      }

      default:
        console.log(`Evento Stripe no manejado: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error interno procesando webhook' });
  }
};

// ── COMPROBANTES — Listar ─────────────────────────────────────────────────────
export const getComprobantes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const items = await db.select()
      .from(comprobantes)
      .where(eq(comprobantes.userId, userId))
      .orderBy(desc(comprobantes.createdAt));

    res.json({ data: items });

  } catch (error) {
    console.error('Error al obtener comprobantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── COMPROBANTES — Crear ──────────────────────────────────────────────────────
export const createComprobante = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const {
      emitter, emitterNit, emitterType,
      client, clientNit, clientEmail, clientCity,
      description, amount, taxRate, currency, status,
    } = req.body;

    if (!emitter || !emitterNit || !client || !clientNit || !clientCity || !description || !amount) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const [created] = await db.insert(comprobantes).values({
      userId,
      emitter,
      emitterNit,
      emitterType:  emitterType || 'Persona Natural',
      client,
      clientNit,
      clientEmail:  clientEmail || null,
      clientCity,
      description,
      amount:       amount.toString(),
      taxRate:      taxRate ?? 0,
      currency:     currency || 'COP',
      status:       status || 'borrador',
    }).returning();

    res.status(201).json({ message: 'Comprobante creado', data: created });

  } catch (error) {
    console.error('Error al crear comprobante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── COMPROBANTES — Actualizar estado ──────────────────────────────────────────
export const updateComprobanteStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['borrador', 'pendiente', 'completado'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const [updated] = await db.update(comprobantes)
      .set({ status, updatedAt: new Date() })
      .where(eq(comprobantes.id, id))
      .returning();

    if (!updated || updated.userId !== userId) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    res.json({ message: 'Estado actualizado', data: updated });

  } catch (error) {
    console.error('Error al actualizar comprobante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
