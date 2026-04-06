import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('🔄 Conectando a DB...');
    const sql = fs.readFileSync(path.join(__dirname, '../../migrations/0055_add_gallery_featured_items.sql'), 'utf8');
    console.log('📝 Ejecutando migración 0055...');
    await pool.query(sql);
    console.log('✅ Migración aplicada');

    const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='gallery' ORDER BY ordinal_position`);
    console.log('Gallery columns:', cols.rows.map((r: any) => r.column_name).join(', '));

    const ft = await pool.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='featured_items') AS exists`);
    console.log('featured_items exists:', ft.rows[0].exists);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
