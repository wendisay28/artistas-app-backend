// Servicio de email con Supabase Auth y plantillas
import { emailTemplates } from './email-templates.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendVerificationEmailOptions {
  email: string;
  token: string;
  userName: string;
}

interface SendWelcomeEmailOptions {
  email: string;
  userName: string;
  userType: string;
}

interface SendPasswordResetEmailOptions {
  email: string;
  token: string;
  userName: string;
}

/**
 * Envía un email usando Supabase Auth
 * Nota: Supabase Auth maneja automáticamente los emails de verificación y recuperación
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email simulado enviado:');
    console.log(`Para: ${options.to}`);
    console.log(`Asunto: ${options.subject}`);
    console.log(`Contenido HTML: ${options.html.substring(0, 100)}...`);
    return Promise.resolve();
  }

  // En producción, usar un servicio de email real
  // Ejemplo con Nodemailer (descomentar y configurar):
  /*
  import nodemailer from 'nodemailer';

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@buscartpro.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
  */

  return Promise.resolve();
};

/**
 * Envía email de verificación usando las plantillas personalizadas
 */
export const sendVerificationEmail = async (options: SendVerificationEmailOptions): Promise<void> => {
  const { email, token, userName } = options;
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  const html = emailTemplates.verification({
    userName,
    verificationUrl,
  });

  await sendEmail({
    to: email,
    subject: 'Verifica tu correo electrónico - BuscartPro',
    html,
  });
};

/**
 * Envía email de bienvenida
 */
export const sendWelcomeEmail = async (options: SendWelcomeEmailOptions): Promise<void> => {
  const { email, userName, userType } = options;

  const html = emailTemplates.welcome({
    userName,
    userType,
  });

  await sendEmail({
    to: email,
    subject: '¡Bienvenido a BuscartPro! 🎨',
    html,
  });
};

/**
 * Envía email de recuperación de contraseña
 */
export const sendPasswordResetEmail = async (options: SendPasswordResetEmailOptions): Promise<void> => {
  const { email, token, userName } = options;
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

  const html = emailTemplates.passwordReset({
    userName,
    resetUrl,
  });

  await sendEmail({
    to: email,
    subject: 'Recupera tu contraseña - BuscartPro',
    html,
  });
};

/**
 * Envía email de notificación de nuevo contrato
 */
export const sendContractNotificationEmail = async (
  artistEmail: string,
  artistName: string,
  contractDetails: {
    clientName: string;
    serviceName: string;
    amount: number;
  }
): Promise<void> => {
  const html = emailTemplates.contractNotification({
    artistName,
    clientName: contractDetails.clientName,
    serviceName: contractDetails.serviceName,
    amount: contractDetails.amount,
  });

  await sendEmail({
    to: artistEmail,
    subject: '¡Nueva solicitud de contrato! - BuscartPro',
    html,
  });
};
