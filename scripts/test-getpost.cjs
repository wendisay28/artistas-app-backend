const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Simular la query exacta de Drizzle
    const result = await pool.query(`
      SELECT
        p.id,
        p.content,
        p.type,
        p.is_pinned,
        p.is_public,
        p.like_count,
        p.comment_count,
        p.share_count,
        p.view_count,
        p.created_at,
        p.updated_at,
        u.id as "author_id",
        (u.first_name || ' ' || COALESCE(u.last_name, '')) as "author_name",
        u.profile_image_url as "author_avatar",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pm.id,
                'url', pm.url,
                'type', pm.type,
                'thumbnailUrl', pm.thumbnail_url
              ) ORDER BY pm."order" ASC, pm.id ASC
            )
            FROM post_media pm
            WHERE pm.post_id = p.id
          ),
          '[]'::json
        ) as media
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = 3
    `);

    console.log('\n🔍 Resultado de la query simulada de Drizzle:');
    console.log('Filas encontradas:', result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
})();
