import { db } from '../src/db.js';
import { users, artists, services, artworks } from '../src/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Script para eliminar todos los artistas y usuarios del explorador
 * ⚠️  ESTE SCRIPT BORRARÁ TODOS LOS REGISTROS DE ARTISTAS Y USUARIOS RELACIONADOS
 */
async function clearArtistsAndUsers() {
  try {
    console.log('🔍 Revisando datos antes de eliminar...');

    // Contar usuarios artistas
    const artistUsers = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.userType, 'artist'));
    
    console.log(`📊 Usuarios con userType='artist': ${artistUsers.length}`);

    // Contar artistas
    const artistsCount = await db
      .select({ count: artists.id })
      .from(artists);
    
    console.log(`📊 Registros en tabla artists: ${artistsCount.length}`);

    // Mostrar detalles antes de eliminar
    const usersDetails = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.userType, 'artist'));

    console.log('👥 Usuarios artistas a eliminar:');
    usersDetails.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.displayName || `${user.firstName} ${user.lastName}`}`);
    });

    const artistsDetails = await db
      .select({
        id: artists.id,
        userId: artists.userId,
        artistName: artists.artistName,
        createdAt: artists.createdAt,
      })
      .from(artists);

    console.log('🎨 Registros de artists a eliminar:');
    artistsDetails.forEach(artist => {
      console.log(`  - ID: ${artist.id}, User ID: ${artist.userId}, Nombre: ${artist.artistName}`);
    });

    // Confirmación
    console.log('\n⚠️  ¿Estás seguro de que quieres eliminar todos estos datos?');
    console.log('   - Todos los usuarios con userType = "artist"');
    console.log('   - Todos los registros en la tabla artists');
    console.log('   - Todos los servicios y obras de arte asociados');
    console.log('\n   Para continuar, ejecuta: npm run clear-artists-confirm');

    return {
      usersCount: artistUsers.length,
      artistsCount: artistsCount.length,
      users: usersDetails,
      artists: artistsDetails,
    };

  } catch (error) {
    console.error('❌ Error al revisar datos:', error);
    throw error;
  }
}

/**
 * Ejecuta la eliminación (solo después de confirmación)
 */
async function clearArtistsConfirm() {
  try {
    console.log('🗑️  Iniciando eliminación de artistas y usuarios...');

    // 1. Obtener IDs de usuarios artistas
    const artistUserIds = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userType, 'artist'));

    const userIds = artistUserIds.map(u => u.id);

    if (userIds.length === 0) {
      console.log('✅ No hay usuarios artistas para eliminar');
      return;
    }

    // 2. Eliminar servicios de artistas
    const deletedServices = await db
      .delete(services)
      .where(eq(services.userId, userIds[0])); // Drizzle no soporta IN con arrays directamente
    
    // Para múltiples usuarios, necesitamos hacer un bucle o usar SQL directo
    for (const userId of userIds) {
      await db.delete(services).where(eq(services.userId, userId));
      await db.delete(artworks).where(eq(artworks.userId, userId));
    }

    console.log(`📦 Servicios eliminados para ${userIds.length} usuarios`);

    // 3. Eliminar artistas
    const deletedArtists = await db.delete(artists);
    console.log(`🎨 Artistas eliminados`);

    // 4. Eliminar usuarios con userType = 'artist'
    const deletedUsers = await db
      .delete(users)
      .where(eq(users.userType, 'artist'));
    
    console.log(`👥 Usuarios artistas eliminados`);

    // 5. Verificar eliminación
    const remainingUsers = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.userType, 'artist'));

    const remainingArtists = await db
      .select({ count: artists.id })
      .from(artists);

    console.log('\n✅ Verificación final:');
    console.log(`   - Usuarios artistas restantes: ${remainingUsers.length}`);
    console.log(`   - Artistas restantes: ${remainingArtists.length}`);

    if (remainingUsers.length === 0 && remainingArtists.length === 0) {
      console.log('🎉 ¡Eliminación completada exitosamente!');
    } else {
      console.log('⚠️  Quedaron algunos registros por eliminar');
    }

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'confirm') {
    clearArtistsConfirm();
  } else {
    clearArtistsAndUsers();
  }
}

export { clearArtistsAndUsers, clearArtistsConfirm };
