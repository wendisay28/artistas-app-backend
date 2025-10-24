import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL no está definida');
    process.exit(1);
  }

  console.log('🔄 Conectando a la base de datos...');

  const sql = postgres(connectionString, {
    max: 1,
    ssl: 'require',
  });

  try {
    const migrationPath = path.join(__dirname, '../../migrations/0014_add_user_documents.sql');
    console.log('📄 Leyendo migración:', migrationPath);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚙️  Ejecutando migración...');
    await sql.unsafe(migrationSQL);

    console.log('✅ Migración ejecutada exitosamente');
    console.log('📋 Tabla user_documents creada');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

runMigration();
