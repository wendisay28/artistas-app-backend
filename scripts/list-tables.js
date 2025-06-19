import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function listTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    // Listar todas las tablas en el esquema público
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nTablas en la base de datos:');
    console.log('----------------------------');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error al listar las tablas:', error);
  } finally {
    await client.end();
  }
}

listTables();
