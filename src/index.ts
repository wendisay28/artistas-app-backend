import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes.js';
import { db, runMigrations } from './db.js';

// Inicializar la aplicación Express
const app = express();

// Configuración de CORS
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173' // Añadido para desarrollo con Vite
];

// Añadir FRONTEND_URL si está definido
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Configuración de middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('Origen de la solicitud:', origin); // Log para depuración
    // Permitir solicitudes sin 'origin' (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está permitido (comparación flexible)
    const isAllowed = allowedOrigins.some((allowedOrigin: string) => {
      if (!allowedOrigin) return false;
      const cleanOrigin = allowedOrigin.replace(/^https?:\/\//, '');
      return origin.startsWith(cleanOrigin) || origin.endsWith(cleanOrigin);
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    // Origen no permitido
    console.warn('Origen no permitido:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Permitir cookies en las peticiones cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Middleware para registrar solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para manejo de errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta de healthcheck
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await db.execute('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'No se pudo conectar a la base de datos'
    });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en el puerto ${PORT}`);
  console.log(`📚 API disponible en http://localhost:${PORT}/api`);
  console.log(`🏥 Healthcheck en http://localhost:${PORT}/health`);
  console.log('ℹ️  Las migraciones están desactivadas temporalmente');
});

// Manejo de cierre de la aplicación
process.on('SIGTERM', () => {
  console.log('🚦 Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('👋 Servidor cerrado');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Cerrar la aplicación para que el proceso de gestión la reinicie
  process.exit(1);
});
