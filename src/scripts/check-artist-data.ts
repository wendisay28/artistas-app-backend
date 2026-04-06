import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    // Check if artists table still exists
    const artistsExists = await pool.query(`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='artists') AS exists
    `);
    console.log('artists table exists:', artistsExists.rows[0].exists);

    // Check a sample of users with userType='artist' and their key fields
    const artists = await pool.query(`
      SELECT id, display_name, stage_name, category_id, discipline_id, role_id,
             description, years_of_experience, hourly_rate, tags, bio, city
      FROM users
      WHERE user_type = 'artist'
      LIMIT 5
    `);
    console.log('\nArtist users count:', artists.rowCount);
    if (artists.rows.length > 0) {
      artists.rows.forEach(r => {
        console.log({
          id: r.id.slice(0, 8) + '...',
          display_name: r.display_name,
          stage_name: r.stage_name,
          category_id: r.category_id,
          discipline_id: r.discipline_id,
          description: r.description?.slice(0, 50),
          years_of_experience: r.years_of_experience,
          hourly_rate: r.hourly_rate,
          tags: r.tags,
          bio: r.bio?.slice(0, 50),
          city: r.city,
        });
      });
    }

    // Check users table columns to confirm migration was applied
    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='users' AND column_name IN (
        'stage_name','category_id','discipline_id','role_id','description',
        'years_of_experience','hourly_rate','tags','travel_availability','availability'
      )
      ORDER BY column_name
    `);
    console.log('\nArtist columns in users:', cols.rows.map((r: any) => r.column_name));

  } catch(e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}
check();
