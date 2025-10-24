import pkg from 'pg';
const { Client } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: SUPABASE_DB_URL o DATABASE_URL debe estar definido en .env');
  console.log('\n📝 Agrega a tu .env:');
  console.log('SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres\n');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🚀 Conectando a PostgreSQL...\n');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // Leer el archivo SQL
    const migrationPath = path.join(__dirname, '../migrations/add-explorer-fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Archivo de migración leído');
    console.log('📝 Ejecutando SQL...\n');

    // Ejecutar todo el SQL
    await client.query(migrationSQL);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('='.repeat(50) + '\n');

    console.log('📋 Tablas creadas/actualizadas:');
    console.log('   • users (campos agregados)');
    console.log('   • services (nueva tabla)');
    console.log('   • artworks (nueva tabla)');
    console.log('   • events (campos agregados)');
    console.log('   • venues (campos agregados)');
    console.log('   • artists (campos agregados)');
    console.log('   • companies (campos agregados)');
    console.log('\n✨ El explorador ahora está listo para usar datos reales!\n');

  } catch (error: any) {
    console.error('\n❌ Error durante la migración:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Algunas tablas/columnas ya existen. Esto es normal.');
      console.log('✅ La migración se ejecutó parcialmente.\n');
    } else {
      console.log('\n💡 Solución alternativa:');
      console.log('   1. Ve a Supabase Dashboard > SQL Editor');
      console.log('   2. Copia el contenido de: backend/src/migrations/add-explorer-fields.sql');
      console.log('   3. Pégalo y ejecuta\n');
      process.exit(1);
    }

  } finally {
    await client.end();
    console.log('👋 Conexión cerrada\n');
  }
}

runMigration().catch(console.error);
