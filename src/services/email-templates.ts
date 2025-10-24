/**
 * Plantillas de email para BuscartPro
 * Todas las plantillas usan HTML responsivo con estilos inline
 */

const baseStyles = {
  container: 'max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
  header: 'background: linear-gradient(135deg, #bb00aa 0%, #8b008b 100%); padding: 40px 20px; text-align: center;',
  logo: 'font-size: 32px; font-weight: bold; color: #ffffff; margin: 0;',
  content: 'background-color: #ffffff; padding: 40px 30px; color: #333333;',
  button: 'display: inline-block; padding: 14px 32px; background-color: #bb00aa; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;',
  footer: 'background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px;',
};

interface VerificationEmailParams {
  userName: string;
  verificationUrl: string;
}

interface WelcomeEmailParams {
  userName: string;
  userType: string;
}

interface PasswordResetParams {
  userName: string;
  resetUrl: string;
}

interface ContractNotificationParams {
  artistName: string;
  clientName: string;
  serviceName: string;
  amount: number;
}

export const emailTemplates = {
  /**
   * Email de verificación de cuenta
   */
  verification: (params: VerificationEmailParams): string => {
    const { userName, verificationUrl } = params;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica tu correo electrónico</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="${baseStyles.container}">
          <!-- Header -->
          <div style="${baseStyles.header}">
            <h1 style="${baseStyles.logo}">BuscartPro</h1>
            <p style="color: #ffffff; font-size: 18px; margin: 10px 0 0 0;">
              Plataforma de Arte y Cultura
            </p>
          </div>

          <!-- Content -->
          <div style="${baseStyles.content}">
            <h2 style="color: #bb00aa; margin-top: 0;">¡Hola ${userName}! 👋</h2>

            <p style="font-size: 16px; line-height: 1.6;">
              ¡Gracias por registrarte en BuscartPro! Estamos emocionados de tenerte en nuestra comunidad de artistas y amantes del arte.
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Para completar tu registro y comenzar a explorar todo lo que BuscartPro tiene para ofrecer, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="${baseStyles.button}">
                Verificar mi correo electrónico
              </a>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Si no creaste una cuenta en BuscartPro, puedes ignorar este correo de forma segura.
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationUrl}" style="color: #bb00aa; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="${baseStyles.footer}">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} BuscartPro. Todos los derechos reservados.
            </p>
            <p style="margin: 0; font-size: 12px;">
              Medellín, Colombia
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Email de bienvenida
   */
  welcome: (params: WelcomeEmailParams): string => {
    const { userName, userType } = params;

    const typeMessages: Record<string, string> = {
      artist: 'Como artista, podrás mostrar tu portafolio, ofrecer servicios y conectar con clientes potenciales.',
      company: 'Como empresa, podrás descubrir talento artístico y contratar servicios profesionales.',
      general: 'Explora el arte local, descubre artistas talentosos y encuentra servicios creativos únicos.',
    };

    const message = typeMessages[userType] || typeMessages.general;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a BuscartPro!</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="${baseStyles.container}">
          <div style="${baseStyles.header}">
            <h1 style="${baseStyles.logo}">BuscartPro</h1>
            <p style="color: #ffffff; font-size: 18px; margin: 10px 0 0 0;">
              🎨 Plataforma de Arte y Cultura
            </p>
          </div>

          <div style="${baseStyles.content}">
            <h2 style="color: #bb00aa; margin-top: 0;">¡Bienvenido, ${userName}! 🎉</h2>

            <p style="font-size: 16px; line-height: 1.6;">
              Tu cuenta ha sido verificada exitosamente. ${message}
            </p>

            <div style="background-color: #f8f9fa; border-left: 4px solid #bb00aa; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Próximos pasos:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                ${userType === 'artist' ? `
                  <li>Completa tu perfil de artista</li>
                  <li>Sube trabajos a tu portafolio</li>
                  <li>Crea tus primeros servicios</li>
                  <li>Conecta con clientes potenciales</li>
                ` : `
                  <li>Explora artistas y servicios</li>
                  <li>Guarda tus favoritos</li>
                  <li>Contacta artistas directamente</li>
                  <li>Deja reseñas y recomendaciones</li>
                `}
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="${baseStyles.button}">
                Ir a mi perfil
              </a>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #666; text-align: center;">
              ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@buscartpro.com" style="color: #bb00aa;">soporte@buscartpro.com</a>
            </p>
          </div>

          <div style="${baseStyles.footer}">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} BuscartPro. Todos los derechos reservados.
            </p>
            <p style="margin: 0; font-size: 12px;">
              Medellín, Colombia
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Email de recuperación de contraseña
   */
  passwordReset: (params: PasswordResetParams): string => {
    const { userName, resetUrl } = params;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recupera tu contraseña</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="${baseStyles.container}">
          <div style="${baseStyles.header}">
            <h1 style="${baseStyles.logo}">BuscartPro</h1>
            <p style="color: #ffffff; font-size: 18px; margin: 10px 0 0 0;">
              Recuperación de Contraseña
            </p>
          </div>

          <div style="${baseStyles.content}">
            <h2 style="color: #bb00aa; margin-top: 0;">Hola ${userName}, 🔐</h2>

            <p style="font-size: 16px; line-height: 1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en BuscartPro.
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Haz clic en el botón de abajo para crear una nueva contraseña:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="${baseStyles.button}">
                Restablecer mi contraseña
              </a>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                ⚠️ <strong>Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual no cambiará.
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #bb00aa; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>

          <div style="${baseStyles.footer}">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} BuscartPro. Todos los derechos reservados.
            </p>
            <p style="margin: 0; font-size: 12px;">
              Medellín, Colombia
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Email de notificación de nuevo contrato
   */
  contractNotification: (params: ContractNotificationParams): string => {
    const { artistName, clientName, serviceName, amount } = params;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Nueva solicitud de contrato!</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="${baseStyles.container}">
          <div style="${baseStyles.header}">
            <h1 style="${baseStyles.logo}">BuscartPro</h1>
            <p style="color: #ffffff; font-size: 18px; margin: 10px 0 0 0;">
              💼 Nueva Oportunidad
            </p>
          </div>

          <div style="${baseStyles.content}">
            <h2 style="color: #bb00aa; margin-top: 0;">¡Felicidades, ${artistName}! 🎉</h2>

            <p style="font-size: 16px; line-height: 1.6;">
              Tienes una nueva solicitud de contrato en BuscartPro:
            </p>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px;">Cliente:</td>
                  <td style="padding: 10px 0; color: #333; font-size: 16px; font-weight: 600; text-align: right;">
                    ${clientName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #dee2e6;">
                    Servicio:
                  </td>
                  <td style="padding: 10px 0; color: #333; font-size: 16px; text-align: right; border-top: 1px solid #dee2e6;">
                    ${serviceName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #dee2e6;">
                    Monto:
                  </td>
                  <td style="padding: 10px 0; color: #bb00aa; font-size: 20px; font-weight: bold; text-align: right; border-top: 1px solid #dee2e6;">
                    $${amount.toLocaleString('es-CO')}
                  </td>
                </tr>
              </table>
            </div>

            <p style="font-size: 16px; line-height: 1.6;">
              Revisa los detalles completos y responde a tu cliente desde tu panel de control.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard/contracts" style="${baseStyles.button}">
                Ver detalles del contrato
              </a>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #666; text-align: center;">
              Recuerda responder pronto para no perder esta oportunidad.
            </p>
          </div>

          <div style="${baseStyles.footer}">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} BuscartPro. Todos los derechos reservados.
            </p>
            <p style="margin: 0; font-size: 12px;">
              Medellín, Colombia
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
