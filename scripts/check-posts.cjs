const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('\n🔍 Verificando posts en la base de datos...\n');

    const result = await pool.query('SELECT id, content, author_id, type, created_at FROM posts ORDER BY created_at DESC LIMIT 5');
    console.log('📝 Posts encontrados:', result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));

    console.log('\n🔍 Verificando usuarios...\n');
    const userResult = await pool.query('SELECT id, email, first_name, last_name FROM users LIMIT 3');
    console.log('👤 Usuarios encontrados:', userResult.rows.length);
    console.log(JSON.stringify(userResult.rows, null, 2));

    if (result.rows.length > 0) {
      const postId = result.rows[0].id;
      console.log(`\n🔍 Verificando post #${postId} con join de usuario...\n`);

      const joinResult = await pool.query(`
        SELECT
          p.id,
          p.content,
          p.author_id,
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.email
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = $1
      `, [postId]);

      console.log('🔗 Resultado del JOIN:');
      console.log(JSON.stringify(joinResult.rows, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
})();
