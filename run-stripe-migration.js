import postgres from 'postgres';

const connectionString = "postgresql://BuscArtistas_owner:npg_VF6j9YmknxAJ@ep-old-grass-ac4cou20-pooler.sa-east-1.aws.neon.tech/BuscArtistas?sslmode=require&channel_binding=require";

async function runStripeMigration() {
  try {
    console.log('🔄 Ejecutando migración de Stripe...');
    
    const client = postgres(connectionString);
    
    // Agregar campos de Stripe
    await client`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_status VARCHAR(20) DEFAULT 'disconnected';
    `;
    await client`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
    `;
    await client`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_holder_name VARCHAR(255);
    `;
    await client`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_email VARCHAR(255);
    `;
    await client`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_phone VARCHAR(50);
    `;
    await client`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_type VARCHAR(10);
    `;
    
    console.log('✅ Campos de Stripe agregados exitosamente');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Error ejecutando migración de Stripe:', error);
    process.exit(1);
  }
}

runStripeMigration();
