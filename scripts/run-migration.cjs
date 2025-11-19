const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    // Obtener el archivo de migración desde argumentos o usar el de posts por defecto
    const migrationFile = process.argv[2] || '0016_create_posts_tables.sql';

    console.log(`📦 Ejecutando migración: ${migrationFile}...`);

    const sqlPath = path.join(__dirname, '../migrations', migrationFile);

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Archivo de migración no encontrado: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');

    await pool.query(sql);

    console.log('✅ Migración ejecutada correctamente');
    console.log(`   Archivo: ${migrationFile}`);

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
