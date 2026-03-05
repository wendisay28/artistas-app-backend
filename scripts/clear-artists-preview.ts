import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function clearArtistsAndUsers() {
  try {
    console.log('🔍 Revisando datos antes de eliminar...');

    // Contar usuarios artistas
    const artistUsers = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE user_type = 'artist'
    `);

    console.log(`📊 Usuarios con userType='artist': ${artistUsers[0].count}`);

    // Contar artistas
    const artistsCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM artists
    `);
    
    console.log(`📊 Registros en tabla artists: ${artistsCount[0].count}`);

    // Mostrar detalles antes de eliminar
    const usersDetails = await db.execute(sql`
      SELECT id, email, display_name, first_name, last_name, user_type, created_at
      FROM users
      WHERE user_type = 'artist'
      ORDER BY id
    `);

    console.log('👥 Usuarios artistas a eliminar:');
    usersDetails.forEach((user: any) => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.display_name || `${user.first_name} ${user.last_name}`}`);
    });

    const artistsDetails = await db.execute(sql`
      SELECT id, user_id, artist_name, created_at
      FROM artists
      ORDER BY id
    `);

    console.log('🎨 Registros de artists a eliminar:');
    artistsDetails.forEach((artist: any) => {
      console.log(`  - ID: ${artist.id}, User ID: ${artist.user_id}, Nombre: ${artist.artist_name}`);
    });

    // Confirmación
    console.log('\n⚠️  ¿Estás seguro de que quieres eliminar todos estos datos?');
    console.log('   - Todos los usuarios con userType = "artist"');
    console.log('   - Todos los registros en la tabla artists');
    console.log('   - Todos los servicios y obras de arte asociados');
    console.log('\n   Para continuar, ejecuta: npm run clear-artists-confirm');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error al revisar datos:', error);
    process.exit(1);
  }
}

clearArtistsAndUsers();
