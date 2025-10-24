import { Router, Request, Response, NextFunction } from 'express';
import csrfController from '../controllers/csrfController.js';
import { body } from 'express-validator';

// Extender el tipo Response para incluir locals.csrfToken
declare module 'express' {
  interface Response {
    locals: {
      csrfToken?: string;
    };
  }
}

const router = Router();

/**
 * @route   GET /api/auth/csrf-token
 * @desc    Obtener un token CSRF
 * @access  Público
 */
router.get('/csrf-token', csrfController.generateCsrfToken);

/**
 * @route   POST /api/auth/verify-csrf
 * @desc    Verificar un token CSRF (usado para pruebas)
 * @access  Público
 */
router.post(
  '/verify-csrf',
  [
    // Validar que el token esté presente
    body('token').notEmpty().withMessage('El token CSRF es requerido'),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    // Middleware personalizado para manejar la verificación CSRF
    csrfController.verifyCsrfToken(req, res, (err) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: err.message || 'Error al verificar el token CSRF'
        });
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: 'Token CSRF válido',
      csrfToken: res.locals.csrfToken || ''
    });
  }
);

// Ruta de prueba protegida por CSRF
router.post(
  '/test-csrf',
  csrfController.verifyCsrfToken,
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Ruta protegida accesible con token CSRF válido'
    });
  }
);

export default router;
