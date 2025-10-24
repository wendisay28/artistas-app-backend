/**
 * Rate limiting middleware basado en usuario autenticado
 * Complementa el rate limiting por IP con límites por usuario
 */

import { rateLimit } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Crea un rate limiter basado en el ID del usuario autenticado
 * Si no hay usuario autenticado, usa la IP como fallback
 */
export const createUserRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,

    // Usar userId si está autenticado, sino dejar que express-rate-limit maneje la IP
    keyGenerator: (req: Request) => {
      // Si el usuario está autenticado, usar su ID
      if (req.user && req.user.id) {
        return `user:${req.user.id}`;
      }

      // Si no está autenticado, retornar undefined para que express-rate-limit
      // use su keyGenerator por defecto que maneja correctamente IPv6
      return undefined as any;
    },

    // Handler cuando se excede el límite
    handler: (req: Request, res: Response) => {
      const identifier = req.user?.id ? `usuario ${req.user.id}` : `IP ${req.ip}`;
      logger.warn(
        `Rate limit excedido para ${identifier}`,
        {
          path: req.path,
          method: req.method,
          userId: req.user?.id,
          ip: req.ip,
        },
        'RateLimit'
      );

      res.status(429).json({
        success: false,
        error: options.message || 'Demasiadas solicitudes. Por favor intenta más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: res.getHeader('Retry-After'),
      });
    },

    // Skip en desarrollo si se especifica
    skip: (req: Request) => {
      // En desarrollo, permitir bypass con header especial
      if (process.env.NODE_ENV === 'development' && req.headers['x-bypass-rate-limit'] === 'true') {
        return true;
      }
      return false;
    },
  });
};

/**
 * Rate limiter estricto para operaciones sensibles (cambio de password, eliminación de cuenta, etc.)
 * 5 solicitudes por hora por usuario
 */
export const strictUserRateLimit = createUserRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: 'Has excedido el límite de solicitudes para esta operación. Intenta nuevamente en una hora.',
});

/**
 * Rate limiter moderado para operaciones de escritura (POST, PUT, PATCH, DELETE)
 * 100 solicitudes por 15 minutos por usuario
 */
export const moderateUserRateLimit = createUserRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Has excedido el límite de solicitudes. Intenta nuevamente en unos minutos.',
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter para operaciones de lectura (GET)
 * 300 solicitudes por 15 minutos por usuario
 */
export const readUserRateLimit = createUserRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: 'Has excedido el límite de solicitudes de lectura.',
  skipSuccessfulRequests: true, // No contar requests exitosos
});

/**
 * Rate limiter para búsquedas y filtros
 * 60 solicitudes por minuto por usuario
 */
export const searchRateLimit = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  message: 'Has realizado demasiadas búsquedas. Espera un momento antes de continuar.',
});

/**
 * Rate limiter para uploads de archivos
 * 20 uploads por hora por usuario
 */
export const uploadRateLimit = createUserRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: 'Has excedido el límite de subidas de archivos. Intenta nuevamente en una hora.',
});

/**
 * Rate limiter para creación de contenido (posts, eventos, etc.)
 * 50 creaciones por día por usuario
 */
export const contentCreationRateLimit = createUserRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 50,
  message: 'Has alcanzado el límite diario de creación de contenido.',
});

/**
 * Rate limiter para mensajes y notificaciones
 * 100 mensajes por hora por usuario
 */
export const messagingRateLimit = createUserRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100,
  message: 'Has enviado demasiados mensajes. Intenta nuevamente en una hora.',
});

/**
 * Rate limiter para ofertas de trabajo
 * 10 ofertas por día por usuario
 */
export const offerCreationRateLimit = createUserRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 10,
  message: 'Has alcanzado el límite diario de creación de ofertas.',
});
