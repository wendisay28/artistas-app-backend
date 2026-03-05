import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function clearArtistsSafe() {
  try {
    console.log('🗑️  Iniciando eliminación segura de artistas y dependencias...');

    // 1. Eliminar user_quotations (la tabla que causó el error)
    const deletedQuotations = await db.execute(sql`
      DELETE FROM user_quotations
      WHERE artist_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`📋 Cotizaciones de usuarios eliminadas`);

    // 2. Eliminar user_contracts
    try {
      const deletedContracts = await db.execute(sql`
        DELETE FROM user_contracts
        WHERE client_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        ) OR artist_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        )
      `);
      console.log(`📄 Contratos eliminados`);
    } catch (error) {
      console.log(`⚠️  Tabla user_contracts no existe o no tiene datos`);
    }

    // 3. Eliminar favorites
    try {
      const deletedFavorites = await db.execute(sql`
        DELETE FROM favorites
        WHERE user_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        ) OR target_user_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        )
      `);
      console.log(`❤️  Favoritos eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando favoritos:`, error?.message || error);
    }

    // 4. Eliminar messages
    try {
      const deletedMessages = await db.execute(sql`
        DELETE FROM messages
        WHERE sender_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        ) OR receiver_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        )
      `);
      console.log(`💬 Mensajes eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando mensajes:`, error?.message || error);
    }

    // 5. Eliminar follows
    try {
      const deletedFollows = await db.execute(sql`
        DELETE FROM follows
        WHERE follower_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        ) OR following_id IN (
          SELECT id FROM users WHERE user_type = 'artist'
        )
      `);
      console.log(`👥 Follows eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando follows:`, error?.message || error);
    }

    // 6. Eliminar services de artistas
    const deletedServices = await db.execute(sql`
      DELETE FROM services
      WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`📦 Servicios eliminados`);
    
    // 7. Eliminar obras de arte de artistas
    const deletedArtworks = await db.execute(sql`
      DELETE FROM artworks
      WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'artist'
      )
    `);
    console.log(`🖼️  Obras de arte eliminadas`);

    // 8. Eliminar artistas
    const deletedArtists = await db.execute(sql`
      DELETE FROM artists
    `);
    console.log(`🎨 Artistas eliminados`);

    // 9. Eliminar usuarios con userType = 'artist'
    const deletedUsers = await db.execute(sql`
      DELETE FROM users
      WHERE user_type = 'artist'
    `);
    console.log(`👥 Usuarios artistas eliminados`);

    // 10. Verificar eliminación
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
      console.log('🔄 Los artistas ya no aparecerán en el explorador');
    } else {
      console.log('⚠️  Quedaron algunos registros por eliminar');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    process.exit(1);
  }
}

clearArtistsSafe();
