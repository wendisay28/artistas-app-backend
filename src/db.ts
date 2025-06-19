import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle> | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set in your environment variables.",
  );
}

// Crear la conexión a la base de datos
const client = postgres(process.env.DATABASE_URL, { max: 1 });

export const db = globalThis.db || drizzle(client);

// Almacenar la conexión en globalThis para desarrollo en modo hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.db = db;
}

// Función para ejecutar migraciones
export async function runMigrations() {
  console.log('🔍 Configurando migraciones...');
  
  try {
    // Verificar si existe el directorio de migraciones
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const migrationsDir = path.join(process.cwd(), 'migrations');
    let hasMigrations = false;
    
    try {
      const files = await fs.readdir(migrationsDir);
      hasMigrations = files.some(file => file.endsWith('.sql'));
    } catch (err) {
      console.log('ℹ️  No se encontró el directorio de migraciones');
      return;
    }
    
    if (!hasMigrations) {
      console.log('ℹ️  No hay migraciones para aplicar');
      return;
    }
    
    console.log('🔄 Aplicando migraciones...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migraciones aplicadas correctamente');
  } catch (error) {
    console.error('❌ Error al aplicar migraciones:', error);
    console.log('⚠️  Continuando sin migraciones...');
  }
}

// Desactivar migraciones automáticas temporalmente
// Las migraciones se ejecutarán manualmente cuando sea necesario
console.log('ℹ️  Migraciones automáticas desactivadas temporalmente');