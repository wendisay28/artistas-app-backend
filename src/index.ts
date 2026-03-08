import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import type { RequestHandler } from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type { Express } from 'express';
import { sql } from 'drizzle-orm';
import apiRoutes from './routes/api.routes.js';
import { handleWebhook } from './controllers/stripe.controller.js';
import csrfRoutes from './routes/csrfRoutes.js';
import { db, dbReady } from './db.js';
import { storage } from './storage/index.js';
import { auth } from './config/firebase.js';
import csrfController from './controllers/csrfController.js';
import { URL } from 'url';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { validateEnv } from './utils/validateEnv.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
// import swaggerUi from 'swagger-ui-express';
// import { swaggerSpec } from './config/swagger.js';

// Validar variables de entorno al inicio
try {
  validateEnv();
} catch (error) {
  console.error('Error al validar variables de entorno:', error);
  process.exit(1);
}

// Extend Express types
declare global {
  namespace Express {
    interface Application {
      broadcastResponse: (offerId: number, response: any) => Promise<void>;
      broadcastStatusUpdate: (offerId: number, responseId: number, status: string) => Promise<void>;
    }
  }
}

// Inicializar la aplicación Express
const app = express() as Express;
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// (El manejador de errores se declara más abajo, después de las rutas)

// Configuración de CORS endurecida
const isDev = process.env.NODE_ENV === 'development';
const frontendUrl = process.env.FRONTEND_URL || '';
const devOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
]);

const offerConnections = new Map<number, Set<WebSocket>>();
const userConnections = new Map<string, Set<WebSocket>>(); // NUEVO: Para notificaciones por usuario

wss.on('connection', async (ws, req) => {
  try {
    // Extraer token del query ?token= o del header Authorization: Bearer XXX
    const urlObj = new URL(req.url || '', 'http://localhost');
    const queryToken = urlObj.searchParams.get('token') || '';
    const headerAuth = (req.headers['authorization'] || '').toString();
    const headerToken = headerAuth.startsWith('Bearer ')
      ? headerAuth.substring('Bearer '.length)
      : '';
    const token = queryToken || headerToken;

    if (!token) {
      logger.warn('WebSocket sin token, cerrando conexión', undefined, 'WS');
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Verificar token con Firebase Admin
    const decoded = await auth.verifyIdToken(token);
    (ws as any).userId = decoded.uid;

    // NUEVO: Registrar conexión del usuario para notificaciones
    const userId = decoded.uid;
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(ws);
    logger.info(`Usuario ${userId} conectado via WebSocket`, undefined, 'WS');
  } catch (e) {
    logger.warn('WebSocket autenticación falló', { error: (e as Error).message }, 'WS');
    ws.close(1008, 'Unauthorized');
    return;
  }

  logger.info('WebSocket conexión establecida', undefined, 'WS');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'subscribe' && data.offerId !== undefined) {
        const offerId = parseInt(String(data.offerId));
        if (Number.isNaN(offerId) || offerId <= 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'offerId inválido' }));
          return;
        }

        if (!offerConnections.has(offerId)) {
          offerConnections.set(offerId, new Set());
        }

        offerConnections.get(offerId)!.add(ws);
        logger.debug(`Cliente suscrito a oferta ${offerId}`, undefined, 'WS');

        ws.send(JSON.stringify({
          type: 'subscribed',
          offerId: offerId
        }));
      }
    } catch (error) {
      logger.error('Error procesando mensaje WebSocket', error as Error, 'WS');
    }
  });
  
  ws.on('close', () => {
    // Limpiar conexiones de ofertas
    offerConnections.forEach((connections, offerId) => {
      connections.delete(ws);
      if (connections.size === 0) {
        offerConnections.delete(offerId);
      }
    });

    // NUEVO: Limpiar conexiones de usuario
    const userId = (ws as any).userId;
    if (userId && userConnections.has(userId)) {
      userConnections.get(userId)!.delete(ws);
      if (userConnections.get(userId)!.size === 0) {
        userConnections.delete(userId);
      }
      logger.info(`Usuario ${userId} desconectado de WebSocket`, undefined, 'WS');
    }

    logger.info('WebSocket conexión cerrada', undefined, 'WS');
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', error as Error, 'WS');
  });
});

// Add broadcast functions to app
app.broadcastResponse = async (offerId: number, response: any) => {
  const connections = offerConnections.get(offerId);
  if (connections) {
    try {
      // Obtener información del artista usando el storage
      const artist = await storage.artistStorage.getArtist(response.artistId);

      if (!artist) {
        logger.error(`No se encontró el artista con ID: ${response.artistId}`, undefined, 'WS');
        return;
      }
      
      // Extraer solo los campos necesarios del artista
      const artistData = {
        id: artist.artist.id,
        artistName: artist.artist.artistName,
        userId: artist.user.id,
        // Incluir otros campos necesarios del artista
      };
      
      // Crear el mensaje con la información del artista
      const message = JSON.stringify({
        type: 'newResponse',
        offerId: offerId,
        response: {
          ...response,
          artist: artistData
        }
      });
      
      // Enviar el mensaje a todos los clientes conectados
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    } catch (error) {
      logger.error('Error al obtener información del artista', error as Error, 'WS');
    }
  }
};

app.broadcastStatusUpdate = async (offerId: number, responseId: number, status: string) => {
  const connections = offerConnections.get(offerId);
  if (connections) {
    try {
      // Crear el mensaje de actualización de estado
      const message = JSON.stringify({
        type: 'statusUpdate',
        offerId: offerId,
        responseId: responseId,
        status: status,
        timestamp: new Date().toISOString()
      });
      
      // Enviar el mensaje a todos los clientes conectados
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    } catch (error) {
      logger.error('Error al enviar actualización de estado', error as Error, 'WS');
    }
  }
};

// NUEVO: Función global para enviar notificaciones a usuarios específicos
(app as any).notifyUser = (userId: string, notification: any) => {
  const connections = userConnections.get(userId);
  if (connections && connections.size > 0) {
    const message = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        logger.debug(`Notificación enviada a usuario ${userId}`, undefined, 'WS');
      }
    });
  }
};

// Exportar para uso en otros módulos
export { userConnections };

// Configuración de middleware
app.use(helmet());
app.use(compression() as unknown as RequestHandler);

// ── Webhook de Stripe (raw body ANTES de express.json) ──────────────────────
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware para parsear JSON y URL-encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para parsear cookies
app.use(cookieParser());

// Servir archivos estáticos desde la carpeta uploads
// Archivos estáticos locales eliminados: ahora los medios se sirven desde Supabase Storage

// Middleware para establecer el token CSRF en cada respuesta
app.use(csrfController.setCsrfToken);

// Middleware para verificar CSRF en rutas que lo requieran
app.use((req, res, next) => {
  // Rutas que no requieren CSRF
  const csrfExemptRoutes = [
    '/api/auth/csrf-token',
    '/api/auth/verify-csrf', // Ruta de verificación
    // Rutas de autenticación pública
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    // Webhooks y otras rutas públicas
    '/api/webhooks/',
    // Agrega aquí otras rutas que no requieran CSRF
  ];
  
  // Verificar si la ruta actual está en la lista de excepciones
  const isExemptRoute = csrfExemptRoutes.some(route => {
    return req.path.startsWith(route);
  });
  
  if (isExemptRoute) {
    return next();
  }
  
  // Aplicar verificación CSRF a métodos que modifican datos
  // TEMPORALMENTE DESHABILITADO PARA DEBUGGING
  // if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
  //   return csrfController.verifyCsrfToken(req, res, next);
  // }
  
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 10000 : 300, // En desarrollo: 10,000 solicitudes, producción: 300
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: process.env.NODE_ENV === 'development' ? 1000 : 30, // En desarrollo: 1,000 solicitudes, producción: 30
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware para registrar solicitudes HTTP
app.use((req, _res, next) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`${req.method} ${req.originalUrl}`, {
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined,
      },
      body: req.body,
    }, 'HTTP');
  }
  next();
});


// Configuración de CORS
app.use(cors({
  origin: (origin, callback) => {
    // En desarrollo, permitir requests desde herramientas como Postman/Insomnia (sin origin)
    // pero solo si está explícitamente habilitado
    const allowNoOrigin = isDev && process.env.ALLOW_NO_ORIGIN === 'true';

    if (origin && (isDev && devOrigins.has(origin) || origin === frontendUrl)) {
      callback(null, true);
    } else if (!origin && allowNoOrigin) {
      logger.warn('Permitiendo request sin origin (ALLOW_NO_ORIGIN=true en desarrollo)', undefined, 'CORS');
      callback(null, true);
    } else {
      logger.warn(`Origen no permitido: ${origin || 'sin origin'}`, undefined, 'CORS');
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Aplicar rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Documentación Swagger
if (process.env.NODE_ENV !== 'production') {
  // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  //   explorer: true,
  //   customCss: '.swagger-ui .topbar { display: none }',
  //   customSiteTitle: 'BuscartPro API Docs',
  // }));
  // logger.info('Swagger UI disponible en /api-docs', undefined, 'Swagger');
}

// Configuración de rutas
app.use('/api/auth', csrfRoutes); // Rutas CSRF
app.use('/api', apiRoutes);

// Ruta de healthcheck
app.get('/health', async (_req, res) => {
  try {
    let dbStatus = 'not_configured';
    if (dbReady && db) {
      // Verificar conexión a la base de datos si está configurada
      await db.execute(sql`select 1`);
      dbStatus = 'connected';
    }
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (error) {
    logger.error('Error de conexión a la base de datos', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: dbReady ? 'disconnected' : 'not_configured',
      error: 'No se pudo conectar a la base de datos'
    });
  }
});

// Manejar rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar el servidor
const PORT = process.env.PORT || 5001;
httpServer.listen(Number(PORT), '0.0.0.0', async () => {
  logger.info(`Servidor iniciado en el puerto ${PORT}`);
  logger.info(`API disponible en http://localhost:${PORT}/api`);
  logger.info(`Healthcheck en http://localhost:${PORT}/health`);
  logger.info(`WebSocket disponible en ws://localhost:${PORT}/ws`);
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📚 API Docs en http://localhost:${PORT}/api-docs`);
  }
});

// Exportar la aplicación para pruebas
export { app as default, httpServer as server };

// Manejo de cierre de la aplicación
process.on('SIGTERM', () => {
  logger.info('Recibida señal SIGTERM. Cerrando servidor...', undefined, 'Server');
  httpServer.close(() => {
    logger.info('Servidor cerrado correctamente', undefined, 'Server');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise }, 'Server');
  // Cerrar la aplicación para que el proceso de gestión la reinicie
  process.exit(1);
});
