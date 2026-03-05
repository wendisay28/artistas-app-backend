import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function clearArtistsWithDependencies() {
  try {
    console.log('🗑️  Iniciando eliminación completa de artistas y dependencias...');

    // 1. Eliminar cotizaciones de usuarios (user_quotations)
    const deletedQuotations = await db.execute(sql`
      DELETE FROM user_quotations
      WHERE artist_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`📋 Cotizaciones de usuarios eliminadas`);

    // 2. Eliminar contratos relacionados
    const deletedContracts = await db.execute(sql`
      DELETE FROM contracts
      WHERE client_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      ) OR artist_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`📄 Contratos eliminados`);

    // 3. Eliminar favoritos
    const deletedFavorites = await db.execute(sql`
      DELETE FROM favorites
      WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      ) OR target_user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`❤️  Favoritos eliminados`);

    // 4. Eliminar mensajes
    const deletedMessages = await db.execute(sql`
      DELETE FROM messages
      WHERE sender_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      ) OR receiver_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`💬 Mensajes eliminados`);

    // 5. Eliminar servicios de artistas
    const deletedServices = await db.execute(sql`
      DELETE FROM services
      WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`📦 Servicios eliminados`);
    
    // 6. Eliminar obras de arte de artistas
    const deletedArtworks = await db.execute(sql`
      DELETE FROM artworks
      WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`🖼️  Obras de arte eliminadas`);

    // 7. Eliminar artistas
    const deletedArtists = await db.execute(sql`
      DELETE FROM artists
    `);
    console.log(`🎨 Artistas eliminados`);

    // 8. Eliminar usuarios con userType = 'artist'
    const deletedUsers = await db.execute(sql`
      DELETE FROM users
      WHERE user_type = 'artist'
    `);
    console.log(`👥 Usuarios artistas eliminados`);

    // 9. Verificar eliminación
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

clearArtistsWithDependencies();
