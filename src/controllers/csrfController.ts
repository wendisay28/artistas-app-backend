import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';

/**
 * Controlador para manejar la generación de tokens CSRF
 */
class CsrfController {
  /**
   * Genera un nuevo token CSRF
   */
  public generateCsrfToken = async (req: Request, res: Response) => {
    try {
      // Generar un token único
      const csrfToken = uuidv4();
      
      // Configurar la cookie CSRF (HttpOnly, Secure en producción, SameSite)
      res.cookie('csrftoken', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 día
      });
      
      // Devolver el token en la respuesta
      res.status(200).json({
        success: true,
        csrfToken,
      });
      
    } catch (error) {
      console.error('Error al generar token CSRF:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al generar token CSRF',
      });
    }
  };
  
  /**
   * Middleware para establecer el token CSRF en la respuesta
   */
  public setCsrfToken = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Solo establecer un nuevo token si no existe uno
      if (!req.cookies?.csrftoken) {
        const csrfToken = uuidv4();
        
        // Configurar la cookie CSRF
        res.cookie('csrftoken', csrfToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000, // 1 día
        });
        
        // Hacer que el token esté disponible para la respuesta
        res.locals.csrfToken = csrfToken;
      } else {
        // Si ya existe un token, usarlo
        res.locals.csrfToken = req.cookies.csrftoken;
      }
      
      next();
    } catch (error) {
      console.error('Error al establecer el token CSRF:', error);
      next(error);
    }
  };

  /**
   * Middleware para verificar el token CSRF en las peticiones
   */
  public verifyCsrfToken = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Métodos que requieren verificación CSRF
      const methodsRequiringCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'];
      
      // Si el método no requiere verificación CSRF, continuar
      if (!methodsRequiringCsrf.includes(req.method)) {
        return next();
      }
      
      // Obtener el token del encabezado
      const csrfToken = req.headers['x-csrf-token'] || req.headers['xsrf-token'];
      const cookieToken = req.cookies?.csrftoken;
      
      // Verificar que el token existe
      if (!csrfToken) {
        console.warn('Intento de solicitud sin token CSRF');
        return res.status(403).json({
          success: false,
          code: 'CSRF_TOKEN_MISSING',
          message: 'Token CSRF requerido en el encabezado X-CSRF-Token',
        });
      }
      
      // Verificar que la cookie existe
      if (!cookieToken) {
        console.warn('Intento de solicitud sin cookie CSRF');
        return res.status(403).json({
          success: false,
          code: 'CSRF_COOKIE_MISSING',
          message: 'Cookie CSRF faltante',
        });
      }
      
      // Verificar que los tokens coincidan
      if (csrfToken !== cookieToken) {
        console.warn('Intento de solicitud con token CSRF inválido');
        // Medida de seguridad: invalidar la cookie existente
        res.clearCookie('csrftoken');
        
        return res.status(403).json({
          success: false,
          code: 'CSRF_TOKEN_MISMATCH',
          message: 'Token CSRF no coincide con la cookie de sesión',
        });
      }
      
      // Token válido, continuar
      next();
    } catch (error) {
      console.error('Error al verificar el token CSRF:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar el token CSRF',
      });
    }
  };
}

export default new CsrfController();
