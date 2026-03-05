import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function clearAllUsers() {
  try {
    console.log('🔍 Revisando todos los usuarios antes de eliminar...');

    // Contar todos los usuarios
    const allUsersCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM users
    `);

    console.log(`📊 Total de usuarios en la base de datos: ${allUsersCount[0].count}`);

    // Mostrar detalles antes de eliminar
    const usersDetails = await db.execute(sql`
      SELECT id, email, display_name, user_type, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    console.log('👥 Usuarios a eliminar:');
    usersDetails.forEach((user: any) => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.display_name || 'Sin nombre'}, Tipo: ${user.user_type}`);
    });

    // Confirmación
    console.log('\n⚠️  ¿Estás seguro de que quieres eliminar TODOS los usuarios?');
    console.log('   - Todos los usuarios con cualquier userType');
    console.log('   - Todos sus datos asociados (servicios, obras, mensajes, etc.)');
    console.log('   - Esto incluye tu cuenta actual');
    console.log('\n   Para continuar, ejecuta: npm run clear-all-users-confirm');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error al revisar usuarios:', error);
    process.exit(1);
  }
}

clearAllUsers();
