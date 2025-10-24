import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  stack?: string;
}

/**
 * Middleware global para manejo de errores
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Si la respuesta ya fue enviada, delegar al handler por defecto de Express
  if (res.headersSent) {
    return next(err);
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log del error
  logger.error(
    `Error en ${req.method} ${req.path}`,
    {
      error: err.message,
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user?.id,
    },
    'ErrorHandler'
  );

  // Preparar respuesta de error
  const errorResponse: ErrorResponse = {
    success: false,
    error: isProduction && !isAppError
      ? 'Error interno del servidor'
      : err.message,
  };

  // Agregar código de error si existe
  if (isAppError && err.code) {
    errorResponse.code = err.code;
  }

  // En desarrollo, incluir detalles adicionales
  if (!isProduction) {
    errorResponse.details = {
      name: err.name,
      path: req.path,
      method: req.method,
    };
    errorResponse.stack = err.stack;
  }

  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar rutas no encontradas
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new AppError(
    404,
    `Ruta no encontrada: ${req.method} ${req.path}`,
    true,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Wrapper para funciones async en rutas
 * Captura errores automáticamente y los pasa al error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validar que los errores son manejables
 */
export const isTrustedError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};
