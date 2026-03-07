import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL no está definida');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function runMigrations() {
  try {
    console.log('🔄 Ejecutando migraciones...');
    
    // Leer y ejecutar migración de aceptación legal
    const legalMigration = fs.readFileSync(
      path.join(__dirname, 'migrations/add_legal_acceptance_fields.sql'), 
      'utf8'
    );
    await client.unsafe(legalMigration);
    console.log('✅ Migración de aceptación legal completada');
    
    // Leer y ejecutar migración de modo de entrega
    const deliveryMigration = fs.readFileSync(
      path.join(__dirname, 'migrations/add_delivery_mode.sql'), 
      'utf8'
    );
    await client.unsafe(deliveryMigration);
    console.log('✅ Migración de modo de entrega completada');
    
    // Leer y ejecutar migración de Stripe
    const stripeMigration = fs.readFileSync(
      path.join(__dirname, 'migrations/add_stripe_fields.sql'), 
      'utf8'
    );
    await client.unsafe(stripeMigration);
    console.log('✅ Migración de campos Stripe completada');
    
    console.log('🎉 Todas las migraciones completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
