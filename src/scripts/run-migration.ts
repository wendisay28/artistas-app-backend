import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando a la base de datos...');

    const migrationPath = path.join(__dirname, '../../migrations/fix_companies_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Ejecutando migración fix_companies_table.sql...');

    await pool.query(sql);

    console.log('✅ Migración completada exitosamente');

    // Verificar las columnas
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Columnas de la tabla companies:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
