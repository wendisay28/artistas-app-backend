import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function clearArtistsConfirm() {
  try {
    console.log('🗑️  Iniciando eliminación de artistas y usuarios...');

    // 1. Eliminar servicios de artistas
    const deletedServices = await db.execute(sql`
      DELETE FROM services
      WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    
    console.log(`📦 Servicios eliminados`);

    // 2. Eliminar obras de arte de artistas
    const deletedArtworks = await db.execute(sql`
      DELETE FROM artworks
      WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    
    console.log(`🖼️  Obras de arte eliminadas`);

    // 3. Eliminar artistas
    const deletedArtists = await db.execute(sql`
      DELETE FROM artists
    `);
    
    console.log(`🎨 Artistas eliminados`);

    // 4. Eliminar usuarios con userType = 'artist'
    const deletedUsers = await db.execute(sql`
      DELETE FROM users
      WHERE user_type = 'artist'
    `);
    
    console.log(`👥 Usuarios artistas eliminados`);

    // 5. Verificar eliminación
    const remainingUsers = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE user_type = 'artist'
    `);

    const remainingArtists = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM artists
    `);

    console.log('\n✅ Verificación final:');
    console.log(`   - Usuarios artistas restantes: ${remainingUsers[0].count}`);
    console.log(`   - Artistas restantes: ${remainingArtists[0].count}`);

    if (remainingUsers[0].count == 0 && remainingArtists[0].count == 0) {
      console.log('🎉 ¡Eliminación completada exitosamente!');
    } else {
      console.log('⚠️  Quedaron algunos registros por eliminar');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    process.exit(1);
  }
}

clearArtistsConfirm();
