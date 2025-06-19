import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Leer el archivo SQL
    const sql = readFileSync(
      join(__dirname, '../migrations/0002_initial_schema_complete.sql'), 
      'utf8'
    );

    // Conectar a la base de datos
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Ejecutar el script SQL
    await client.query(sql);
    console.log('✅ Migración aplicada exitosamente');

  } catch (error) {
    console.error('❌ Error al aplicar la migración:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
