import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function clearAllUsersConfirm() {
  try {
    console.log('🗑️  Iniciando eliminación COMPLETA de todos los usuarios y dependencias...');

    // 1. Eliminar user_quotations
    try {
      await db.execute(sql`DELETE FROM user_quotations`);
      console.log(`📋 Cotizaciones eliminadas`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando cotizaciones:`, error?.message || error);
    }

    // 2. Eliminar user_contracts
    try {
      await db.execute(sql`DELETE FROM user_contracts`);
      console.log(`📄 Contratos eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Tabla user_contracts no existe o no tiene datos`);
    }

    // 3. Eliminar favorites
    try {
      await db.execute(sql`DELETE FROM favorites`);
      console.log(`❤️  Favoritos eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando favoritos:`, error?.message || error);
    }

    // 4. Eliminar messages
    try {
      await db.execute(sql`DELETE FROM messages`);
      console.log(`💬 Mensajes eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando mensajes:`, error?.message || error);
    }

    // 5. Eliminar follows
    try {
      await db.execute(sql`DELETE FROM follows`);
      console.log(`👥 Follows eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando follows:`, error?.message || error);
    }

    // 6. Eliminar services
    try {
      await db.execute(sql`DELETE FROM services`);
      console.log(`📦 Servicios eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando servicios:`, error?.message || error);
    }
    
    // 7. Eliminar artworks
    try {
      await db.execute(sql`DELETE FROM artworks`);
      console.log(`🖼️  Obras de arte eliminadas`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando obras:`, error?.message || error);
    }

    // 8. Eliminar artists
    try {
      await db.execute(sql`DELETE FROM artists`);
      console.log(`🎨 Artistas eliminados`);
    } catch (error: any) {
      console.log(`⚠️  Error eliminando artistas:`, error?.message || error);
    }

    // 9. Eliminar TODOS los usuarios (cualquier userType)
    const deletedUsers = await db.execute(sql`
      DELETE FROM users
    `);
    console.log(`👥 TODOS los usuarios eliminados`);

    // 10. Verificar eliminación completa
    const remainingUsers = await db.execute(sql`
      SELECT COUNT(*) as count FROM users
    `);

    const remainingArtists = await db.execute(sql`
      SELECT COUNT(*) as count FROM artists
    `);

    console.log('\n✅ Verificación final:');
    console.log(`   - Usuarios restantes: ${remainingUsers[0].count}`);
    console.log(`   - Artistas restantes: ${remainingArtists[0].count}`);

    if (remainingUsers[0].count == 0 && remainingArtists[0].count == 0) {
      console.log('🎉 ¡Eliminación COMPLETA exitosa!');
      console.log('🔄 La base de datos está completamente vacía de usuarios');
      console.log('📱 Ahora puedes registrar usuarios desde cero');
    } else {
      console.log('⚠️  Quedaron algunos registros por eliminar');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    process.exit(1);
  }
}

clearAllUsersConfirm();
