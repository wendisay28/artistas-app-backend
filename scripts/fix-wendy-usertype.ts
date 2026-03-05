import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function fixUserType() {
  const userId = 'aJKaLH86nfOfMDCFpIBYkal6ZE22';

  console.log('🔍 Verificando usuario actual...');
  const [user] = await db.execute(sql`
    SELECT id, email, user_type FROM users WHERE id = ${userId}
  `);
  console.log('Antes:', user);

  console.log('\n🔧 Actualizando user_type a "artist"...');
  await db.execute(sql`
    UPDATE users SET user_type = 'artist' WHERE id = ${userId}
  `);

  const [updated] = await db.execute(sql`
    SELECT id, email, user_type FROM users WHERE id = ${userId}
  `);
  console.log('Después:', updated);

  console.log('\n✅ Listo! user_type actualizado a "artist".');
  process.exit(0);
}

fixUserType().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
