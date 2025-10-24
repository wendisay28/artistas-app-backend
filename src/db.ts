import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema.js';
import type { Database } from './types/db.js';
import { logger } from './utils/logger.js';

// Cargar variables de entorno
dotenv.config();

// Declaración global al nivel superior
declare global {
  // eslint-disable-next-line no-var
  var db: Database | undefined;
}

// Verificar y configurar base de datos
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
let dbReady = false;
let db: Database; // siempre definido (real o proxy)
let client: ReturnType<typeof postgres> | undefined;

if (!hasDatabaseUrl) {
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('DATABASE_URL no definida. Ejecutando sin base de datos en desarrollo', undefined, 'DB');
  } else {
    logger.error('DATABASE_URL no está definida en las variables de entorno', undefined, 'DB');
    // Crear un proxy que lance errores en tiempo de ejecución si se usa sin DB
    db = new Proxy({}, {
      get() {
        throw new Error('Database not configured. Define DATABASE_URL para usar la base de datos.');
      },
      apply() {
        throw new Error('Database not configured.');
      },
    }) as unknown as Database;
    // dbReady permanece en false
  }
} else {
  logger.info('Configurando conexión a la base de datos...', undefined, 'DB');
  try {
    const dbHost = new URL(process.env.DATABASE_URL!).hostname;
    logger.info(`Host de la base de datos: ${dbHost}`, undefined, 'DB');
  } catch {}

  // Crear el cliente de PostgreSQL
  // Configuración SSL segura: solo deshabilitar verificación en desarrollo local
  const sslConfig = process.env.NODE_ENV === 'development' && process.env.DATABASE_URL!.includes('localhost')
    ? false  // Sin SSL para desarrollo local
    : { rejectUnauthorized: true };  // SSL seguro para producción y servicios remotos

  client = postgres(process.env.DATABASE_URL!, {
    ssl: sslConfig,
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

  if (process.env.NODE_ENV === 'production') {
    db = drizzle(client, { schema }) as Database;
  } else {
    const g = globalThis as any;
    if (!g.db) {
      g.db = drizzle(client, { schema }) as Database;
    }
    db = g.db as Database;
  }
  dbReady = true;
}

export { db };
export { dbReady };

// Hot reload dev
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.on('vite:beforeFullReload', () => {
      client?.end();
    });
  }
}

// Migraciones
export async function runMigrations() {
  if (!dbReady || !client) {
    logger.warn('No se pueden ejecutar migraciones: base de datos no configurada', undefined, 'DB');
    return;
  }

  try {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    logger.info('Ejecutando migraciones...', undefined, 'DB');

    await migrate(db, {
      migrationsFolder: './drizzle',
      migrationsTable: 'drizzle_migrations',
    });

    logger.info('Migraciones ejecutadas correctamente', undefined, 'DB');
  } catch (error) {
    logger.error('Error al ejecutar migraciones', error as Error, 'DB');
    throw error;
  }
}

// Ejecutar migraciones automáticamente en producción
if (process.env.NODE_ENV === 'production' && dbReady) {
  runMigrations().catch(err => {
    console.error('❌ Error crítico al ejecutar migraciones:', err);
    process.exit(1);
  });
}
