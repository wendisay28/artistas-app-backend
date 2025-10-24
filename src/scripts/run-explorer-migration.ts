import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migración de explorador...\n');

    // Leer el archivo SQL
    const migrationPath = path.join(__dirname, '../migrations/add-explorer-fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Archivo de migración leído correctamente');
    console.log('📝 Ejecutando SQL...\n');

    // Dividir por statement (separados por ;)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Saltar comentarios de una línea
      if (statement.trim().startsWith('--')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Si es un error de "ya existe", lo ignoramos
          if (error.message.includes('already exists') ||
              error.message.includes('duplicate') ||
              error.message.includes('ya existe')) {
            console.log(`⚠️  Statement ${i + 1}: Ya existe (omitiendo)`);
          } else {
            console.error(`❌ Error en statement ${i + 1}:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1}: Ejecutado correctamente`);
          successCount++;
        }
      } catch (err: any) {
        console.error(`❌ Error inesperado en statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migraciones completadas: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    if (errorCount === 0) {
      console.log('🎉 ¡Migración completada exitosamente!\n');
      console.log('📋 Tablas creadas/actualizadas:');
      console.log('   • users (campos agregados)');
      console.log('   • services (nueva tabla)');
      console.log('   • artworks (nueva tabla)');
      console.log('   • events (campos agregados)');
      console.log('   • venues (campos agregados)');
      console.log('   • artists (campos agregados)');
      console.log('   • companies (campos agregados)');
      console.log('\n✨ El explorador ahora está listo para usar datos reales!\n');
    } else {
      console.log('⚠️  La migración se completó con algunos errores. Revisa los logs arriba.\n');
    }

  } catch (error: any) {
    console.error('❌ Error fatal durante la migración:', error.message);
    process.exit(1);
  }
}

// Función alternativa: ejecutar directamente con el cliente de Supabase
async function runMigrationDirect() {
  try {
    console.log('🚀 Iniciando migración directa...\n');

    const migrationPath = path.join(__dirname, '../migrations/add-explorer-fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración SQL...\n');

    // Ejecutar todo el SQL de una vez
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error al ejecutar migración:', error);
      throw error;
    }

    console.log('✅ Migración ejecutada correctamente\n');
    console.log('🎉 ¡Base de datos actualizada!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    console.log('\n📝 Si el error es "function exec_sql does not exist", ejecuta manualmente el SQL en Supabase Dashboard:');
    console.log('   1. Ve a Supabase Dashboard > SQL Editor');
    console.log('   2. Copia el contenido de: backend/src/migrations/add-explorer-fields.sql');
    console.log('   3. Pégalo y ejecuta\n');

    process.exit(1);
  }
}

// Ejecutar migración
console.log('🔧 Método de migración: Statement por statement\n');
runMigration()
  .catch(console.error);
