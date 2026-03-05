import { db } from '../src/db';
import { users, artists } from '../src/schema';
import { sql } from 'drizzle-orm';

async function cleanSeedData() {
  console.log('🧹 Limpiando datos de seed...');
  
  try {
    // Eliminar artistas del seed
    const deletedArtists = await db
      .delete(artists)
      .where(sql`user_id LIKE 'artist_seed_%'`);
    
    console.log(`✅ Eliminados artistas del seed`);
    
    // Eliminar usuarios del seed
    const deletedUsers = await db
      .delete(users)
      .where(sql`id LIKE 'artist_seed_%'`);
    
    console.log(`✅ Eliminados usuarios del seed`);
    
    console.log('🎉 Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error al limpiar datos de seed:', error);
    process.exit(1);
  }
}

cleanSeedData().then(() => {
  process.exit(0);
});
